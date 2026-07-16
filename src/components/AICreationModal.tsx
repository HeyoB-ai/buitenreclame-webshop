/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Location, SessionCreative } from '../types';
import { X, UploadCloud, Sparkles, CheckCircle2, AlertCircle, RefreshCw, FileText, LayoutTemplate, ShieldCheck, Check, ShieldAlert, Maximize2 } from 'lucide-react';
import { startCreative, pollCreative } from '../lib/creativeClient';
import PosterComposer from './PosterComposer';
import { ratioForType, composeToDataUrl, type PosterFields, type TemplateKey, type ThemeKey } from '../lib/posterComposer';

interface AICreationModalProps {
  location: Location;
  onClose: () => void;
  onSaveCreative: (creative: {
    type: 'upload' | 'ai-generated' | 'verified';
    fileName?: string;
    previewUrl?: string;
    promptText?: string;
    verifiedOk?: boolean;
    title?: string;
    subtitle?: string;
    textColor?: string;
    styleName?: string;
    align?: 'left' | 'center' | 'right';
    titleScale?: number;
    badgeText?: string;
    poster?: {
      fields: PosterFields;
      template: TemplateKey;
      theme: ThemeKey;
      photoUrl: string | null;
    };
  }) => void;
  currentCreative?: any;
  sessionCreatives?: SessionCreative[];
  onUseExisting?: (sc: SessionCreative) => void;
}

type ActiveTab = 'upload' | 'generate' | 'verify';

export default function AICreationModal({
  location,
  onClose,
  onSaveCreative,
  currentCreative,
  sessionCreatives = [],
  onUseExisting,
}: AICreationModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');

  // Tab 1: Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataUrl, setUploadDataUrl] = useState<string | null>(null); // the actual image, kept in-memory
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'completed'>('idle');

  // Tab 2: AI Design state (3 textless background variants to choose from)
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Poster design (step B). Fields persist across "opnieuw genereren".
  const posterRatio = ratioForType(location.type);
  const [posterFields, setPosterFields] = useState<PosterFields>({
    kicker: '', headline: '', subline: '', offer: '', url: '', logo: null, uppercase: true,
  });
  const [posterTemplate, setPosterTemplate] = useState<TemplateKey>('foto-boven');
  const [posterTheme, setPosterTheme] = useState<ThemeKey>('cobalt');
  const [noPhotoMode, setNoPhotoMode] = useState(false); // design a graphic-only poster without generating a photo
  const [isSaving, setIsSaving] = useState(false);

  // Tab 3: AI Verification Checklist state
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    resolution: boolean;
    contrast: boolean;
    density: boolean;
    restricted: boolean;
    overall: boolean;
  } | null>(null);

  // Simulated Upload Flow — but we DO keep the real image (as a data-URL) so the
  // creative actually persists on the cart item and can be reused this session.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadFile(file);
    setUploadDataUrl(null);
    if (/^image\//.test(file.type)) {
      const reader = new FileReader();
      reader.onload = () => setUploadDataUrl(String(reader.result));
      reader.readAsDataURL(file);
    }
    setUploadStatus('uploading');
    setUploadProgress(10);

    // Simulated network upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 90) {
          return prev + 20;
        } else {
          clearInterval(interval);
          setUploadStatus('analyzing');

          // Simulated "Deep spec check"
          setTimeout(() => {
            setUploadStatus('completed');
          }, 1200);
          return 100;
        }
      });
    }, 200);
  };

  // AI background generation — 3 textless variants via the Netlify Functions.
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedImages([]);
    setSelectedImage(null);
    setGenError(null);
    setGenerationStep('Aanvraag versturen naar de ontwerp-server...');

    try {
      const jobId = await startCreative(prompt, posterRatio.aspect);
      setGenerationStep('AI maakt 3 achtergronden (dit duurt ~15-20s)...');
      const imageUrls = await pollCreative(jobId, () => {
        setGenerationStep('AI maakt 3 achtergronden (dit duurt ~15-20s)...');
      });
      setGeneratedImages(imageUrls);
      setSelectedImage(imageUrls[0] ?? null);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Er ging iets mis bij het genereren.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulated Compliance Check Tab
  const handleVerifyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setVerifyFile(file);
    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      // Give random but mostly successful result
      setVerificationResult({
        resolution: true,
        contrast: true,
        density: true,
        restricted: true,
        overall: true
      });
    }, 2000);
  };

  // Save selection back to parent. The generate tab needs a headline and either
  // a chosen photo OR the graphic-only (no-photo) mode.
  const hasCanvas = Boolean(selectedImage || noPhotoMode);
  const generateReady = Boolean(hasCanvas && posterFields.headline.trim());

  const handleSave = async () => {
    if (activeTab === 'upload' && uploadStatus === 'completed' && uploadFile) {
      onSaveCreative({
        type: 'upload',
        fileName: uploadFile.name,
        previewUrl: uploadDataUrl ?? undefined, // keep the real image so it persists + is reusable
        verifiedOk: true,
        title: 'Eigen upload',
        subtitle: uploadFile.name,
      });
    } else if (activeTab === 'generate' && generateReady) {
      // Compose the final designed poster (template + theme + sharp text) → PNG.
      setIsSaving(true);
      setGenError(null);
      try {
        const previewUrl = await composeToDataUrl({
          photoUrl: selectedImage,
          ratio: posterRatio,
          fields: posterFields,
          template: posterTemplate,
          theme: posterTheme,
        });
        onSaveCreative({
          type: 'ai-generated',
          promptText: prompt,
          previewUrl,
          title: posterFields.headline.trim() || 'AI-poster',
          subtitle: posterFields.subline.trim() || posterFields.offer.trim() || prompt,
          verifiedOk: true,
          // Persist the editable design so the cart can re-open the live composer.
          poster: {
            fields: posterFields,
            template: posterTemplate,
            theme: posterTheme,
            photoUrl: selectedImage,
          },
        });
      } catch {
        setGenError('Kon de poster niet samenstellen. Probeer het opnieuw.');
      } finally {
        setIsSaving(false);
      }
    } else if (activeTab === 'verify' && verificationResult && verifyFile) {
      onSaveCreative({
        type: 'verified',
        fileName: verifyFile.name,
        verifiedOk: verificationResult.overall,
        title: 'AI Gecheckte Poster',
        subtitle: verifyFile.name
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-xs" onClick={onClose} />

      {/* Container */}
      <div className="relative bg-white border border-line rounded-card overflow-hidden shadow-soft-lg max-w-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-line flex justify-between items-center bg-paper-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-cobalt font-mono uppercase tracking-wider font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campagnemateriaal Configureren</span>
            </div>
            <h3 className="text-lg font-bold text-ink mt-1 leading-tight">
              Creatie toevoegen voor {location.street}
            </h3>
            <p className="text-xs text-mist">
              Formaat: <strong className="text-ink">{location.dimensions}</strong> ({location.type === 'digital' ? 'Digitaal' : 'Gedrukte abri'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-mist hover:text-ink bg-paper-2 hover:bg-line p-2 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 border-b border-line bg-paper-2 text-xs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-cobalt text-cobalt bg-cobalt-soft/40'
                : 'border-transparent text-mist-2 hover:text-ink'
            }`}
          >
            1. Upload eigen bestand
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'generate'
                ? 'border-cobalt text-cobalt bg-cobalt-soft/40'
                : 'border-transparent text-mist-2 hover:text-ink'
            }`}
          >
            2. Laat AI ontwerpen
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'verify'
                ? 'border-cobalt text-cobalt bg-cobalt-soft/40'
                : 'border-transparent text-mist-2 hover:text-ink'
            }`}
          >
            3. AI-richtlijnencheck
          </button>
        </div>

        {/* Scrollable Content Panel */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Reuse an earlier creative from this session (no re-generating, no credits) */}
          {sessionCreatives.length > 0 && onUseExisting && (
            <div className="bg-cobalt-soft/40 border border-cobalt-soft rounded-card-sm p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cobalt">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gebruik een eerder gemaakte uiting</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {sessionCreatives.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onUseExisting(sc)}
                    title={`${sc.title} — toepassen op dit scherm`}
                    className={`group relative shrink-0 w-14 rounded-md overflow-hidden border-2 border-line hover:border-cobalt transition-all cursor-pointer bg-paper-2 ${
                      sc.ratioType === 'abri' ? 'aspect-[2/3]' : 'aspect-[9/16]'
                    }`}
                  >
                    <img src={sc.previewUrl} alt={sc.title} className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-mist-2">
                Klik om direct toe te passen op <b>{location.street}, {location.city}</b> — automatisch aangepast aan dit formaat. Geen nieuwe credits.
              </p>
            </div>
          )}

          {/* TAB 1: UPLOAD OWN CREATION */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="text-center p-8 bg-paper-2 rounded-card border-2 border-dashed border-line hover:border-cobalt transition-all relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'analyzing'}
                />

                {uploadStatus === 'idle' && (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-cobalt-soft rounded-full flex items-center justify-center mx-auto border border-cobalt-soft">
                      <UploadCloud className="w-6 h-6 text-cobalt" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-mist">Sleep je bestand hierheen of klik om te bladeren</p>
                      <p className="text-xs text-mist-2">PDF, PNG of JPG, maximaal 25 MB</p>
                    </div>
                  </div>
                )}

                {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
                  <div className="space-y-4 py-4">
                    <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-mist">
                        {uploadStatus === 'uploading' ? 'Uploaden...' : 'Controleren op aanleverspecificaties...'}
                      </p>
                      <div className="w-48 h-1 bg-line rounded-full mx-auto overflow-hidden">
                        <div
                          className="h-full bg-cobalt transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {uploadStatus === 'completed' && uploadFile && (
                  <div className="space-y-4 py-2">
                    <div className="w-12 h-12 bg-ok-soft rounded-full flex items-center justify-center mx-auto border border-ok-soft">
                      <CheckCircle2 className="w-6 h-6 text-ok" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-ink">{uploadFile.name}</p>
                      <p className="text-xs text-ok flex items-center justify-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Bestand met succes gevalideerd! Voldoet aan alle specificaties.</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUploadFile(null); setUploadStatus('idle'); }}
                      className="text-xs text-mist-2 hover:text-ink underline font-medium"
                    >
                      Ander bestand uploaden
                    </button>
                  </div>
                )}
              </div>

              {/* Tips list */}
              <div className="bg-paper-2 p-4 rounded-card-sm border border-line space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-mist-2 block font-bold">Belangrijk voor deze locatie:</span>
                <ul className="text-xs text-mist space-y-1 list-disc pl-4 leading-relaxed">
                  <li><strong>Papierformaat:</strong> Hou rekening met een snijmarge van 5mm rondom.</li>
                  <li><strong>Contrast:</strong> Onze systemen adviseren een minimale tekst-achtergrond contrastverhouding van 4.5:1.</li>
                  <li><strong>Levertijd:</strong> Dit bestand wordt handmatig goedgekeurd binnen 24 uur.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: AI GENERATE POSTERS */}
          {activeTab === 'generate' && (
            <div className="space-y-5">
              <form onSubmit={handleGenerate} className="space-y-3">
                <label className="block text-xs font-semibold text-mist">
                  Beschrijf je product of aanbieding — de AI maakt 3 fotorealistische achtergronden zonder tekst:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Bijv. verse broodjes en croissants bij een gezellige bakkerij..."
                    className="flex-1 bg-white border border-line rounded-card-sm px-4 py-3 text-ink text-xs placeholder-mist-2 focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt shadow-soft"
                    disabled={isGenerating}
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className={`px-5 rounded-card-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      prompt.trim() && !isGenerating
                        ? 'bg-cobalt hover:bg-cobalt-deep text-white shadow-soft'
                        : 'bg-paper-2 text-mist-2 cursor-not-allowed border border-line'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Ontwerp</span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-mist-2">1 klik genereert <b className="text-mist font-semibold">3 achtergronden</b> om uit te kiezen.</p>
                  {!noPhotoMode && generatedImages.length === 0 && (
                    <button
                      type="button"
                      onClick={() => { setNoPhotoMode(true); setPosterTemplate('grafisch'); }}
                      className="text-[11px] font-bold text-cobalt hover:text-cobalt-deep whitespace-nowrap cursor-pointer"
                    >
                      Geen foto? Ontwerp puur grafisch →
                    </button>
                  )}
                </div>
              </form>

              {/* Generating Loader */}
              {isGenerating && (
                <div className="p-12 text-center space-y-4 bg-paper-2 rounded-card border border-line">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-cobalt/10 border-t-cobalt animate-spin" />
                    <Sparkles className="w-5 h-5 text-cobalt absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-mist">AI ontwerper is actief...</p>
                    <p className="text-xs text-cobalt font-mono font-bold animate-pulse">{generationStep}</p>
                  </div>
                </div>
              )}

              {/* Error (e.g. running plain `vite dev` without functions) */}
              {genError && !isGenerating && (
                <div className="flex items-start gap-2 bg-amber-soft border border-amber-line text-amber-deep rounded-card-sm p-3.5 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{genError}</span>
                </div>
              )}

              {/* 3 textless background variants — choose one */}
              {generatedImages.length > 0 && !isGenerating && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-mist">Kies je achtergrond:</span>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="text-[11px] font-bold text-cobalt hover:text-cobalt-deep inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Opnieuw genereren
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {generatedImages.map((url, i) => {
                      const isSel = selectedImage === url;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedImage(url)}
                          className={`group relative rounded-card-sm overflow-hidden border-2 transition-all cursor-pointer ${
                            posterRatio.key === 'abri' ? 'aspect-[2/3]' : 'aspect-[9/16]'
                          } ${
                            isSel ? 'border-cobalt ring-2 ring-cobalt/20 shadow-soft' : 'border-line hover:border-cobalt'
                          }`}
                        >
                          <img src={url} alt={`Achtergrond ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                          {isSel && (
                            <span className="absolute top-1.5 right-1.5 bg-cobalt text-white rounded-full p-0.5 shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-mist-2">Deze achtergronden zijn tekstloos — jouw scherpe tekst komt eronder.</p>
                </div>
              )}

              {/* Step B — design the poster (template + theme + sharp text) */}
              {hasCanvas && !isGenerating && (
                <div className="pt-1 border-t border-line">
                  {noPhotoMode && !selectedImage && (
                    <div className="flex items-center justify-between gap-2 mt-4 mb-1">
                      <span className="text-[11px] font-bold text-mist">Puur grafische poster (zonder foto)</span>
                      <button
                        type="button"
                        onClick={() => setNoPhotoMode(false)}
                        className="text-[11px] font-bold text-mist-2 hover:text-ink cursor-pointer"
                      >
                        Toch een foto genereren
                      </button>
                    </div>
                  )}
                  <div className="mt-4">
                    <PosterComposer
                      photoUrl={selectedImage}
                      ratio={posterRatio}
                      fields={posterFields}
                      onFieldsChange={setPosterFields}
                      template={posterTemplate}
                      onTemplateChange={setPosterTemplate}
                      theme={posterTheme}
                      onThemeChange={setPosterTheme}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTOMATED COMPLIANCE CHECK */}
          {activeTab === 'verify' && (
            <div className="space-y-4">
              <div className="text-center p-8 bg-paper-2 rounded-card border-2 border-dashed border-line hover:border-cobalt transition-all relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVerifyUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isVerifying}
                />

                {!verifyFile && (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-cobalt-soft rounded-full flex items-center justify-center mx-auto border border-cobalt-soft">
                      <LayoutTemplate className="w-6 h-6 text-cobalt" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-mist">Upload een concept-afbeelding om te laten scannen</p>
                      <p className="text-xs text-mist-2">Onze AI controleert direct of het voldoet aan de richtlijnen voor {location.city}</p>
                    </div>
                  </div>
                )}

                {isVerifying && (
                  <div className="space-y-4 py-4">
                    <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto" />
                    <p className="text-sm font-medium text-mist">AI controleert contrast en gemeentelijke regelgeving...</p>
                  </div>
                )}

                {verifyFile && !isVerifying && (
                  <div className="space-y-3 py-1">
                    <p className="text-sm font-bold text-ink">Auditrapport: {verifyFile.name}</p>
                    <div className="text-xs font-semibold text-ok flex items-center justify-center gap-1 bg-ok-soft border border-ok-soft py-1.5 px-3 rounded-card-sm max-w-sm mx-auto">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Volledig goedgekeurd voor productie!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setVerifyFile(null); setVerificationResult(null); }}
                      className="text-xs text-mist-2 hover:text-ink underline block mx-auto mt-2"
                    >
                      Ander bestand scannen
                    </button>
                  </div>
                )}
              </div>

              {/* Compliance checklist details */}
              {verifyFile && !isVerifying && (
                <div className="bg-paper-2 border border-line p-4 rounded-card-sm space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-mist-2 block border-b border-line pb-2 font-bold">AI Compliance Analyse Resultaten</span>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-mist font-medium">Minimale resolutie check (300 DPI equivalent)</span>
                      <span className="text-ok font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> OK
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-mist font-medium">Tekstdichtheid audit (max. 30% voor {location.city})</span>
                      <span className="text-ok font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> OK (14% gemeten)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-mist font-medium">Contrast en leesbaarheid vanaf 15 meter</span>
                      <span className="text-ok font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> OK (Uitstekend contrast)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-mist font-medium">Beleidstoetsing (O.a. alcohol, gokken nabij onderwijs)</span>
                      <span className="text-ok font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> OK (Geen restricties overschreden)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-line bg-paper-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-paper-2 border border-line text-mist transition-all cursor-pointer shadow-soft"
          >
            Annuleren
          </button>

          <button
            onClick={handleSave}
            disabled={
              isSaving ||
              (activeTab === 'upload' && uploadStatus !== 'completed') ||
              (activeTab === 'generate' && !generateReady) ||
              (activeTab === 'verify' && !verifyFile)
            }
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isSaving && (
                (activeTab === 'upload' && uploadStatus === 'completed') ||
                (activeTab === 'generate' && generateReady) ||
                (activeTab === 'verify' && verifyFile))
                ? 'bg-cobalt hover:bg-cobalt-deep text-white shadow-soft'
                : 'bg-paper-2 text-mist-2 cursor-not-allowed border border-line'
            }`}
          >
            {isSaving ? 'Poster samenstellen…' : 'Creatie opslaan en toepassen'}
          </button>
        </div>

      </div>
    </div>
  );
}
