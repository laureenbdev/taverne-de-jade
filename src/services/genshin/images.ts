const IMAGE_BASE = 'https://raw.githubusercontent.com/laureenbdev/genshin-api/main/images';

export const characterIconUrl = (id: string) => `${IMAGE_BASE}/characters/${id}.webp`;

export const elementIconUrl = (element: string) => `${IMAGE_BASE}/elements/${element}.webp`;
