import { ArtifactSetInfo } from '../../services/genshin/artifactsApi.ts';
import { ArtifactBuild, hasArtifactPlan } from './artifactBuild.ts';
import { PlannedCharacter } from './materials.ts';

export interface ArtifactFarmCharacter {
	characterId: string;
	characterName: string;
	favorite: boolean;
	done: boolean;
	build: ArtifactBuild;
}

export interface ArtifactFarmSet {
	name: string;
	image: string;
	favorite: boolean;
	allDone: boolean;
	characters: ArtifactFarmCharacter[];
}

export interface ArtifactFarmCluster {
	key: string;
	title: string;
	favorite: boolean;
	sets: ArtifactFarmSet[];
	characters: ArtifactFarmCharacter[];
}

export interface ArtifactStatEntry {
	stat: string;
	/** true si au moins un perso non coché demande encore cette stat */
	open: boolean;
}

export interface ArtifactSetStats {
	setName: string;
	image: string;
	sands: ArtifactStatEntry[];
	goblet: ArtifactStatEntry[];
	circlet: ArtifactStatEntry[];
	subs: ArtifactStatEntry[];
}

type DomainBucket = {
	key: string;
	title: string;
	sets: Map<string, {
		name: string;
		image: string;
		characters: Map<string, ArtifactFarmCharacter>;
	}>;
	characters: Map<string, ArtifactFarmCharacter>;
};

function domainKeyFor(
	info: ArtifactSetInfo | undefined,
	labels: { boss: string; other: string },
): { key: string; title: string } {
	if (info?.domain) {
		return { key: `domain:${info.domain}`, title: info.domain };
	}
	if (info?.source === 'boss') {
		return { key: 'boss', title: labels.boss };
	}
	return { key: 'other', title: labels.other };
}

function sortCharacters(list: ArtifactFarmCharacter[], locale: string): ArtifactFarmCharacter[] {
	return [...list].sort((left, right) => (
		Number(right.favorite) - Number(left.favorite)
		|| left.characterName.localeCompare(right.characterName, locale)
	));
}

function characterEntry(
	plan: PlannedCharacter,
	build: ArtifactBuild,
	nameOf: (characterId: string) => string,
): ArtifactFarmCharacter {
	return {
		characterId: plan.characterId,
		characterName: nameOf(plan.characterId),
		favorite: plan.favorite,
		done: build.done === true,
		build,
	};
}

export function buildArtifactFarm(input: {
	plans: PlannedCharacter[];
	setsByName: Map<string, ArtifactSetInfo>;
	nameOf: (characterId: string) => string;
	labels: { boss: string; other: string };
	locale: string;
}): ArtifactFarmCluster[] {
	const buckets = new Map<string, DomainBucket>();

	input.plans.forEach((plan) => {
		const build = plan.artifactBuild;
		if (!build || !hasArtifactPlan(build)) return;
		const setNames = [build.set, build.setB].filter((entry): entry is string => Boolean(entry));
		if (setNames.length === 0) {
			const key = 'other';
			let bucket = buckets.get(key);
			if (!bucket) {
				bucket = { key, title: input.labels.other, sets: new Map(), characters: new Map() };
				buckets.set(key, bucket);
			}
			bucket.characters.set(plan.characterId, characterEntry(plan, build, input.nameOf));
			return;
		}

		const entry = characterEntry(plan, build, input.nameOf);
		setNames.forEach((setName) => {
			const info = input.setsByName.get(setName.toLowerCase());
			const domain = domainKeyFor(info, input.labels);
			let bucket = buckets.get(domain.key);
			if (!bucket) {
				bucket = { key: domain.key, title: domain.title, sets: new Map(), characters: new Map() };
				buckets.set(domain.key, bucket);
			}
			bucket.characters.set(plan.characterId, entry);
			const setKey = setName.toLowerCase();
			let setBucket = bucket.sets.get(setKey);
			if (!setBucket) {
				setBucket = {
					name: setName,
					image: info?.image ?? '',
					characters: new Map(),
				};
				bucket.sets.set(setKey, setBucket);
			}
			setBucket.characters.set(plan.characterId, entry);
		});
	});

	return [...buckets.values()]
		.map((bucket) => {
			const characters = sortCharacters([...bucket.characters.values()], input.locale);
			const sets = [...bucket.sets.values()]
				.map((set) => {
					const setCharacters = sortCharacters([...set.characters.values()], input.locale);
					return {
						name: set.name,
						image: set.image,
						favorite: setCharacters.some((character) => character.favorite),
						allDone: setCharacters.length > 0 && setCharacters.every((character) => character.done),
						characters: setCharacters,
					};
				})
				.sort((left, right) => (
					Number(right.favorite) - Number(left.favorite)
					|| left.name.localeCompare(right.name, input.locale)
				));
			return {
				key: bucket.key,
				title: bucket.title,
				favorite: characters.some((character) => character.favorite),
				sets,
				characters,
			};
		})
		.sort((left, right) => (
			Number(right.favorite) - Number(left.favorite)
			|| left.title.localeCompare(right.title, input.locale)
		));
}

function collectStatEntries(
	characters: ArtifactFarmCharacter[],
	pick: (build: ArtifactFarmCharacter['build']) => string[],
): ArtifactStatEntry[] {
	const byStat = new Map<string, boolean>();
	characters.forEach((character) => {
		pick(character.build).forEach((stat) => {
			if (!stat) return;
			const open = !character.done;
			byStat.set(stat, (byStat.get(stat) ?? false) || open);
		});
	});
	return [...byStat.entries()].map(([stat, open]) => ({ stat, open }));
}

export function statsForArtifactSet(set: ArtifactFarmSet): ArtifactSetStats {
	return {
		setName: set.name,
		image: set.image,
		sands: collectStatEntries(set.characters, (build) => (build.sands ? [build.sands] : [])),
		goblet: collectStatEntries(set.characters, (build) => (build.goblet ? [build.goblet] : [])),
		circlet: collectStatEntries(set.characters, (build) => (build.circlet ? [build.circlet] : [])),
		subs: collectStatEntries(set.characters, (build) => build.subs.map((sub) => sub.stat).filter(Boolean)),
	};
}

export function shortDomainName(name: string) {
	return name
		.replace(/^Domain of (?:Mastery|Forgery|Blessing)\s*:\s*/i, '')
		.replace(/^Donjon (?:de la maîtrise|d['’]entraînement|de la bénédiction)\s*:\s*/i, '')
		.trim();
}
