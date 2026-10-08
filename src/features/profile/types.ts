export const PLAYER_SERVERS = ['america', 'europe', 'asia', 'tw'] as const;

export type PlayerServer = (typeof PLAYER_SERVERS)[number];

export interface PlayerProfile {
	displayName: string;
	uid: string;
	server: PlayerServer | '';
}

export function isPlayerServer(value: unknown): value is PlayerServer {
	return typeof value === 'string' && (PLAYER_SERVERS as readonly string[]).includes(value);
}
