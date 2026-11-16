import { Character } from '../../services/genshin/charactersApi.ts';
import { GameData, MaterialBag } from '../../services/genshin/gameDataApi.ts';
import { Weapon } from '../../services/genshin/weaponsApi.ts';
import { ArtifactBuild, readArtifactBuild } from './artifactBuild.ts';

/** Paliers de niveau : on ne dépasse un cap qu'après l'ascension correspondante. */
export const CHARACTER_LEVELS = [1, 20, 40, 50, 60, 70, 80, 90] as const;

export type CharacterLevel = typeof CHARACTER_LEVELS[number];

export const TALENT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type TalentLevel = typeof TALENT_LEVELS[number];

/**
 * Phases déjà faites quand le personnage est à ce niveau, sans l'ascension suivante.
 * 20 n'a pas encore fait la phase 1 ; 40 a fait la phase 1, pas la phase 2.
 */
const PHASES_DONE: Record<CharacterLevel, number> = {
	1: 0,
	20: 0,
	40: 1,
	50: 2,
	60: 3,
	70: 4,
	80: 5,
	90: 6,
};

export type MaterialKind = 'mora' | 'xp' | 'stone' | 'boss' | 'local' | 'common' | 'talentBook' | 'weekly' | 'weaponMat' | 'elite';

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

const KIND_ORDER: MaterialKind[] = ['mora', 'xp', 'stone', 'boss', 'local', 'common', 'talentBook', 'weekly', 'weaponMat', 'elite'];

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

export function isCharacterLevel(value: number): value is CharacterLevel {
	return (CHARACTER_LEVELS as readonly number[]).includes(value);
}

export function isTalentLevel(value: number): value is TalentLevel {
	return (TALENT_LEVELS as readonly number[]).includes(value);
}

export function phasesBetween(current: CharacterLevel, target: CharacterLevel): number[] {
	const from = PHASES_DONE[current];
	const to = PHASES_DONE[target];
	const phases: number[] = [];
	for (let phase = from + 1; phase <= to; phase += 1) phases.push(phase);
	return phases;
}

export interface PlannedCharacter {
	characterId: string;
	currentLevel: CharacterLevel;
	targetLevel: CharacterLevel;
	weaponId: string | null;
	weaponCurrentLevel: CharacterLevel | null;
	weaponTargetLevel: CharacterLevel | null;
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

export function readWeaponLevels(
	weaponId: string | null,
	current: unknown,
	target: unknown,
	legacy: unknown,
): { current: CharacterLevel | null; target: CharacterLevel | null } {
	if (!weaponId) return { current: null, target: null };
	const legacyLevel = isCharacterLevel(Number(legacy)) ? Number(legacy) as CharacterLevel : null;
	const currentLevel = isCharacterLevel(Number(current)) ? Number(current) as CharacterLevel : null;
	const targetLevel = isCharacterLevel(Number(target)) ? Number(target) as CharacterLevel : null;
	if (currentLevel == null && targetLevel == null) return { current: 1, target: legacyLevel ?? 1 };
	const nextCurrent = currentLevel ?? 1;
	let nextTarget = targetLevel ?? legacyLevel ?? nextCurrent;
	if (nextTarget < nextCurrent) nextTarget = nextCurrent;
	return { current: nextCurrent, target: nextTarget };
}

export function withRaisedTargets(plan: PlannedCharacter): PlannedCharacter {
	const targetLevel = plan.targetLevel < plan.currentLevel ? plan.currentLevel : plan.targetLevel;
	const weapon = readWeaponLevels(plan.weaponId, plan.weaponCurrentLevel, plan.weaponTargetLevel, null);
	const normal = readTalentPair(plan.talentNormal, plan.talentNormalTarget, null);
	const skill = readTalentPair(plan.talentSkill, plan.talentSkillTarget, null);
	const burst = readTalentPair(plan.talentBurst, plan.talentBurstTarget, null);
	return {
		...plan,
		targetLevel,
		weaponCurrentLevel: weapon.current,
		weaponTargetLevel: weapon.target,
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
	if (targetLevel < currentLevel) targetLevel = currentLevel;
	const weaponId = typeof raw.weaponId === 'string' && raw.weaponId.trim() !== '' ? raw.weaponId : null;
	const weapon = readWeaponLevels(weaponId, raw.weaponCurrentLevel, raw.weaponTargetLevel, raw.weaponLevel);
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
	return {
		characterId: raw.characterId,
		currentLevel,
		targetLevel,
		weaponId,
		weaponCurrentLevel: weapon.current,
		weaponTargetLevel: weapon.target,
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
		artifactBuild: readArtifactBuild(raw.artifactBuild, artifactSet),
	};
}

export function farmingSignature(plan: PlannedCharacter): string {
	return [
		plan.currentLevel,
		plan.targetLevel,
		plan.weaponId ?? '',
		plan.weaponCurrentLevel ?? '',
		plan.weaponTargetLevel ?? '',
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
	target: CharacterLevel,
	brackets: { from: number; to: number; exp: number }[] = CHARACTER_EXPERIENCE,
): number {
	return brackets.reduce((total, bracket) => (
		bracket.from >= current && bracket.to <= target ? total + bracket.exp : total
	), 0);
}

/** Garde les coches tant que les niveaux, l'arme et les talents n'ont pas changé. */
export function mergeSavedPlan(previous: PlannedCharacter | undefined, next: PlannedCharacter): PlannedCharacter {
	const raised = withRaisedTargets(next);
	const signature = farmingSignature(raised);
	const sameFarm = Boolean(previous && previous.taskSignature === signature);
	return {
		...raised,
		favorite: next.favorite ?? previous?.favorite ?? false,
		done: sameFarm ? (next.done ?? previous?.done ?? false) : false,
		checkedTasks: sameFarm ? (next.checkedTasks ?? previous?.checkedTasks ?? []) : [],
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
	const weaponCosts = gameData.ascension_values.weapons ?? {};

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

	phasesBetween(plan.currentLevel, plan.targetLevel).forEach((phase) => {
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
			phasesBetween(plan.weaponCurrentLevel, plan.weaponTargetLevel).forEach((phase) => {
				const cost = weaponCosts[`phase_${phase}`];
				if (!cost) return;
				add({ id: 'mora', kind: 'mora', count: cost.moras });
				addBag('weapon', 'weaponMat', weaponMats.weapon_materials, cost.weapon_materials);
				addBag('elite', 'elite', weaponMats.elite_enemy_drops, cost.elite_enemy_drops);
				addBag('common', 'common', weaponMats.common_enemy_drops, cost.common_enemy_drops);
			});
		}

	const exp = experienceBetween(plan.currentLevel, plan.targetLevel, experience);
	if (exp > 0) {
		add({ id: 'mora', kind: 'mora', count: Math.floor(exp / 5) });
		add({ id: 'xp:heros-wit', kind: 'xp', name: "Hero's Wit", count: Math.ceil(exp / HERO_WITS_EXP) });
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
	const leveling = plan.currentLevel < plan.targetLevel;
	const weaponLeveling = Boolean(
		weapon
		&& plan.weaponCurrentLevel != null
		&& plan.weaponTargetLevel != null
		&& plan.weaponCurrentLevel < plan.weaponTargetLevel,
	);
	const talents = talentGap(plan);
	const common = character.ascension_materials.common_enemy_drops;
	const weaponCommon = weapon?.ascension_materials?.common_enemy_drops;
	const concerned = new Set<PlannerTab>();

	if (line.kind === 'boss' || line.kind === 'local' || line.kind === 'stone' || line.kind === 'xp') concerned.add('level');
	if (line.kind === 'weaponMat' || line.kind === 'elite') concerned.add('weapon');
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
