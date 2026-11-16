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
	target_level: number;
	weapon_id: string | null;
	weapon_level: number | null;
	weapon_current_level: number | null;
	weapon_target_level: number | null;
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

function toPlan(row: PlannerRow): PlannedCharacter | null {
	const weaponId = typeof row.weapon_id === 'string' && row.weapon_id.trim() !== '' ? row.weapon_id : null;
	const weapon = readWeaponLevels(weaponId, row.weapon_current_level, row.weapon_target_level, row.weapon_level);
	const normal = readTalentPair(row.talent_normal_current, row.talent_normal_target, row.talent_normal);
	const skill = readTalentPair(row.talent_skill_current, row.talent_skill_target, row.talent_skill);
	const burst = readTalentPair(row.talent_burst_current, row.talent_burst_target, row.talent_burst);
	return planFromLegacy({
		characterId: row.character_id,
		currentLevel: Number(row.current_level) as PlannedCharacter['currentLevel'],
		targetLevel: Number(row.target_level) as PlannedCharacter['targetLevel'],
		weaponId,
		weaponCurrentLevel: weapon.current,
		weaponTargetLevel: weapon.target,
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
		checkedTasks: Array.isArray(row.checked_tasks) ? row.checked_tasks : [],
		artifactBuild: row.artifact_build ?? null,
	});
}

function toRow(plan: PlannedCharacter) {
	return {
		character_id: plan.characterId,
		current_level: plan.currentLevel,
		target_level: plan.targetLevel,
		weapon_id: plan.weaponId,
		weapon_level: plan.weaponTargetLevel,
		weapon_current_level: plan.weaponCurrentLevel,
		weapon_target_level: plan.weaponTargetLevel,
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

export async function listPlanner(userId: string): Promise<PlannedCharacter[]> {
	const client = requireClient();
	const full = await client
		.from('planner_characters')
		.select(PLANNER_COLUMNS)
		.eq('user_id', userId);
	let data = full.data;
	if (full.error) {
		if (!/column/i.test(full.error.message)) throw new Error(full.error.message);
		const legacy = await client.from('planner_characters').select(LEGACY_COLUMNS).eq('user_id', userId);
		if (legacy.error) throw new Error(legacy.error.message);
		data = legacy.data;
	}
	return ((data ?? []) as PlannerRow[]).flatMap((row) => {
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
