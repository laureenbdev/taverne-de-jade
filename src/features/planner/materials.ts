import { Character } from '../../services/genshin/charactersApi.ts';
import { GameData, MaterialBag } from '../../services/genshin/gameDataApi.ts';
import { Weapon } from '../../services/genshin/weaponsApi.ts';

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

export type MaterialKind = 'mora' | 'stone' | 'boss' | 'local' | 'common' | 'talentBook' | 'weekly' | 'weaponMat' | 'elite';

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

const KIND_ORDER: MaterialKind[] = ['mora', 'stone', 'boss', 'local', 'common', 'talentBook', 'weekly', 'weaponMat', 'elite'];

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
	};
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

	plans.forEach((plan) => {
		const character = byId.get(plan.characterId);
		if (!character) return;

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

		const weapon = plan.weaponId ? weaponsById.get(plan.weaponId) : undefined;
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
	});

	return [...totals.values()].sort((a, b) => {
		const kindDiff = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
		if (kindDiff !== 0) return kindDiff;
		return a.id.localeCompare(b.id);
	});
}
