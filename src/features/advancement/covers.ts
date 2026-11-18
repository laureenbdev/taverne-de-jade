import { catalogIconUrl } from '../../services/genshin/images.ts';

const AREA_BASE = 'https://raw.githubusercontent.com/laureenbdev/genshin-api/main/images/areas';

const AREA_FILES: [string, string][] = [
	['mondstadt', 'mondstadt'],
	['prologue', 'mondstadt'],
	['liyue', 'liyue'],
	['inazuma', 'inazuma'],
	['sumeru', 'sumeru'],
	['fontaine', 'fontaine'],
	['natlan', 'natlan'],
	['nodkrai', 'nod-krai'],
	['nod-krai', 'nod-krai'],
	['snezhnaya', 'snezhnaya'],
];

/** Couverture d'une série : image API si fournie, sinon zone locale. */
export function groupCover(groupId: string, image?: string): string | null {
	if (image) return catalogIconUrl(image);
	const key = groupId.toLowerCase();
	const match = AREA_FILES.find(([token]) => key.includes(token));
	return match ? `${AREA_BASE}/${match[1]}.webp` : null;
}

export function categoryCover(image?: string): string | null {
	return image ? catalogIconUrl(image) : null;
}
