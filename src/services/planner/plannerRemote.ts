import {
	planFromLegacy,
	PlannedCharacter,
	readTalentPair,
	readWeaponLevels,
} from '../../features/planner/materials.ts';
import { supabase } from '../../lib/supabase.js';

type PlannerRow = {
	character_id: string;
	current_level: number;
	current_ascended?: boolean | null;
	target_level: number;
	target_ascended?: boolean | null;
	weapon_id: string | null;
	weapon_level: number | null;
	weapon_current_level: number | null;
	weapon_current_ascended?: boolean | null;
	weapon_target_level: number | null;
	weapon_target_ascended?: boolean | null;
	talent_normal: number | null;
	talent_skill: number | null;
	talent_burst: number | null;
	talent_normal_current: number | null;
	talent_normal_target: number | null;
	talent_skill_current: number | null;
	talent_skill_target: number | null;
	talent_burst_current: number | null;
	talent_burst_target: number | null;
	artifact_set: string | null;
	favorite?: boolean | null;
	done?: boolean | null;
	task_signature?: string | null;
	checked_tasks?: string[] | null;
	artifact_build?: unknown;
};

function requireClient() {
	if (!supabase) throw new Error('Supabase is not configured');
	return supabase;
}

function readCheckedTasks(raw: unknown): string[] {
	if (Array.isArray(raw)) return raw.filter((id): id is string => typeof id === 'string');
	if (typeof raw === 'string') {
		try {
			return readCheckedTasks(JSON.parse(raw));
		} catch {
			return [];
		}
	}
	return [];
}

function toPlan(row: PlannerRow): PlannedCharacter | null {
	const weaponId = typeof row.weapon_id === 'string' && row.weapon_id.trim() !== '' ? row.weapon_id : null;
	const weapon = readWeaponLevels(
		weaponId,
		row.weapon_current_level,
		row.weapon_target_level,
		row.weapon_level,
		row.weapon_current_ascended,
		row.weapon_target_ascended,
	);
	const normal = readTalentPair(row.talent_normal_current, row.talent_normal_target, row.talent_normal);
	const skill = readTalentPair(row.talent_skill_current, row.talent_skill_target, row.talent_skill);
	const burst = readTalentPair(row.talent_burst_current, row.talent_burst_target, row.talent_burst);
	return planFromLegacy({
		characterId: row.character_id,
		currentLevel: Number(row.current_level) as PlannedCharacter['currentLevel'],
		currentAscended: row.current_ascended === true,
		targetLevel: Number(row.target_level) as PlannedCharacter['targetLevel'],
		targetAscended: row.target_ascended === true,
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
		artifactSet: row.artifact_set,
		favorite: row.favorite === true,
		done: row.done === true,
		taskSignature: row.task_signature ?? '',
		checkedTasks: readCheckedTasks(row.checked_tasks),
		artifactBuild: row.artifact_build ?? null,
	});
}

function toRow(plan: PlannedCharacter) {
	return {
		character_id: plan.characterId,
		current_level: plan.currentLevel,
		current_ascended: plan.currentAscended,
		target_level: plan.targetLevel,
		target_ascended: plan.targetAscended,
		weapon_id: plan.weaponId,
		weapon_level: plan.weaponTargetLevel,
		weapon_current_level: plan.weaponCurrentLevel,
		weapon_current_ascended: plan.weaponId ? plan.weaponCurrentAscended : null,
		weapon_target_level: plan.weaponTargetLevel,
		weapon_target_ascended: plan.weaponId ? plan.weaponTargetAscended : null,
		talent_normal: plan.talentNormalTarget,
		talent_skill: plan.talentSkillTarget,
		talent_burst: plan.talentBurstTarget,
		talent_normal_current: plan.talentNormal,
		talent_normal_target: plan.talentNormalTarget,
		talent_skill_current: plan.talentSkill,
		talent_skill_target: plan.talentSkillTarget,
		talent_burst_current: plan.talentBurst,
		talent_burst_target: plan.talentBurstTarget,
		artifact_set: plan.artifactBuild?.set ?? plan.artifactSet,
		favorite: plan.favorite,
		done: plan.done,
		task_signature: plan.taskSignature,
		checked_tasks: plan.checkedTasks,
		artifact_build: plan.artifactBuild,
	};
}

const PLANNER_COLUMNS = [
	'character_id',
	'current_level',
	'current_ascended',
	'target_level',
	'target_ascended',
	'weapon_id',
	'weapon_level',
	'weapon_current_level',
	'weapon_current_ascended',
	'weapon_target_level',
	'weapon_target_ascended',
	'talent_normal',
	'talent_skill',
	'talent_burst',
	'talent_normal_current',
	'talent_normal_target',
	'talent_skill_current',
	'talent_skill_target',
	'talent_burst_current',
	'talent_burst_target',
	'artifact_set',
	'favorite',
	'done',
	'task_signature',
	'checked_tasks',
	'artifact_build',
].join(', ');

const LEGACY_COLUMNS = [
	'character_id',
	'current_level',
	'target_level',
	'weapon_id',
	'weapon_level',
	'weapon_current_level',
	'weapon_target_level',
	'talent_normal',
	'talent_skill',
	'talent_burst',
	'talent_normal_current',
	'talent_normal_target',
	'talent_skill_current',
	'talent_skill_target',
	'talent_burst_current',
	'talent_burst_target',
	'artifact_set',
].join(', ');

const TASK_COLUMNS = [
	LEGACY_COLUMNS,
	'favorite',
	'done',
	'task_signature',
	'checked_tasks',
	'artifact_build',
].join(', ');

export async function listPlanner(userId: string): Promise<PlannedCharacter[]> {
	const client = requireClient();
	const attempts = [PLANNER_COLUMNS, TASK_COLUMNS, LEGACY_COLUMNS];
	let data: PlannerRow[] | null = null;
	let lastError: string | null = null;
	for (const columns of attempts) {
		const result = await client
			.from('planner_characters')
			.select(columns)
			.eq('user_id', userId);
		if (!result.error) {
			data = (result.data ?? []) as PlannerRow[];
			break;
		}
		lastError = result.error.message;
		if (!/column/i.test(result.error.message)) throw new Error(result.error.message);
	}
	if (data == null) throw new Error(lastError ?? 'Impossible de charger le planificateur');
	return data.flatMap((row) => {
		const plan = toPlan(row);
		return plan ? [plan] : [];
	});
}

export async function insertPlanner(userId: string, plan: PlannedCharacter): Promise<void> {
	const client = requireClient();
	const { error } = await client.from('planner_characters').insert({
		user_id: userId,
		...toRow(plan),
	});
	if (error) throw new Error(error.message);
}

export async function updatePlanner(userId: string, plan: PlannedCharacter): Promise<void> {
	const client = requireClient();
	const { error } = await client
		.from('planner_characters')
		.update(toRow(plan))
		.eq('user_id', userId)
		.eq('character_id', plan.characterId);
	if (error) throw new Error(error.message);
}

export async function deletePlanner(userId: string, characterId: string): Promise<void> {
	const client = requireClient();
	const { error } = await client
		.from('planner_characters')
		.delete()
		.eq('user_id', userId)
		.eq('character_id', characterId);
	if (error) throw new Error(error.message);
}
