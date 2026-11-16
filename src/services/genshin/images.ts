import { GENSHIN_API_ROOT } from './apiRoot.ts';

const IMAGE_BASE = `${GENSHIN_API_ROOT}/images`;

export const characterIconUrl = (id: string) => `${IMAGE_BASE}/characters/${id}.webp`;

export const weaponIconUrl = (id: string) => `${IMAGE_BASE}/weapons/${id}.png`;

export const elementIconUrl = (element: string) => `${IMAGE_BASE}/elements/${element}.webp`;

export const catalogIconUrl = (image: string) => `${IMAGE_BASE}/${image}`;
