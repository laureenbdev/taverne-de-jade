export const SUBSTATS = ['hp', 'hp_', 'atk', 'atk_', 'def', 'def_', 'em', 'er', 'cr', 'cd'] as const;

export const SANDS_STATS = ['hp_', 'atk_', 'def_', 'er', 'em'] as const;

export const GOBLET_STATS = ['hp_', 'atk_', 'def_', 'em', 'pyro', 'hydro', 'electro', 'cryo', 'anemo', 'geo', 'dendro', 'physical'] as const;

export const CIRCLET_STATS = ['hp_', 'atk_', 'def_', 'em', 'cr', 'cd', 'heal'] as const;

export type ArtifactStatId = typeof SUBSTATS[number] | typeof GOBLET_STATS[number] | typeof CIRCLET_STATS[number];

const PERCENT_STATS = new Set<string>([
	'hp_', 'atk_', 'def_', 'er', 'cr', 'cd', 'heal',
	'pyro', 'hydro', 'electro', 'cryo', 'anemo', 'geo', 'dendro', 'physical',
]);

export interface ArtifactSubstat {
	stat: string;
	current: number;
	target: number;
}

export interface ArtifactBuild {
	set: string | null;
	setB: string | null;
	sands: string;
	goblet: string;
	circlet: string;
	sandsGot: boolean;
	gobletGot: boolean;
	circletGot: boolean;
	subs: ArtifactSubstat[];
	done?: boolean;
}

export interface UnreachedStat {
	key: string;
	stat: string;
	slot?: 'sands' | 'goblet' | 'circlet';
	current?: number;
	target?: number;
}

export function emptyArtifactBuild(set: string | null = null): ArtifactBuild {
	return {
		set,
		setB: null,
		sands: '',
		goblet: '',
		circlet: '',
		sandsGot: false,
		gobletGot: false,
		circletGot: false,
		subs: [],
	};
}

export function isPercentStat(stat: string): boolean {
	return PERCENT_STATS.has(stat);
}

function numberOr(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function textOrNull(value: unknown): string | null {
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function readArtifactBuild(raw: unknown, legacySet?: string | null): ArtifactBuild | null {
	const record = asRecord(raw);
	if (!record) return legacySet ? emptyArtifactBuild(legacySet) : null;
	const subs = Array.isArray(record.subs) ? record.subs.flatMap((entry) => {
		const sub = asRecord(entry);
		if (!sub || typeof sub.stat !== 'string' || sub.stat.trim() === '') return [];
		return [{ stat: sub.stat, current: numberOr(sub.current), target: numberOr(sub.target) }];
	}) : [];
	return {
		set: textOrNull(record.set) ?? legacySet ?? null,
		setB: textOrNull(record.setB),
		sands: typeof record.sands === 'string' ? record.sands : '',
		goblet: typeof record.goblet === 'string' ? record.goblet : '',
		circlet: typeof record.circlet === 'string' ? record.circlet : '',
		sandsGot: record.sandsGot === true,
		gobletGot: record.gobletGot === true,
		circletGot: record.circletGot === true,
		subs,
		done: record.done === true,
	};
}

function asRecord(raw: unknown): Record<string, unknown> | null {
	if (typeof raw === 'string') {
		try {
			return asRecord(JSON.parse(raw));
		} catch {
			return null;
		}
	}
	if (!raw || typeof raw !== 'object') return null;
	return raw as Record<string, unknown>;
}

export function unreachedStats(build: ArtifactBuild | null): UnreachedStat[] {
	if (!build) return [];
	const missed: UnreachedStat[] = [];
	(['sands', 'goblet', 'circlet'] as const).forEach((slot) => {
		const stat = build[slot];
		const got = build[`${slot}Got`];
		if (stat && !got) missed.push({ key: slot, stat, slot });
	});
	build.subs.forEach((sub, index) => {
		if (!sub.stat || sub.current >= sub.target) return;
		missed.push({ key: `sub-${index}`, stat: sub.stat, current: sub.current, target: sub.target });
	});
	return missed;
}

export function hasArtifactPlan(build: ArtifactBuild | null): boolean {
	if (!build) return false;
	return Boolean(build.set || build.setB || build.sands || build.goblet || build.circlet || build.subs.length);
}
