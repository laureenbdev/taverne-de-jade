import { GENSHIN_API_ROOT } from './apiRoot.ts';

export interface QuestEntry {
	id: string;
	name: string;
	nameFr: string;
	primogems?: number;
	mora?: number;
	adventureExp?: number;
	description?: string;
	descriptionFr?: string;
}

export interface QuestChapter {
	id: string;
	name: string;
	nameFr: string;
	chapter?: string;
	chapterFr?: string;
	region?: string;
	regionFr?: string;
	image?: string;
	quests: QuestEntry[];
}

export interface QuestGroup {
	id: string;
	name: string;
	nameFr: string;
	chapters: QuestChapter[];
}

export interface QuestsPayload {
	rewardImage?: string;
	groups: QuestGroup[];
}

export interface AchievementEntry {
	id: string;
	name: string;
	nameFr: string;
	description?: string;
	descriptionFr?: string;
	progress?: number;
	primogems?: number;
	version?: string;
	chain?: string;
}

export interface AchievementGroup {
	id: string;
	name: string;
	nameFr: string;
	image?: string;
	achievements: AchievementEntry[];
}

export interface AchievementsPayload {
	rewardImage?: string;
	groups: AchievementGroup[];
}

export interface ViewpointEntry {
	id: string;
	name: string;
	nameFr: string;
	description?: string;
	descriptionFr?: string;
	image?: string;
	place?: string;
	placeFr?: string;
}

export interface ViewpointArea {
	id: string;
	name: string;
	nameFr: string;
	viewpoints: ViewpointEntry[];
}

export interface ViewpointNation {
	id: string;
	name: string;
	nameFr: string;
	image?: string;
	areas: ViewpointArea[];
}

export interface ViewpointsPayload {
	groups: ViewpointNation[];
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
	return response.json() as Promise<T>;
}

export class AdvancementApiService {
	private static quests: QuestsPayload | null = null;
	private static achievements: AchievementsPayload | null = null;
	private static viewpoints: ViewpointsPayload | null = null;
	private static questsPromise: Promise<QuestsPayload> | null = null;
	private static achievementsPromise: Promise<AchievementsPayload> | null = null;
	private static viewpointsPromise: Promise<ViewpointsPayload> | null = null;

	static getQuests(): Promise<QuestsPayload> {
		if (this.quests) return Promise.resolve(this.quests);
		if (!this.questsPromise) {
			this.questsPromise = fetchJson<QuestsPayload>(`${GENSHIN_API_ROOT}/quests.json`)
				.then((data) => {
					this.quests = data;
					this.questsPromise = null;
					return data;
				})
				.catch((error) => {
					this.questsPromise = null;
					throw error;
				});
		}
		return this.questsPromise;
	}

	static getAchievements(): Promise<AchievementsPayload> {
		if (this.achievements) return Promise.resolve(this.achievements);
		if (!this.achievementsPromise) {
			this.achievementsPromise = fetchJson<AchievementsPayload>(`${GENSHIN_API_ROOT}/achievements.json`)
				.then((data) => {
					this.achievements = data;
					this.achievementsPromise = null;
					return data;
				})
				.catch((error) => {
					this.achievementsPromise = null;
					throw error;
				});
		}
		return this.achievementsPromise;
	}

	static getViewpoints(): Promise<ViewpointsPayload> {
		if (this.viewpoints) return Promise.resolve(this.viewpoints);
		if (!this.viewpointsPromise) {
			this.viewpointsPromise = fetchJson<ViewpointsPayload>(`${GENSHIN_API_ROOT}/viewpoints.json`)
				.then((data) => {
					this.viewpoints = data;
					this.viewpointsPromise = null;
					return data;
				})
				.catch((error) => {
					this.viewpointsPromise = null;
					throw error;
				});
		}
		return this.viewpointsPromise;
	}

	static async getAll() {
		const [quests, achievements, viewpoints] = await Promise.all([
			this.getQuests(),
			this.getAchievements(),
			this.getViewpoints(),
		]);
		return { quests, achievements, viewpoints };
	}
}
