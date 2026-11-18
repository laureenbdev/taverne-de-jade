import { Character } from '../../services/genshin/charactersApi.ts';
import { GameData, MaterialBag, WeaponCost } from '../../services/genshin/gameDataApi.ts';
import { Weapon } from '../../services/genshin/weaponsApi.ts';
import { ArtifactBuild, readArtifactBuild } from './artifactBuild.ts';

/** Paliers de niveau : on ne dépasse un cap qu'après l'ascension correspondante. */
export const CHARACTER_LEVELS = [1, 20, 40, 50, 60, 70, 80, 90, 95, 100] as const;

export type CharacterLevel = typeof CHARACTER_LEVELS[number];

export const TALENT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type TalentLevel = typeof TALENT_LEVELS[number];

/** Caps où l'on peut être encore non élevé, ou déjà élevé sans avoir monté plus loin. */
const ASCENSION_CAPS = [20, 40, 50, 60, 70, 80] as const;

export interface LevelRank {
	level: CharacterLevel;
	ascended: boolean;
}

/** 1, puis chaque palier avant/après élévation, puis 90 / 95 / 100 (états uniques). */
export const LEVEL_RANKS: LevelRank[] = [
	{ level: 1, ascended: false },
	{ level: 20, ascended: false },
	{ level: 20, ascended: true },
	{ level: 40, ascended: false },
	{ level: 40, ascended: true },
	{ level: 50, ascended: false },
	{ level: 50, ascended: true },
	{ level: 60, ascended: false },
	{ level: 60, ascended: true },
	{ level: 70, ascended: false },
	{ level: 70, ascended: true },
	{ level: 80, ascended: false },
	{ level: 80, ascended: true },
	{ level: 90, ascended: false },
	{ level: 95, ascended: false },
	{ level: 100, ascended: false },
];

/** Les armes restent plafonnées à 90. */
export const WEAPON_LEVEL_RANKS: LevelRank[] = LEVEL_RANKS.filter((rank) => rank.level <= 90);

export function canAscend(level: CharacterLevel): boolean {
	return (ASCENSION_CAPS as readonly number[]).includes(level);
}

/** Niveaux sans avant/après élévation classique. */
export function isPlainLevel(level: CharacterLevel): boolean {
	return level === 1 || level >= 90;
}

export function rankKey(rank: LevelRank): string {
	return rank.ascended ? `${rank.level}+` : String(rank.level);
}

export function rankIndex(level: CharacterLevel, ascended: boolean, ranks: LevelRank[] = LEVEL_RANKS): number {
	const index = ranks.findIndex((rank) => rank.level === level && rank.ascended === (canAscend(level) && ascended));
	return index === -1 ? 0 : index;
}

export function ranksFrom(level: CharacterLevel, ascended: boolean, ranks: LevelRank[] = LEVEL_RANKS): LevelRank[] {
	return ranks.slice(rankIndex(level, ascended, ranks));
}

/** Phases déjà faites. 20 non élevé = 0 ; 20 élevé = 1 ; 40 non élevé = 1. */
function phasesDone(level: CharacterLevel, ascended: boolean): number {
	if (level >= 90) return 6;
	const cap = (ASCENSION_CAPS as readonly number[]).indexOf(level);
	if (cap === -1) return 0;
	return ascended ? cap + 1 : cap;
}

/**
 * Stella Fortuna orpheline : 90→95 = 1, 95→100 = 2, sans EXP ni autres mats.
 */
export function fortunaBetween(current: CharacterLevel, target: CharacterLevel): number {
	let count = 0;
	if (current < 95 && target >= 95) count += 1;
	if (current < 100 && target >= 100) count += 2;
	return count;
}

export type MaterialKind = 'mora' | 'xp' | 'weaponXp' | 'fortuna' | 'stone' | 'boss' | 'local' | 'common' | 'talentBook' | 'weekly' | 'weaponMat' | 'elite';

export type StoneTier = 'sliver' | 'fragment' | 'chunk' | 'gemstone';

export interface FarmLine {
	id: string;
	kind: MaterialKind;
	count: number;
	name?: string;
	element?: string;
	tier?: StoneTier;
	rarity?: number;
}

const STONE_TIER: Record<string, StoneTier> = {
	rarity2: 'sliver',
	rarity3: 'fragment',
	rarity4: 'chunk',
	rarity5: 'gemstone',
};

const KIND_ORDER: MaterialKind[] = ['mora', 'xp', 'weaponXp', 'fortuna', 'stone', 'boss', 'local', 'common', 'talentBook', 'weekly', 'weaponMat', 'elite'];

/** EXP entre deux paliers d'ascension. Le total 1 → 90 vaut 8 362 650. */
export const CHARACTER_EXPERIENCE: { from: CharacterLevel; to: CharacterLevel; exp: number }[] = [
	{ from: 1, to: 20, exp: 120175 },
	{ from: 20, to: 40, exp: 578325 },
	{ from: 40, to: 50, exp: 579100 },
	{ from: 50, to: 60, exp: 854125 },
	{ from: 60, to: 70, exp: 1195925 },
	{ from: 70, to: 80, exp: 1611875 },
	{ from: 80, to: 90, exp: 3423125 },
];

export const HERO_WITS_EXP = 20000;

/** Minerai de renforcement mystique : 10 000 EXP d'arme. */
export const MYSTIC_ORE_EXP = 10000;

/**
 * EXP d'arme entre paliers. Diffère selon la rareté (wiki Weapon EXP).
 * Les armes 1★ / 2★ réutilisent la table 3★.
 */
export const WEAPON_EXPERIENCE: Record<3 | 4 | 5, { from: CharacterLevel; to: CharacterLevel; exp: number }[]> = {
	5: [
		{ from: 1, to: 20, exp: 121550 },
		{ from: 20, to: 40, exp: 622800 },
		{ from: 40, to: 50, exp: 628150 },
		{ from: 50, to: 60, exp: 927675 },
		{ from: 60, to: 70, exp: 1299125 },
		{ from: 70, to: 80, exp: 1750375 },
		{ from: 80, to: 90, exp: 3714775 },
	],
	4: [
		{ from: 1, to: 20, exp: 81000 },
		{ from: 20, to: 40, exp: 415125 },
		{ from: 40, to: 50, exp: 418725 },
		{ from: 50, to: 60, exp: 618400 },
		{ from: 60, to: 70, exp: 866050 },
		{ from: 70, to: 80, exp: 1166875 },
		{ from: 80, to: 90, exp: 2476475 },
	],
	3: [
		{ from: 1, to: 20, exp: 53475 },
		{ from: 20, to: 40, exp: 274000 },
		{ from: 40, to: 50, exp: 276350 },
		{ from: 50, to: 60, exp: 408150 },
		{ from: 60, to: 70, exp: 571625 },
		{ from: 70, to: 80, exp: 770125 },
		{ from: 80, to: 90, exp: 1634475 },
	],
};

export function weaponExperienceTable(rarity: number): { from: CharacterLevel; to: CharacterLevel; exp: number }[] {
	if (rarity >= 5) return WEAPON_EXPERIENCE[5];
	if (rarity === 4) return WEAPON_EXPERIENCE[4];
	return WEAPON_EXPERIENCE[3];
}

type WeaponPhaseBag = Record<string, WeaponCost>;

/**
 * Coûts d'élévation d'arme selon la rareté.
 * L'API ne fournit que la table 4★ ; les 5★ / 3★ sont donc locales.
 */
const WEAPON_ASCENSION: Record<3 | 4 | 5, WeaponPhaseBag> = {
	5: {
		phase_1: { moras: 10000, weapon_materials: { rarity2: 5 }, elite_enemy_drops: { rarity2: 5 }, common_enemy_drops: { rarity1: 3 } },
		phase_2: { moras: 20000, weapon_materials: { rarity3: 5 }, elite_enemy_drops: { rarity2: 18 }, common_enemy_drops: { rarity1: 12 } },
		phase_3: { moras: 30000, weapon_materials: { rarity3: 9 }, elite_enemy_drops: { rarity3: 9 }, common_enemy_drops: { rarity2: 9 } },
		phase_4: { moras: 45000, weapon_materials: { rarity4: 5 }, elite_enemy_drops: { rarity3: 18 }, common_enemy_drops: { rarity2: 14 } },
		phase_5: { moras: 55000, weapon_materials: { rarity4: 9 }, elite_enemy_drops: { rarity4: 14 }, common_enemy_drops: { rarity3: 9 } },
		phase_6: { moras: 65000, weapon_materials: { rarity5: 6 }, elite_enemy_drops: { rarity4: 27 }, common_enemy_drops: { rarity3: 18 } },
	},
	4: {
		phase_1: { moras: 5000, weapon_materials: { rarity2: 3 }, elite_enemy_drops: { rarity2: 3 }, common_enemy_drops: { rarity1: 2 } },
		phase_2: { moras: 15000, weapon_materials: { rarity3: 3 }, elite_enemy_drops: { rarity2: 12 }, common_enemy_drops: { rarity1: 8 } },
		phase_3: { moras: 20000, weapon_materials: { rarity3: 6 }, elite_enemy_drops: { rarity3: 6 }, common_enemy_drops: { rarity2: 6 } },
		phase_4: { moras: 30000, weapon_materials: { rarity4: 3 }, elite_enemy_drops: { rarity3: 12 }, common_enemy_drops: { rarity2: 9 } },
		phase_5: { moras: 35000, weapon_materials: { rarity4: 6 }, elite_enemy_drops: { rarity4: 9 }, common_enemy_drops: { rarity3: 6 } },
		phase_6: { moras: 45000, weapon_materials: { rarity5: 4 }, elite_enemy_drops: { rarity4: 18 }, common_enemy_drops: { rarity3: 12 } },
	},
	3: {
		phase_1: { moras: 5000, weapon_materials: { rarity2: 2 }, elite_enemy_drops: { rarity2: 2 }, common_enemy_drops: { rarity1: 1 } },
		phase_2: { moras: 10000, weapon_materials: { rarity3: 2 }, elite_enemy_drops: { rarity2: 8 }, common_enemy_drops: { rarity1: 5 } },
		phase_3: { moras: 15000, weapon_materials: { rarity3: 4 }, elite_enemy_drops: { rarity3: 4 }, common_enemy_drops: { rarity2: 4 } },
		phase_4: { moras: 20000, weapon_materials: { rarity4: 2 }, elite_enemy_drops: { rarity3: 8 }, common_enemy_drops: { rarity2: 6 } },
		phase_5: { moras: 25000, weapon_materials: { rarity4: 4 }, elite_enemy_drops: { rarity4: 6 }, common_enemy_drops: { rarity3: 4 } },
		phase_6: { moras: 30000, weapon_materials: { rarity5: 3 }, elite_enemy_drops: { rarity4: 12 }, common_enemy_drops: { rarity3: 8 } },
	},
};

export function weaponAscensionTable(rarity: number): WeaponPhaseBag {
	if (rarity >= 5) return WEAPON_ASCENSION[5];
	if (rarity === 4) return WEAPON_ASCENSION[4];
	return WEAPON_ASCENSION[3];
}

export function isCharacterLevel(value: number): value is CharacterLevel {
	return (CHARACTER_LEVELS as readonly number[]).includes(value);
}

export function isTalentLevel(value: number): value is TalentLevel {
	return (TALENT_LEVELS as readonly number[]).includes(value);
}

export function phasesBetween(
	current: CharacterLevel,
	currentAscended: boolean,
	target: CharacterLevel,
	targetAscended: boolean,
): number[] {
	const from = phasesDone(current, currentAscended);
	const to = phasesDone(target, targetAscended);
	const phases: number[] = [];
	for (let phase = from + 1; phase <= to; phase += 1) phases.push(phase);
	return phases;
}

export interface PlannedCharacter {
	characterId: string;
	currentLevel: CharacterLevel;
	currentAscended: boolean;
	targetLevel: CharacterLevel;
	targetAscended: boolean;
	weaponId: string | null;
	weaponCurrentLevel: CharacterLevel | null;
	weaponCurrentAscended: boolean;
	weaponTargetLevel: CharacterLevel | null;
	weaponTargetAscended: boolean;
	talentNormal: TalentLevel;
	talentNormalTarget: TalentLevel;
	talentSkill: TalentLevel;
	talentSkillTarget: TalentLevel;
	talentBurst: TalentLevel;
	talentBurstTarget: TalentLevel;
	artifactSet: string | null;
	favorite: boolean;
	done: boolean;
	taskSignature: string;
	checkedTasks: string[];
	hiddenTasks: string[];
	artifactBuild: ArtifactBuild | null;
}

type LegacyPlan = Partial<PlannedCharacter> & {
	weaponLevel?: number | null;
	talentNormal?: number | null;
	talentSkill?: number | null;
	talentBurst?: number | null;
};

function talentOr(value: unknown, fallback: TalentLevel): TalentLevel {
	const level = Number(value);
	return isTalentLevel(level) ? level : fallback;
}

/** Ancien enregistrement : un seul niveau, celui à atteindre depuis le niveau 1. */
export function readTalentPair(current: unknown, target: unknown, legacy: unknown): { current: TalentLevel; target: TalentLevel } {
	const legacyLevel = talentOr(legacy, 1);
	if (current == null && target == null) return { current: 1, target: legacyLevel };
	const currentLevel = talentOr(current, 1);
	let targetLevel = talentOr(target, legacyLevel);
	if (currentLevel === 1 && targetLevel === 1 && legacyLevel > 1) return { current: 1, target: legacyLevel };
	if (targetLevel < currentLevel) targetLevel = currentLevel;
	return { current: currentLevel, target: targetLevel };
}

function ascendedFlag(level: CharacterLevel, value: unknown): boolean {
	return canAscend(level) && value === true;
}

function asWeaponLevel(value: unknown): CharacterLevel | null {
	const level = Number(value);
	if (!isCharacterLevel(level)) return null;
	return level > 90 ? 90 : level;
}

export function readWeaponLevels(
	weaponId: string | null,
	current: unknown,
	target: unknown,
	legacy: unknown,
	currentAscended?: unknown,
	targetAscended?: unknown,
): { current: CharacterLevel | null; target: CharacterLevel | null; currentAscended: boolean; targetAscended: boolean } {
	if (!weaponId) return { current: null, target: null, currentAscended: false, targetAscended: false };
	const legacyLevel = asWeaponLevel(legacy);
	const currentLevel = asWeaponLevel(current);
	const targetLevel = asWeaponLevel(target);
	if (currentLevel == null && targetLevel == null) {
		const targetRank = legacyLevel ?? 1;
		return {
			current: 1,
			target: targetRank,
			currentAscended: false,
			targetAscended: ascendedFlag(targetRank, targetAscended),
		};
	}
	const nextCurrent = currentLevel ?? 1;
	let nextTarget = targetLevel ?? legacyLevel ?? nextCurrent;
	let nextCurrentAscended = ascendedFlag(nextCurrent, currentAscended);
	let nextTargetAscended = ascendedFlag(nextTarget, targetAscended);
	if (rankIndex(nextTarget, nextTargetAscended) < rankIndex(nextCurrent, nextCurrentAscended)) {
		nextTarget = nextCurrent;
		nextTargetAscended = nextCurrentAscended;
	}
	return {
		current: nextCurrent,
		target: nextTarget,
		currentAscended: nextCurrentAscended,
		targetAscended: nextTargetAscended,
	};
}

export function withRaisedTargets(plan: PlannedCharacter): PlannedCharacter {
	let targetLevel = plan.targetLevel;
	let targetAscended = ascendedFlag(targetLevel, plan.targetAscended);
	const currentAscended = ascendedFlag(plan.currentLevel, plan.currentAscended);
	if (rankIndex(targetLevel, targetAscended) < rankIndex(plan.currentLevel, currentAscended)) {
		targetLevel = plan.currentLevel;
		targetAscended = currentAscended;
	}
	const weapon = readWeaponLevels(
		plan.weaponId,
		plan.weaponCurrentLevel,
		plan.weaponTargetLevel,
		null,
		plan.weaponCurrentAscended,
		plan.weaponTargetAscended,
	);
	const normal = readTalentPair(plan.talentNormal, plan.talentNormalTarget, null);
	const skill = readTalentPair(plan.talentSkill, plan.talentSkillTarget, null);
	const burst = readTalentPair(plan.talentBurst, plan.talentBurstTarget, null);
	return {
		...plan,
		currentAscended,
		targetLevel,
		targetAscended,
		weaponCurrentLevel: weapon.current,
		weaponCurrentAscended: weapon.currentAscended,
		weaponTargetLevel: weapon.target,
		weaponTargetAscended: weapon.targetAscended,
		talentNormal: normal.current,
		talentNormalTarget: normal.target,
		talentSkill: skill.current,
		talentSkillTarget: skill.target,
		talentBurst: burst.current,
		talentBurstTarget: burst.target,
	};
}

export function planFromLegacy(raw: LegacyPlan): PlannedCharacter | null {
	if (typeof raw.characterId !== 'string' || raw.characterId.trim() === '') return null;
	const currentLevel: CharacterLevel = isCharacterLevel(Number(raw.currentLevel)) ? Number(raw.currentLevel) as CharacterLevel : 1;
	let targetLevel: CharacterLevel = isCharacterLevel(Number(raw.targetLevel)) ? Number(raw.targetLevel) as CharacterLevel : 90;
	const currentAscended = ascendedFlag(currentLevel, raw.currentAscended);
	let targetAscended = ascendedFlag(targetLevel, raw.targetAscended);
	if (rankIndex(targetLevel, targetAscended) < rankIndex(currentLevel, currentAscended)) {
		targetLevel = currentLevel;
		targetAscended = currentAscended;
	}
	const weaponId = typeof raw.weaponId === 'string' && raw.weaponId.trim() !== '' ? raw.weaponId : null;
	const weapon = readWeaponLevels(
		weaponId,
		raw.weaponCurrentLevel,
		raw.weaponTargetLevel,
		raw.weaponLevel,
		raw.weaponCurrentAscended,
		raw.weaponTargetAscended,
	);
	const talent = (current: unknown, target: unknown) => (
		target == null
			? { current: 1 as TalentLevel, target: talentOr(current, 1) }
			: readTalentPair(current, target, null)
	);
	const normal = talent(raw.talentNormal, raw.talentNormalTarget);
	const skill = talent(raw.talentSkill, raw.talentSkillTarget);
	const burst = talent(raw.talentBurst, raw.talentBurstTarget);
	const artifactSet = typeof raw.artifactSet === 'string' && raw.artifactSet.trim() !== '' ? raw.artifactSet : null;
	const checkedTasks = Array.isArray(raw.checkedTasks)
		? raw.checkedTasks.filter((id): id is string => typeof id === 'string')
		: [];
	const hiddenTasks = Array.isArray(raw.hiddenTasks)
		? raw.hiddenTasks.filter((id): id is string => typeof id === 'string')
		: [];
	return {
		characterId: raw.characterId,
		currentLevel,
		currentAscended,
		targetLevel,
		targetAscended,
		weaponId,
		weaponCurrentLevel: weapon.current,
		weaponCurrentAscended: weapon.currentAscended,
		weaponTargetLevel: weapon.target,
		weaponTargetAscended: weapon.targetAscended,
		talentNormal: normal.current,
		talentNormalTarget: normal.target,
		talentSkill: skill.current,
		talentSkillTarget: skill.target,
		talentBurst: burst.current,
		talentBurstTarget: burst.target,
		artifactSet,
		favorite: raw.favorite === true,
		done: raw.done === true,
		taskSignature: typeof raw.taskSignature === 'string' ? raw.taskSignature : '',
		checkedTasks,
		hiddenTasks,
		artifactBuild: readArtifactBuild(raw.artifactBuild, artifactSet),
	};
}

export function farmingSignature(plan: PlannedCharacter): string {
	return [
		plan.currentLevel,
		plan.currentAscended ? 1 : 0,
		plan.targetLevel,
		plan.targetAscended ? 1 : 0,
		plan.weaponId ?? '',
		plan.weaponCurrentLevel ?? '',
		plan.weaponCurrentAscended ? 1 : 0,
		plan.weaponTargetLevel ?? '',
		plan.weaponTargetAscended ? 1 : 0,
		plan.talentNormal,
		plan.talentNormalTarget,
		plan.talentSkill,
		plan.talentSkillTarget,
		plan.talentBurst,
		plan.talentBurstTarget,
	].join('|');
}

export function experienceBetween(
	current: CharacterLevel,
	currentAscended: boolean,
	target: CharacterLevel,
	targetAscended: boolean,
	brackets: { from: number; to: number; exp: number }[] = CHARACTER_EXPERIENCE,
): number {
	const currentIndex = rankIndex(current, currentAscended);
	const targetIndex = rankIndex(target, targetAscended);
	return brackets.reduce((total, bracket) => {
		const arrival = rankIndex(bracket.to as CharacterLevel, false);
		return currentIndex < arrival && targetIndex >= arrival ? total + bracket.exp : total;
	}, 0);
}

/** Garde les coches tant que les niveaux, l'arme et les talents n'ont pas changé. */
export function mergeSavedPlan(previous: PlannedCharacter | undefined, next: PlannedCharacter): PlannedCharacter {
	const raised = withRaisedTargets(next);
	const signature = farmingSignature(raised);
	const sameFarm = Boolean(
		previous && farmingSignature(withRaisedTargets(previous)) === signature,
	);
	return {
		...raised,
		favorite: next.favorite ?? previous?.favorite ?? false,
		done: sameFarm ? (next.done ?? previous?.done ?? false) : false,
		checkedTasks: sameFarm ? (next.checkedTasks ?? previous?.checkedTasks ?? []) : [],
		hiddenTasks: sameFarm ? (next.hiddenTasks ?? previous?.hiddenTasks ?? []) : [],
		taskSignature: signature,
		artifactSet: next.artifactBuild?.set ?? next.artifactSet ?? null,
		artifactBuild: next.artifactBuild === undefined ? (previous?.artifactBuild ?? null) : next.artifactBuild,
	};
}

export interface FarmNeed extends FarmLine {
	characterId: string;
}

function linesForCharacter(
	plan: PlannedCharacter,
	character: Character,
	weapon: Weapon | undefined,
	gameData: GameData,
	experience: { from: number; to: number; exp: number }[],
): FarmLine[] {
	const totals = new Map<string, FarmLine>();
	const phases = gameData.ascension_values.character_level;
	const talentCosts = gameData.ascension_values.talents ?? {};
	const weaponCosts = weapon ? weaponAscensionTable(weapon.rarity) : {};

	const add = (line: Omit<FarmLine, 'count'> & { count: number }) => {
		if (line.count <= 0) return;
		const existing = totals.get(line.id);
		if (existing) existing.count += line.count;
		else totals.set(line.id, { ...line });
	};

	const addBag = (idPrefix: string, kind: MaterialKind, name: string, bag?: MaterialBag) => {
		Object.entries(bag ?? {}).forEach(([rarityKey, count]) => {
			const rarity = Number(rarityKey.replace('rarity', ''));
			if (!rarity) return;
			add({ id: `${idPrefix}:${name}:${rarity}`, kind, name, rarity, count });
		});
	};

	phasesBetween(plan.currentLevel, plan.currentAscended, plan.targetLevel, plan.targetAscended).forEach((phase) => {
			const cost = phases[`phase_${phase}`];
			if (!cost) return;

			add({ id: 'mora', kind: 'mora', count: cost.moras });
			add({
				id: `boss:${character.ascension_materials.boss_drops}`,
				kind: 'boss',
				name: character.ascension_materials.boss_drops,
				count: cost.boss_drops,
			});
			add({
				id: `local:${character.ascension_materials.local_speciality}`,
				kind: 'local',
				name: character.ascension_materials.local_speciality,
				count: cost.local_speciality,
			});

			Object.entries(cost.elemental_stones ?? {}).forEach(([rarityKey, count]) => {
				const tier = STONE_TIER[rarityKey];
				if (!tier) return;
				add({
					id: `stone:${character.element}:${tier}`,
					kind: 'stone',
					element: character.element,
					tier,
					count,
				});
			});

			Object.entries(cost.common_enemy_drops ?? {}).forEach(([rarityKey, count]) => {
				const rarity = Number(rarityKey.replace('rarity', ''));
				if (!rarity) return;
				add({
					id: `common:${character.ascension_materials.common_enemy_drops}:${rarity}`,
					kind: 'common',
					name: character.ascension_materials.common_enemy_drops,
					rarity,
					count,
				});
			});
		});

		([
			[plan.talentNormal, plan.talentNormalTarget],
			[plan.talentSkill, plan.talentSkillTarget],
			[plan.talentBurst, plan.talentBurstTarget],
		] as const).forEach(([current, target]) => {
			for (let level = current + 1; level <= target; level += 1) {
				const cost = talentCosts[`level_${level}`];
				if (!cost) continue;
				add({ id: 'mora', kind: 'mora', count: cost.moras });
				addBag('book', 'talentBook', character.ascension_materials.talent_books, cost.talent_books);
				addBag('common', 'common', character.ascension_materials.common_enemy_drops, cost.common_enemy_drops);
				if (cost.weekly_boss_drops) {
					add({
						id: `weekly:${character.ascension_materials.weekly_boss_drops}`,
						kind: 'weekly',
						name: character.ascension_materials.weekly_boss_drops,
						count: cost.weekly_boss_drops,
					});
				}
			}
		});

		const weaponMats = weapon?.ascension_materials;
		if (weapon && weaponMats && plan.weaponCurrentLevel && plan.weaponTargetLevel) {
			phasesBetween(
				plan.weaponCurrentLevel,
				plan.weaponCurrentAscended,
				plan.weaponTargetLevel,
				plan.weaponTargetAscended,
			).forEach((phase) => {
				const cost = weaponCosts[`phase_${phase}`];
				if (!cost) return;
				add({ id: 'mora', kind: 'mora', count: cost.moras });
				addBag('weapon', 'weaponMat', weaponMats.weapon_materials, cost.weapon_materials);
				addBag('elite', 'elite', weaponMats.elite_enemy_drops, cost.elite_enemy_drops);
				addBag('common', 'common', weaponMats.common_enemy_drops, cost.common_enemy_drops);
			});

			const weaponExp = experienceBetween(
				plan.weaponCurrentLevel,
				plan.weaponCurrentAscended,
				plan.weaponTargetLevel,
				plan.weaponTargetAscended,
				weaponExperienceTable(weapon.rarity),
			);
			if (weaponExp > 0) {
				add({ id: 'mora', kind: 'mora', count: Math.floor(weaponExp / 10) });
				add({
					id: 'xp:mystic-ore',
					kind: 'weaponXp',
					name: 'Mystic Enhancement Ore',
					count: Math.ceil(weaponExp / MYSTIC_ORE_EXP),
				});
			}
		}

	const exp = experienceBetween(plan.currentLevel, plan.currentAscended, plan.targetLevel, plan.targetAscended, experience);
	if (exp > 0) {
		add({ id: 'mora', kind: 'mora', count: Math.floor(exp / 5) });
		add({ id: 'xp:heros-wit', kind: 'xp', name: "Hero's Wit", count: Math.ceil(exp / HERO_WITS_EXP) });
	}

	const fortuna = fortunaBetween(plan.currentLevel, plan.targetLevel);
	if (fortuna > 0) {
		add({
			id: 'fortuna:masterless-stella',
			kind: 'fortuna',
			name: 'Masterless Stella Fortuna',
			count: fortuna,
		});
	}

	return [...totals.values()];
}

export const PLANNER_TABS = ['level', 'weapon', 'talents', 'artifacts'] as const;

export type PlannerTab = typeof PLANNER_TABS[number];

function talentGap(plan: PlannedCharacter): boolean {
	return plan.talentNormal < plan.talentNormalTarget
		|| plan.talentSkill < plan.talentSkillTarget
		|| plan.talentBurst < plan.talentBurstTarget;
}

/** Premier onglet dont les réglages produisent encore cette ressource. */
export function plannerTabForLine(
	plan: PlannedCharacter,
	character: Character | undefined,
	weapon: Weapon | undefined,
	line: Pick<FarmLine, 'kind' | 'name'>,
): PlannerTab {
	if (!character) return 'level';
	const leveling = rankIndex(plan.currentLevel, plan.currentAscended) < rankIndex(plan.targetLevel, plan.targetAscended);
	const weaponLeveling = Boolean(
		weapon
		&& plan.weaponCurrentLevel != null
		&& plan.weaponTargetLevel != null
		&& rankIndex(plan.weaponCurrentLevel, plan.weaponCurrentAscended) < rankIndex(plan.weaponTargetLevel, plan.weaponTargetAscended),
	);
	const talents = talentGap(plan);
	const common = character.ascension_materials.common_enemy_drops;
	const weaponCommon = weapon?.ascension_materials?.common_enemy_drops;
	const concerned = new Set<PlannerTab>();

	if (line.kind === 'boss' || line.kind === 'local' || line.kind === 'stone' || line.kind === 'xp' || line.kind === 'fortuna') concerned.add('level');
	if (line.kind === 'weaponMat' || line.kind === 'elite' || line.kind === 'weaponXp') concerned.add('weapon');
	if (line.kind === 'talentBook' || line.kind === 'weekly') concerned.add('talents');
	if (line.kind === 'common') {
		if (line.name === common) {
			concerned.add('level');
			concerned.add('talents');
		}
		if (line.name && line.name === weaponCommon) concerned.add('weapon');
	}
	if (line.kind === 'mora') {
		concerned.add('level');
		concerned.add('weapon');
		concerned.add('talents');
	}

	const progressing = (tab: PlannerTab) => (
		(tab === 'level' && leveling)
		|| (tab === 'weapon' && weaponLeveling)
		|| (tab === 'talents' && talents)
	);
	return PLANNER_TABS.find((tab) => concerned.has(tab) && progressing(tab))
		?? PLANNER_TABS.find((tab) => concerned.has(tab))
		?? 'level';
}

export function needsForCharacter(
	plan: PlannedCharacter,
	character: Character | undefined,
	weapon: Weapon | undefined,
	gameData: GameData,
	experience: { from: number; to: number; exp: number }[] = CHARACTER_EXPERIENCE,
): FarmNeed[] {
	if (!character) return [];
	return linesForCharacter(plan, character, weapon, gameData, experience).map((line) => ({
		...line,
		characterId: plan.characterId,
	}));
}

export function materialsForPlan(
	plans: PlannedCharacter[],
	characters: Character[],
	weapons: Weapon[],
	gameData: GameData,
): FarmLine[] {
	const totals = new Map<string, FarmLine>();
	const byId = new Map(characters.map((character) => [character.id, character]));
	const weaponsById = new Map(weapons.map((weapon) => [weapon.id, weapon]));

	plans.forEach((plan) => {
		const weapon = plan.weaponId ? weaponsById.get(plan.weaponId) : undefined;
		needsForCharacter(plan, byId.get(plan.characterId), weapon, gameData).forEach((line) => {
			const existing = totals.get(line.id);
			if (existing) existing.count += line.count;
			else totals.set(line.id, { id: line.id, kind: line.kind, count: line.count, name: line.name, element: line.element, tier: line.tier, rarity: line.rarity });
		});
	});

	return [...totals.values()].sort((a, b) => {
		const kindDiff = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
		if (kindDiff !== 0) return kindDiff;
		return a.id.localeCompare(b.id);
	});
}
