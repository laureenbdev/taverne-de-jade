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
];

export function groupCover(groupId: string): string | null {
	const key = groupId.toLowerCase();
	const match = AREA_FILES.find(([token]) => key.includes(token));
	return match ? `${AREA_BASE}/${match[1]}.webp` : null;
}
