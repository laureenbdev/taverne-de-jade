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
	hidden_tasks?: string[] | null;
	artifact_build?: unknown;
	notes?: string | null;
};

export type PlannerFarmViewMode = 'source' | 'character' | 'table';

function isFarmViewMode(value: unknown): value is PlannerFarmViewMode {
	return value === 'source' || value === 'character' || value === 'table';
}

function isMissingColumn(message: string, column: string) {
	return message.includes(column) && /schema cache|does not exist|could not find/i.test(message);
}

function requireClient() {
	if (!supabase) throw new Error('Supabase is not configured');
	return supabase;
}

function readTaskIds(raw: unknown): string[] {
	if (Array.isArray(raw)) return raw.filter((id): id is string => typeof id === 'string');
	if (typeof raw === 'string') {
		try {
			return readTaskIds(JSON.parse(raw));
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
		checkedTasks: readTaskIds(row.checked_tasks),
		hiddenTasks: readTaskIds(row.hidden_tasks),
		artifactBuild: row.artifact_build ?? null,
		notes: typeof row.notes === 'string' ? row.notes : '',
	});
}

function toRow(plan: PlannedCharacter, includeNotes = true) {
	const row: Record<string, unknown> = {
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
		hidden_tasks: plan.hiddenTasks,
		artifact_build: plan.artifactBuild,
	};
	if (includeNotes) row.notes = plan.notes;
	return row;
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
	'hidden_tasks',
	'artifact_build',
	'notes',
].join(', ');

const PLANNER_COLUMNS_WITHOUT_NOTES = [
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
	'hidden_tasks',
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

const HIDDEN_COLUMNS = [
	TASK_COLUMNS,
	'hidden_tasks',
].join(', ');

export async function listPlanner(userId: string): Promise<PlannedCharacter[]> {
	const client = requireClient();
	const attempts = [PLANNER_COLUMNS, PLANNER_COLUMNS_WITHOUT_NOTES, HIDDEN_COLUMNS, TASK_COLUMNS, LEGACY_COLUMNS];
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
	if (error && isMissingColumn(error.message, 'notes')) {
		const { error: fallback } = await client.from('planner_characters').insert({
			user_id: userId,
			...toRow(plan, false),
		});
		if (fallback) throw new Error(fallback.message);
		return;
	}
	if (error) throw new Error(error.message);
}

export async function updatePlanner(userId: string, plan: PlannedCharacter): Promise<void> {
	const client = requireClient();
	const { error } = await client
		.from('planner_characters')
		.update(toRow(plan))
		.eq('user_id', userId)
		.eq('character_id', plan.characterId);
	if (error && isMissingColumn(error.message, 'notes')) {
		const { error: fallback } = await client
			.from('planner_characters')
			.update(toRow(plan, false))
			.eq('user_id', userId)
			.eq('character_id', plan.characterId);
		if (fallback) throw new Error(fallback.message);
		return;
	}
	if (error) throw new Error(error.message);
}

export async function readPlannerFarmView(userId: string): Promise<PlannerFarmViewMode | null> {
	const client = requireClient();
	const { data, error } = await client
		.from('profiles')
		.select('planner_farm_view')
		.eq('id', userId)
		.maybeSingle();
	if (error) {
		if (isMissingColumn(error.message, 'planner_farm_view')) return null;
		throw new Error(error.message);
	}
	const value = (data as { planner_farm_view?: unknown } | null)?.planner_farm_view;
	return isFarmViewMode(value) ? value : null;
}

export async function writePlannerFarmView(userId: string, mode: PlannerFarmViewMode): Promise<void> {
	const client = requireClient();
	const { error } = await client.from('profiles').upsert({
		id: userId,
		planner_farm_view: mode,
	}, { onConflict: 'id' });
	if (error && isMissingColumn(error.message, 'planner_farm_view')) return;
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
