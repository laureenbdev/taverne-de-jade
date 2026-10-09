export const WISH_BANNERS = ['character', 'weapon', 'standard', 'chronicled'] as const;

export type WishBanner = typeof WISH_BANNERS[number];

export interface Wish {
  id: string;
  characterName: string;
  totalWishes: number;
  date: string;
  banner: WishBanner;
  won: boolean | null;
}

export type WishFormData = Omit<Wish, 'id'>;

const BANNER_ALIASES: Record<string, WishBanner> = {
  character: 'character',
  personnage: 'character',
  weapon: 'weapon',
  arme: 'weapon',
  standard: 'standard',
  perma: 'standard',
  chronicled: 'chronicled',
  nostalgie: 'chronicled',
};

export function normalizeBanner(value: unknown): WishBanner {
  if (typeof value === 'string') {
    const mapped = BANNER_ALIASES[value.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  return 'character';
}

export function normalizeWish(raw: {
  id?: unknown;
  characterName?: unknown;
  totalWishes?: unknown;
  date?: unknown;
  banner?: unknown;
  won?: unknown;
}): Wish | null {
  if (typeof raw.id !== 'string' || typeof raw.characterName !== 'string') return null;
  const banner = normalizeBanner(raw.banner);
  return {
    id: raw.id,
    characterName: raw.characterName,
    totalWishes: typeof raw.totalWishes === 'number' ? raw.totalWishes : 0,
    date: typeof raw.date === 'string' ? raw.date : '',
    banner,
    won: banner === 'standard' ? null : raw.won === false ? false : true,
  };
}
