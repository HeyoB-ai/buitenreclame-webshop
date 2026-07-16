/**
 * Fullscreen editor for a saved AI-generated poster. It re-uses the SAME
 * template composer (PosterComposer) as the creation modal, so every change —
 * kop, subregel, aanbieding, sjabloon, kleurthema, hoofdletters, logo — updates
 * the live canvas preview immediately. On "Aanpassingen bewaren" the poster is
 * re-composed to a fresh PNG and the updated design is persisted on the cart
 * item.
 */

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Location } from '../types';
import PosterComposer from './PosterComposer';
import {
  composeToDataUrl,
  ratioForType,
  type PosterFields,
  type TemplateKey,
  type ThemeKey,
} from '../lib/posterComposer';

export interface PosterPayload {
  fields: PosterFields;
  template: TemplateKey;
  theme: ThemeKey;
  photoUrl: string | null;
}

interface Props {
  location: Location;
  payload: PosterPayload;
  onApply: (payload: PosterPayload, previewUrl: string) => void;
  onClose: () => void;
}

export default function PosterEditor({ location, payload, onApply, onClose }: Props) {
  const [fields, setFields] = useState<PosterFields>(payload.fields);
  const [template, setTemplate] = useState<TemplateKey>(payload.template);
  const [theme, setTheme] = useState<ThemeKey>(payload.theme);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratio = ratioForType(location.type);

  const handleApply = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const previewUrl = await composeToDataUrl({ photoUrl: payload.photoUrl, ratio, fields, template, theme });
      onApply({ fields, template, theme, photoUrl: payload.photoUrl }, previewUrl);
    } catch {
      setError('Kon de poster niet samenstellen. Probeer het opnieuw.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white border border-line rounded-card overflow-hidden shadow-soft-lg max-w-3xl w-full flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-line flex justify-between items-center bg-paper-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-cobalt font-mono uppercase tracking-wider font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Uiting aanpassen
            </div>
            <p className="text-xs text-mist mt-1">
              Formaat <strong className="text-ink">{location.dimensions.split('(')[0].trim()}</strong> · {location.street}, {location.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-mist hover:text-ink bg-paper-2 hover:bg-line p-2 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live composer */}
        <div className="p-5 overflow-y-auto flex-1">
          <PosterComposer
            photoUrl={payload.photoUrl}
            ratio={ratio}
            fields={fields}
            onFieldsChange={setFields}
            template={template}
            onTemplateChange={setTemplate}
            theme={theme}
            onThemeChange={setTheme}
            previewWidth={300}
          />
          {error && <p className="text-[11px] text-red-600 font-medium mt-3">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-paper-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-paper-2 border border-line text-mist transition-all cursor-pointer shadow-soft"
          >
            Annuleren
          </button>
          <button
            onClick={handleApply}
            disabled={isSaving || !fields.headline.trim()}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isSaving && fields.headline.trim()
                ? 'bg-cobalt hover:bg-cobalt-deep text-white shadow-soft'
                : 'bg-paper-2 text-mist-2 cursor-not-allowed border border-line'
            }`}
          >
            {isSaving ? 'Poster samenstellen…' : 'Aanpassingen bewaren'}
          </button>
        </div>
      </div>
    </div>
  );
}
