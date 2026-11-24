import type { TFunction } from 'i18next';

export const SUBSTATS = ['hp_', 'atk_', 'def_', 'em', 'er', 'cr', 'cd'] as const;

export const SANDS_STATS = ['hp_', 'atk_', 'def_', 'er', 'em'] as const;

export const GOBLET_STATS = ['hp_', 'atk_', 'def_', 'em', 'pyro', 'hydro', 'electro', 'cryo', 'anemo', 'geo', 'dendro', 'physical'] as const;

export const CIRCLET_STATS = ['hp_', 'atk_', 'def_', 'em', 'cr', 'cd', 'cr_cd', 'heal'] as const;

export type ArtifactStatId = typeof SUBSTATS[number] | typeof GOBLET_STATS[number] | typeof CIRCLET_STATS[number];

export const ARTIFACT_PIECES = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;

export type ArtifactPieceId = typeof ARTIFACT_PIECES[number];

type ArtifactPieceNeedKey = `${ArtifactPieceId}Need`;

const LEGACY_FLAT_STATS = { hp: 'hp_', atk: 'atk_', def: 'def_' } as const;

/** Anciennes sub-stats plates → clé % encore utilisée dans les traductions. */
export function normalizeArtifactStatId(stat: string): string {
	return stat in LEGACY_FLAT_STATS
		? LEGACY_FLAT_STATS[stat as keyof typeof LEGACY_FLAT_STATS]
		: stat;
}

export function artifactStatLabel(t: TFunction, stat: string, short = false): string {
	const id = normalizeArtifactStatId(stat);
	if (short) {
		const shortKey = `planner.statsShort.${id}`;
		const shortLabel = t(shortKey);
		if (shortLabel !== shortKey) return shortLabel;
	}
	return t(`planner.stats.${id}`);
}

/** Libellé de stat principale (sablier, coupe, diadème) — avec % quand pertinent. */
export function artifactMainStatLabel(t: TFunction, stat: string, short = false): string {
	const id = normalizeArtifactStatId(stat);
	const key = short ? `planner.statsMainShort.${id}` : `planner.statsMain.${id}`;
	const mainLabel = t(key);
	if (mainLabel !== key) return mainLabel;
	return artifactStatLabel(t, stat, short);
}

/** Sub-stats (build) — libellés sans suffixe % sur la cible numérique. */
export function artifactSubStatLabel(t: TFunction, stat: string, short = false): string {
	return artifactStatLabel(t, stat, short);
}

export interface ArtifactSubstat {
	stat: string;
	current: number;
	target: string;
}

export interface ArtifactBuild {
	set: string | null;
	setB: string | null;
	sands: string;
	goblet: string;
	circlet: string;
	flowerNeed: boolean;
	plumeNeed: boolean;
	sandsNeed: boolean;
	gobletNeed: boolean;
	circletNeed: boolean;
	subs: ArtifactSubstat[];
	done?: boolean;
}

export function artifactPieceNeedKey(piece: ArtifactPieceId): ArtifactPieceNeedKey {
	return `${piece}Need`;
}

export function isArtifactPieceNeeded(build: ArtifactBuild, piece: ArtifactPieceId): boolean {
	return build[artifactPieceNeedKey(piece)] === true;
}

function textOrEmpty(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return '';
}

export function emptyArtifactBuild(set: string | null = null): ArtifactBuild {
	return {
		set,
		setB: null,
		sands: '',
		goblet: '',
		circlet: '',
		flowerNeed: false,
		plumeNeed: false,
		sandsNeed: false,
		gobletNeed: false,
		circletNeed: false,
		subs: [],
	};
}

function numberOr(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function textOrNull(value: unknown): string | null {
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function readPieceNeed(record: Record<string, unknown>, piece: ArtifactPieceId): boolean {
	return record[`${piece}Need`] === true;
}

export function readArtifactBuild(raw: unknown, legacySet?: string | null): ArtifactBuild | null {
	const record = asRecord(raw);
	if (!record) return legacySet ? emptyArtifactBuild(legacySet) : null;
	const subs = Array.isArray(record.subs) ? record.subs.flatMap((entry) => {
		const sub = asRecord(entry);
		if (!sub || typeof sub.stat !== 'string' || sub.stat.trim() === '') return [];
		return [{
			stat: normalizeArtifactStatId(sub.stat),
			current: numberOr(sub.current),
			target: textOrEmpty(sub.target),
		}];
	}) : [];
	return {
		set: textOrNull(record.set) ?? legacySet ?? null,
		setB: textOrNull(record.setB),
		sands: typeof record.sands === 'string' ? record.sands : '',
		goblet: typeof record.goblet === 'string' ? record.goblet : '',
		circlet: typeof record.circlet === 'string' ? record.circlet : '',
		flowerNeed: readPieceNeed(record, 'flower'),
		plumeNeed: readPieceNeed(record, 'plume'),
		sandsNeed: record.sandsNeed === true,
		gobletNeed: record.gobletNeed === true,
		circletNeed: record.circletNeed === true,
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

export function hasArtifactPlan(build: ArtifactBuild | null): boolean {
	if (!build) return false;
	return Boolean(build.set || build.setB || build.sands || build.goblet || build.circlet || build.subs.some((sub) => sub.stat));
}