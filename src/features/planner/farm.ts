import { Character } from '../../services/genshin/charactersApi.ts';
import { GameData } from '../../services/genshin/gameDataApi.ts';
import { CatalogItem, FarmSource, MaterialCatalog } from '../../services/genshin/materialsApi.ts';
import { Weapon } from '../../services/genshin/weaponsApi.ts';
import {
	CHARACTER_EXPERIENCE,
	FarmNeed,
	MaterialKind,
	needsForCharacter,
	PlannedCharacter,
} from './materials.ts';

export const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type FarmSectionId = 'today' | 'later' | 'boss' | 'weekly' | 'local' | 'common' | 'elite' | 'overworld';

export const FARM_SECTIONS: FarmSectionId[] = ['today', 'later', 'boss', 'weekly', 'local', 'common', 'elite', 'overworld'];

const SUMMARY_KINDS = new Set<MaterialKind>(['mora', 'xp', 'weaponMat']);

export interface FarmTask {
	id: string;
	characterId: string;
	characterName: string;
	favorite: boolean;
	line: FarmNeed;
	item?: CatalogItem;
	source: FarmSource;
	family: string;
	bossFamily: string;
}

export interface FarmCluster {
	key: string;
	section: FarmSectionId;
	title: string;
	subtitle: string;
	days: string[];
	resin: number;
	dayCount: number;
	tasks: FarmTask[];
}

export interface FarmStock {
	mora: number;
	xp: number;
	weaponStones: number;
	resinImage?: string;
	moraImage?: string;
	xpImage?: string;
	weaponImage?: string;
}

export interface FarmView {
	sections: { id: FarmSectionId; clusters: FarmCluster[] }[];
	resin: number;
	days: number;
	stock: FarmStock;
	idleCharacterIds: string[];
}

const ALL_DAYS = [...WEEK_DAYS];

function sourceOf(kind: MaterialKind, item?: CatalogItem): FarmSource {
	if (item) return item.source;
	if (kind === 'talentBook' || kind === 'weaponMat') return 'domain';
	if (kind === 'boss' || kind === 'stone') return 'boss';
	if (kind === 'weekly') return 'weekly';
	if (kind === 'mora' || kind === 'xp') return 'leyline';
	return 'overworld';
}

function matchItem(items: CatalogItem[], line: FarmNeed): CatalogItem | undefined {
	if (line.kind === 'mora') return items.find((item) => item.kind === 'mora');
	if (line.kind === 'xp') return items.find((item) => item.name === "Hero's Wit");
	if (line.kind === 'stone') return items.find((item) => item.kind === 'stone' && item.family === line.element && item.tier === line.tier);
	if (line.kind === 'boss' || line.kind === 'local' || line.kind === 'weekly') {
		return items.find((item) => item.kind === line.kind && item.family === line.name);
	}
	return items.find((item) => item.kind === line.kind && item.family === line.name && item.rarity === line.rarity);
}

function minRuns(needs: Map<number, number>, drops: Map<number, number>): number {
	let runs = 0;
	[...needs.keys()].sort((a, b) => b - a).forEach((rarity) => {
		const count = needs.get(rarity) ?? 0;
		if (count <= 0) return;
		const perRun = drops.get(rarity) || 1;
		runs += Math.ceil(count / perRun);
	});
	return runs;
}

function defaultDrop(kind: MaterialKind): number {
	if (kind === 'mora') return 60000;
	if (kind === 'xp') return 5;
	if (kind === 'boss') return 3;
	if (kind === 'weekly' || kind === 'talentBook') return 2;
	return 1;
}

function dropTable(items: CatalogItem[], kind: MaterialKind, family: string, fallback = defaultDrop(kind)): Map<number, number> {
	const drops = new Map<number, number>();
	items.filter((item) => item.kind === kind && item.family === family).forEach((item) => {
		if (item.dropMax > 0) drops.set(item.rarity, item.dropMax);
	});
	if (drops.size === 0) drops.set(0, fallback);
	return drops;
}

function needMap(tasks: FarmTask[]): Map<number, number> {
	const needs = new Map<number, number>();
	tasks.forEach((task) => {
		const rarity = task.line.rarity ?? task.item?.rarity ?? 0;
		needs.set(rarity, (needs.get(rarity) ?? 0) + task.line.count);
	});
	return needs;
}

function calendarDays(resin: number, open: string[], resinPerDay: number, start: Date): number {
	if (resin <= 0) return 0;
	const openDays = new Set((open.length ? open : ALL_DAYS).map((day) => WEEK_DAYS.indexOf(day as typeof WEEK_DAYS[number])));
	let left = resin;
	const cursor = new Date(start);
	cursor.setHours(12, 0, 0, 0);
	for (let span = 1; span < 400; span += 1) {
		if (openDays.has(cursor.getDay())) left -= resinPerDay;
		if (left <= 0) return span;
		cursor.setDate(cursor.getDate() + 1);
	}
	return 400;
}

function walkDays(buckets: { resin: number; open: string[] }[], resinPerDay: number, start: Date): number {
	const left = buckets.filter((bucket) => bucket.resin > 0).map((bucket) => ({ ...bucket }));
	if (left.length === 0) return 0;
	const cursor = new Date(start);
	cursor.setHours(12, 0, 0, 0);
	for (let span = 1; span < 400; span += 1) {
		let budget = resinPerDay;
		const available = left
			.filter((bucket) => bucket.resin > 0 && (bucket.open.length === 0 || bucket.open.includes(WEEK_DAYS[cursor.getDay()])))
			.sort((a, b) => (a.open.length || 7) - (b.open.length || 7));
		available.forEach((bucket) => {
			if (budget <= 0) return;
			const spend = Math.min(budget, bucket.resin);
			bucket.resin -= spend;
			budget -= spend;
		});
		if (left.every((bucket) => bucket.resin <= 0)) return span;
		cursor.setDate(cursor.getDate() + 1);
	}
	return 400;
}

function sectionFor(task: FarmTask, today: string): FarmSectionId {
	if (task.line.kind === 'talentBook') return (task.item?.days ?? []).includes(today) ? 'today' : 'later';
	if (task.line.kind === 'boss' || task.line.kind === 'stone') return 'boss';
	if (task.line.kind === 'weekly') return 'weekly';
	if (task.line.kind === 'local') return 'local';
	if (task.line.kind === 'common') return 'common';
	if (task.line.kind === 'elite') return 'elite';
	return 'overworld';
}

function clusterTitle(task: FarmTask): string {
	if (task.line.kind === 'mora') return 'mora';
	if (task.line.kind === 'xp') return 'xp';
	if (task.line.kind === 'stone') return task.bossFamily || task.family;
	return task.item?.family || task.line.name || task.family;
}

export function buildFarm(input: {
	plans: PlannedCharacter[];
	characters: Character[];
	weapons: Weapon[];
	gameData: GameData;
	catalog: MaterialCatalog | null;
	today?: Date;
}): FarmView {
	const today = input.today ?? new Date();
	const todayName = WEEK_DAYS[today.getDay()];
	const resinPerDay = input.catalog?.resinPerDay ?? 180;
	const experience = input.catalog?.experience?.length ? input.catalog.experience : CHARACTER_EXPERIENCE;
	const catalogItems = input.catalog?.items ?? [];
	const characters = new Map(input.characters.map((character) => [character.id, character]));
	const weapons = new Map(input.weapons.map((weapon) => [weapon.id, weapon]));

	const tasks: FarmTask[] = [];
	input.plans.forEach((plan) => {
		const character = characters.get(plan.characterId);
		const weapon = plan.weaponId ? weapons.get(plan.weaponId) : undefined;
		needsForCharacter(plan, character, weapon, input.gameData, experience).forEach((line) => {
			const item = matchItem(catalogItems, line);
			const source = sourceOf(line.kind, item);
			tasks.push({
				id: `${plan.characterId}:${line.id}`,
				characterId: plan.characterId,
				characterName: character?.name ?? plan.characterId,
				favorite: plan.favorite,
				line,
				item,
				source,
				family: item?.family || line.name || line.element || line.kind,
				bossFamily: character?.ascension_materials.boss_drops ?? '',
			});
		});
	});

	const stock: FarmStock = {
		mora: 0,
		xp: 0,
		weaponStones: 0,
		resinImage: input.catalog?.resinImage,
		moraImage: catalogItems.find((item) => item.kind === 'mora')?.image,
		xpImage: catalogItems.find((item) => item.name === "Hero's Wit")?.image,
		weaponImage: input.catalog?.weaponOreImage,
	};
	const hidden: FarmTask[] = [];

	const clusters = new Map<string, FarmCluster>();
	const ensure = (key: string, sample: FarmTask, section: FarmSectionId, title: string, days: string[]): FarmCluster => {
		const existing = clusters.get(key);
		if (existing) return existing;
		const cluster: FarmCluster = { key, section, title, subtitle: sample.item?.sourceName ?? '', days, resin: 0, dayCount: 0, tasks: [] };
		clusters.set(key, cluster);
		return cluster;
	};

	tasks.forEach((task) => {
		if (task.line.kind === 'mora') {
			stock.mora += task.line.count;
			if (task.item?.image) stock.moraImage = task.item.image;
			hidden.push(task);
			return;
		}
		if (task.line.kind === 'xp') {
			stock.xp += task.line.count;
			if (task.item?.image) stock.xpImage = task.item.image;
			hidden.push(task);
			return;
		}
		if (task.line.kind === 'weaponMat') {
			stock.weaponStones += task.line.count;
			hidden.push(task);
			return;
		}
		if (task.line.kind === 'stone') return;
		const days = task.item?.days ?? [];
		const section = sectionFor(task, todayName);
		const key = `${section}|${task.family}|${days.join(',')}`;
		ensure(key, task, section, clusterTitle(task), days).tasks.push(task);
	});

	tasks.filter((task) => task.line.kind === 'stone').forEach((task) => {
		const key = `boss|${task.bossFamily || task.family}`;
		const host = [...clusters.values()].find((cluster) => cluster.tasks.some((entry) => entry.characterId === task.characterId && entry.line.kind === 'boss'));
		const cluster = host ?? ensure(key, task, 'boss', task.bossFamily || task.family, []);
		cluster.tasks.push(task);
	});

	clusters.forEach((cluster) => {
		const sample = cluster.tasks.find((task) => task.item) ?? cluster.tasks[0];
		const resinEach = sample.item?.resin ?? (sample.source === 'overworld' ? 0 : 20);
		if (resinEach <= 0 || sample.source === 'overworld') {
			cluster.resin = 0;
			cluster.dayCount = 0;
			return;
		}
		if (sample.source === 'boss' || cluster.tasks.some((task) => task.line.kind === 'stone')) {
			const bossTasks = cluster.tasks.filter((task) => task.line.kind === 'boss');
			const gemTasks = cluster.tasks.filter((task) => task.line.kind === 'stone');
			const bossFamily = bossTasks[0]?.family ?? gemTasks[0]?.bossFamily ?? '';
			const gemFamily = gemTasks[0]?.item?.family ?? gemTasks[0]?.line.element ?? '';
			const bossRuns = bossTasks.length ? minRuns(needMap(bossTasks), dropTable(catalogItems, 'boss', bossFamily)) : 0;
			const gemRuns = gemTasks.length ? minRuns(needMap(gemTasks), dropTable(catalogItems, 'stone', gemFamily)) : 0;
			const runs = Math.max(bossRuns, gemRuns);
			cluster.resin = runs * 40;
			cluster.dayCount = calendarDays(cluster.resin, ALL_DAYS, resinPerDay, today);
			return;
		}
		const family = sample.family;
		const runs = minRuns(needMap(cluster.tasks), dropTable(catalogItems, sample.line.kind, family));
		cluster.resin = runs * resinEach;
		if (sample.source === 'weekly') {
			const claims = runs;
			cluster.dayCount = claims === 0 ? 0 : 1 + (claims - 1) * 7;
			return;
		}
		cluster.dayCount = calendarDays(cluster.resin, cluster.days, resinPerDay, today);
	});

	const sortTasks = (list: FarmTask[]) => list.sort((a, b) => (
		Number(b.favorite) - Number(a.favorite) || a.characterName.localeCompare(b.characterName) || a.line.id.localeCompare(b.line.id)
	));

	const ordered = [...clusters.values()].map((cluster) => ({ ...cluster, tasks: sortTasks(cluster.tasks) }));
	ordered.sort((a, b) => Number(b.tasks.some((task) => task.favorite)) - Number(a.tasks.some((task) => task.favorite)) || a.title.localeCompare(b.title));

	const sections = FARM_SECTIONS.flatMap((id) => {
		const list = ordered.filter((cluster) => cluster.section === id);
		if (list.length === 0) return [];
		return [{ id, clusters: list }];
	});

	const hiddenBuckets = new Map<string, FarmTask[]>();
	hidden.forEach((task) => {
		const key = `${task.line.kind}|${task.family}`;
		const list = hiddenBuckets.get(key) ?? [];
		list.push(task);
		hiddenBuckets.set(key, list);
	});
	const hiddenRuns: { resin: number; open: string[] }[] = [];
	hiddenBuckets.forEach((list) => {
		const sample = list[0];
		const runs = minRuns(needMap(list), dropTable(catalogItems, sample.line.kind, sample.family));
		const resinEach = sample.item?.resin ?? 20;
		const resin = runs * resinEach;
		if (resin <= 0) return;
		hiddenRuns.push({ resin, open: sample.item?.days ?? [] });
	});

	const weeklyClaims = ordered.filter((cluster) => cluster.section === 'weekly').map((cluster) => (
		cluster.resin > 0 && cluster.tasks[0]?.item?.resin ? cluster.resin / cluster.tasks[0].item.resin : 0
	));
	const weeklyWeeks = weeklyClaims.length
		? Math.max(...weeklyClaims, Math.ceil(weeklyClaims.reduce((total, claims) => total + claims, 0) / 3))
		: 0;
	const weeklySpan = weeklyWeeks === 0 ? 0 : 1 + (weeklyWeeks - 1) * 7;
	const flexible = [
		...ordered.filter((cluster) => cluster.resin > 0).map((cluster) => ({
			resin: cluster.resin,
			open: cluster.section === 'today' || cluster.section === 'later' ? cluster.days : ALL_DAYS,
		})),
		...hiddenRuns,
	];
	const resin = flexible.reduce((total, bucket) => total + bucket.resin, 0);
	const days = Math.max(walkDays(flexible, resinPerDay, today), weeklySpan);

	const busy = new Set(tasks.filter((task) => !SUMMARY_KINDS.has(task.line.kind)).map((task) => task.characterId));
	const idleCharacterIds = input.plans
		.map((plan) => plan.characterId)
		.filter((id) => !busy.has(id));

	return { sections, resin, days, stock, idleCharacterIds };
}
