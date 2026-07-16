/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PosterFields, TemplateKey, ThemeKey } from './lib/posterComposer';
import type { Product } from './data/gemeenten';

/**
 * What hangs at a location. ESH carries two products and both take the same A0
 * poster, so this no longer drives the poster ratio — only the wording.
 */
export type LocationType = Product;

export interface LocationSpecs {
  formats: string[];
  maxTextDensity: string;
  restrictions: string[];
  deadline: string;
}

export interface LocationCoordinates {
  x: number; // percentage X on our custom mock map
  y: number; // percentage Y on our custom mock map
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  street: string;
  city: string;
  neighborhood: string;
  reach: number; // weekly reach
  price: number; // price per week
  image: string; // URL or background style
  description: string;
  dimensions: string;
  visibility: string;
  environment: string;
  specs: LocationSpecs;
  coordinates: LocationCoordinates;
  lat?: number; // real WGS84 latitude (from the gemeente data)
  lng?: number; // real WGS84 longitude
  recommendedFor: string[]; // legacy audience tags — only the mock catalogue still sets these
}

export interface TargetRegion {
  type: 'postcode' | 'provincie' | 'land';
  postcode?: string;
  radius?: number;
  province?: string;
}

export interface IntakeAnswers {
  businessType: string;
  targetAudience: string;
  region: TargetRegion;
  budget: number;
}

export interface CartItem {
  location: Location;
  weeks: number;
  creative?: {
    type: 'upload' | 'ai-generated' | 'verified';
    fileName?: string;
    previewUrl?: string; // CSS poster design or image
    promptText?: string;
    verifiedOk?: boolean;
    title?: string;
    subtitle?: string;
    textColor?: string;
    styleName?: string;
    align?: 'left' | 'center' | 'right';
    titleScale?: number;
    badgeText?: string;
    // Editable poster design (AI-generated creatives) — lets the cart re-open the
    // real template composer and live-edit, then re-export the PNG previewUrl.
    poster?: {
      fields: PosterFields;
      template: TemplateKey;
      theme: ThemeKey;
      photoUrl: string | null;
    };
  };
}

/**
 * A creative made this session, kept in-memory (no storage) so it can be reused
 * elsewhere in the same campaign. AI posters keep their full design so we can
 * re-render them; uploads keep the source image so we can re-crop.
 */
export interface SessionCreative {
  id: string;
  kind: 'ai' | 'upload';
  title: string;
  subtitle: string;
  previewUrl: string; // thumbnail, always the A0 ratio
  ratioType: LocationType; // the product it was made for (both are A0)
  poster?: {
    fields: PosterFields;
    template: TemplateKey;
    theme: ThemeKey;
    photoUrl: string | null;
  };
  sourceImage?: string; // uploads: original image data-URL, for re-cropping
}
