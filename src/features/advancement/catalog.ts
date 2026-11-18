import type {
	AchievementsPayload,
	QuestsPayload,
	ViewpointsPayload,
} from '../../services/genshin/advancementApi.ts';

export interface AdvancementItem {
	id: string;
	en: string;
	fr: string;
	image?: string;
}

export interface AdvancementGroup {
	id: string;
	en: string;
	fr: string;
	items: AdvancementItem[];
	image?: string;
}

export interface AdvancementCategory {
	id: string;
	en: string;
	fr: string;
	groups: AdvancementGroup[];
	image?: string;
}

const act = (id: string, en: string, fr: string, image?: string): AdvancementItem => (
	image ? { id, en, fr, image } : { id, en, fr }
);

const chapterLabel = (en?: string, fr?: string, fallbackEn?: string, fallbackFr?: string) => {
	const clean = (value?: string) => value?.trim() || '';
	const chapterEn = clean(en);
	const chapterFr = clean(fr);
	const nameEn = clean(fallbackEn);
	const nameFr = clean(fallbackFr);
	if (chapterEn && nameEn && chapterEn !== nameEn) return { en: `${chapterEn} — ${nameEn}`, fr: `${chapterFr || chapterEn} — ${nameFr || nameEn}` };
	if (chapterEn) return { en: chapterEn, fr: chapterFr || chapterEn };
	return { en: nameEn, fr: nameFr || nameEn };
};

/** Zones et réputation : pas encore dans l'API. */
export const STATIC_ADVANCEMENT_CATEGORIES: AdvancementCategory[] = [
	{
		id: 'exploration',
		en: 'Exploration',
		fr: 'Exploration',
		groups: [
			{
				id: 'area-mondstadt',
				en: 'Mondstadt',
				fr: 'Mondstadt',
				items: [
					act('area-starfell', 'Starfell Valley', 'Vallée de l\'Étoile filante'),
					act('area-galesong', 'Galesong Hill', 'Colline de Chant-du-vent'),
					act('area-windwail', 'Windwail Highland', 'Hauts de Pleurvent'),
					act('area-brightcrown', 'Brightcrown Mountains', 'Monts de Brillecouronne'),
					act('area-dragonspine', 'Dragonspine', 'Dosdragon'),
				],
			},
			{
				id: 'area-liyue',
				en: 'Liyue',
				fr: 'Liyue',
				items: [
					act('area-bishui', 'Bishui Plain', 'Plaine Bishui'),
					act('area-qiongji', 'Qiongji Estuary', 'Estuaire Qiongji'),
					act('area-clouds', 'Sea of Clouds', 'Mer de nuages'),
					act('area-minlin', 'Minlin', 'Minlin'),
					act('area-lisha', 'Lisha', 'Lisha'),
					act('area-chasm', 'The Chasm', 'Le Gouffre'),
					act('area-chenyu', 'Chenyu Vale', 'Vallon Chenyu'),
				],
			},
			{
				id: 'area-inazuma',
				en: 'Inazuma',
				fr: 'Inazuma',
				items: [
					act('area-narukami', 'Narukami Island', 'Île de Narukami'),
					act('area-kannazuka', 'Kannazuka', 'Kannazuka'),
					act('area-yashiori', 'Yashiori Island', 'Île de Yashiori'),
					act('area-watatsumi', 'Watatsumi Island', 'Île de Watatsumi'),
					act('area-seirai', 'Seirai Island', 'Île de Seirai'),
					act('area-tsurumi', 'Tsurumi Island', 'Île de Tsurumi'),
					act('area-enka', 'Enkanomiya', 'Enkanomiya'),
				],
			},
			{
				id: 'area-sumeru',
				en: 'Sumeru',
				fr: 'Sumeru',
				items: [
					act('area-avidya', 'Avidya Forest', 'Forêt d\'Avidya'),
					act('area-lokapala', 'Lokapala Jungle', 'Jungle de Lokapala'),
					act('area-ardravi', 'Ardravi Valley', 'Vallée d\'Ardravi'),
					act('area-ashavan', 'Ashavan Realm', 'Royaume d\'Ashavan'),
					act('area-vissudha', 'Vissudha Field', 'Champ de Vissudha'),
					act('area-nursery', 'Lost Nursery', 'Pépinière perdue'),
					act('area-hypostyle', 'Hypostyle Desert', 'Désert hypostyle'),
					act('area-setekh-lower', 'Land of Lower Setekh', 'Bas-Setekh'),
					act('area-setekh-upper', 'Land of Upper Setekh', 'Haut-Setekh'),
					act('area-hadramaveth', 'Desert of Hadramaveth', 'Désert de Hadramaveth'),
					act('area-gavireh', 'Gavireh Lajavard', 'Gavireh Lajavard'),
					act('area-farakhkert', 'Realm of Farakhkert', 'Royaume de Farakhkert'),
				],
			},
			{
				id: 'area-fontaine',
				en: 'Fontaine',
				fr: 'Fontaine',
				items: [
					act('area-court', 'Court of Fontaine Region', 'Région de la Cour de Fontaine'),
					act('area-belleau', 'Belleau Region', 'Région Belleau'),
					act('area-beryl', 'Beryl Region', 'Région Béryl'),
					act('area-erinnyes', 'Erinnyes Forest', 'Forêt d\'Erinnyes'),
					act('area-morte', 'Morte Region', 'Région Mortée'),
					act('area-nostoi', 'Nostoi Region', 'Région Nostoi'),
					act('area-bygone', 'Sea of Bygone Eras', 'Mer des ères révolues'),
				],
			},
			{
				id: 'area-natlan',
				en: 'Natlan',
				fr: 'Natlan',
				items: [
					act('area-basin', 'Basin of Unnumbered Flames', 'Bassin des flammes innombrables'),
					act('area-tequemecan', 'Tequemecan Valley', 'Vallée Tequemecan'),
					act('area-coatepec', 'Coatepec Mountain', 'Mont Coatepec'),
					act('area-toyac', 'Toyac Springs', 'Sources Toyac'),
					act('area-ochkanatlan', 'Ochkanatlan', 'Ochkanatlan'),
					act('area-quahuacan', 'Quahuacan Cliff', 'Falaise Quahuacan'),
					act('area-tezcatepetonco', 'Tezcatepetonco Range', 'Chaîne Tezcatepetonco'),
				],
			},
			{
				id: 'area-nodkrai',
				en: 'Nod-Krai',
				fr: 'Nod-Krai',
				items: [
					act('area-nasha', 'Nasha Town', 'Nasha'),
					act('area-hiisi', 'Hiisi Island', 'Île de Hiisi'),
					act('area-nothing', 'Nothing Passage', 'Passage du Néant'),
					act('area-kuuvahki', 'Kuuvahki Experimental Design Bureau', 'Bureau d\'études expérimentales du Kuuvahki'),
					act('area-cemetery', 'Final Night Cemetery', 'Cimetière de la dernière nuit'),
					act('area-voidsea', 'Voidsea Outlook', 'Belvédère de la mer du vide'),
					act('area-cliffwatch', 'Cliffwatch Camp', 'Camp de Garde-falaise'),
					act('area-blue-amber', 'Blue Amber Lake', 'Lac d\'ambre bleu'),
				],
			},
			{
				id: 'area-snezhnaya',
				en: 'Snezhnaya',
				fr: 'Snezhnaya',
				items: [
					act('area-volkodlak', 'Volkodlak Tundra', 'Toundra de Volkodlak'),
				],
			},
			{
				id: 'collect',
				en: 'Oculi, statues and offerings',
				fr: 'Oculi, statues et offrandes',
				items: [
					act('oculi-anemo', 'All Anemoculi', 'Tous les Anémoculus'),
					act('oculi-geo', 'All Geoculi', 'Tous les Géoculus'),
					act('oculi-electro', 'All Electroculi', 'Tous les Électroculus'),
					act('oculi-dendro', 'All Dendroculi', 'Tous les Dendroculus'),
					act('oculi-hydro', 'All Hydroculi', 'Tous les Hydroculus'),
					act('oculi-pyro', 'All Pyroculi', 'Tous les Pyroculus'),
					act('statue-mondstadt', 'Mondstadt Statue of the Seven at level 10', 'Statue des Sept de Mondstadt au niveau 10'),
					act('statue-liyue', 'Liyue Statue of the Seven at level 10', 'Statue des Sept de Liyue au niveau 10'),
					act('statue-inazuma', 'Inazuma Statue of the Seven at level 10', 'Statue des Sept d\'Inazuma au niveau 10'),
					act('statue-sumeru', 'Sumeru Statue of the Seven at level 10', 'Statue des Sept de Sumeru au niveau 10'),
					act('statue-fontaine', 'Fontaine Statue of the Seven at level 10', 'Statue des Sept de Fontaine au niveau 10'),
					act('statue-natlan', 'Natlan Statue of the Seven at level 10', 'Statue des Sept de Natlan au niveau 10'),
					act('offer-frostbearing', 'Frostbearing Tree fully offered', 'Arbre permagivre entièrement nourri'),
					act('offer-sakura', 'Sacred Sakura fully offered', 'Cerisier sacré entièrement nourri'),
					act('offer-dreams', 'Tree of Dreams fully offered', 'Arbre des rêves entièrement nourri'),
					act('offer-lucine', 'Fountain of Lucine fully offered', 'Fontaine de Lucine entièrement nourrie'),
					act('offer-tona', 'Tablet of Tona fully offered', 'Tablette de Tona entièrement nourrie'),
					act('teapot-trust', 'Serenitea Pot trust rank 10', 'Confiance de la théière au rang 10'),
				],
			},
		],
	},
	{
		id: 'reputation',
		en: 'Reputation',
		fr: 'Réputation',
		groups: [
			{
				id: 'rep-cities',
				en: 'Cities',
				fr: 'Cités',
				items: [
					act('rep-mondstadt', 'Mondstadt — max reputation', 'Mondstadt — réputation au maximum'),
					act('rep-liyue', 'Liyue — max reputation', 'Liyue — réputation au maximum'),
					act('rep-inazuma', 'Inazuma — max reputation', 'Inazuma — réputation au maximum'),
					act('rep-sumeru', 'Sumeru — max reputation', 'Sumeru — réputation au maximum'),
					act('rep-fontaine', 'Fontaine — max reputation', 'Fontaine — réputation au maximum'),
				],
			},
			{
				id: 'rep-tribes',
				en: 'Natlan tribes',
				fr: 'Tribus de Natlan',
				items: [
					act('rep-canopy', 'Scions of the Canopy', 'Rejetons de la canopée'),
					act('rep-springs', 'People of the Springs', 'Peuple des sources'),
					act('rep-echoes', 'Children of Echoes', 'Enfants des échos'),
					act('rep-flower', 'Flower-Feather Clan', 'Clan des fleurs-plumes'),
					act('rep-night', 'Masters of the Night-Wind', 'Maîtres du vent nocturne'),
					act('rep-plenty', 'Collective of Plenty', 'Collectif de l\'abondance'),
				],
			},
			{
				id: 'rep-meeting',
				en: 'Nod-Krai Meeting Points',
				fr: 'Points de rencontre du Nod-Krai',
				items: [
					act('mp-krumkake', 'Clink-Clank Krumkake Craftshop', 'Atelier cliquetant de Krumkake'),
					act('mp-frostmoon', 'Frostmoon Enclave', 'Enclave de Givrelune'),
					act('mp-cemetery', 'Final Night Cemetery', 'Cimetière de la dernière nuit'),
					act('mp-witch', 'The Witch\'s Garden', 'Le jardin de la sorcière'),
					act('mp-favonius', 'Favonius Keep', 'Donjon de Favonius'),
					act('mp-cliffwatch', 'Cliffwatch Camp', 'Camp de Garde-falaise'),
					act('mp-nuur', 'Nuur Stone Circle', 'Cercle de pierre de Nuur'),
					act('mp-lab', 'Curtain-Form Blackbody Containment Lab', 'Labo de confinement du corps noir'),
				],
			},
		],
	},
];

function questsCategory(payload: QuestsPayload): AdvancementCategory {
	return {
		id: 'quests',
		en: 'Quests',
		fr: 'Quêtes',
		image: payload.rewardImage || payload.groups[0]?.chapters[0]?.image,
		groups: payload.groups.map((group) => ({
			id: `quest-group-${group.id}`,
			en: group.name,
			fr: group.nameFr,
			image: group.chapters.find((chapter) => chapter.image)?.image,
			items: group.chapters.map((chapter) => {
				const label = chapterLabel(chapter.chapter, chapter.chapterFr, chapter.name, chapter.nameFr);
				return act(`quest:${chapter.id}`, label.en, label.fr, chapter.image);
			}),
		})),
	};
}

function achievementsCategory(payload: AchievementsPayload): AdvancementCategory {
	return {
		id: 'achievements',
		en: 'Achievements',
		fr: 'Succès',
		image: payload.rewardImage || payload.groups[0]?.image,
		groups: payload.groups.map((group) => ({
			id: `achievement-group-${group.id}`,
			en: group.name,
			fr: group.nameFr,
			image: group.image,
			items: group.achievements.map((entry) => (
				act(`achievement:${entry.id}`, entry.name, entry.nameFr)
			)),
		})),
	};
}

function viewpointsCategory(payload: ViewpointsPayload): AdvancementCategory {
	return {
		id: 'viewpoints',
		en: 'Viewpoints',
		fr: 'Panoramas',
		image: payload.groups[0]?.image,
		groups: payload.groups.map((nation) => ({
			id: `viewpoint-group-${nation.id}`,
			en: nation.name,
			fr: nation.nameFr,
			image: nation.image,
			items: nation.areas.flatMap((area) => area.viewpoints.map((viewpoint) => (
				act(`viewpoint:${viewpoint.id}`, viewpoint.name, viewpoint.nameFr, viewpoint.image)
			))),
		})),
	};
}

export function buildAdvancementCatalog(data: {
	quests: QuestsPayload;
	achievements: AchievementsPayload;
	viewpoints: ViewpointsPayload;
}): AdvancementCategory[] {
	const exploration = STATIC_ADVANCEMENT_CATEGORIES.find((entry) => entry.id === 'exploration');
	const reputation = STATIC_ADVANCEMENT_CATEGORIES.find((entry) => entry.id === 'reputation');
	return [
		questsCategory(data.quests),
		...(exploration ? [exploration] : []),
		...(reputation ? [reputation] : []),
		viewpointsCategory(data.viewpoints),
		achievementsCategory(data.achievements),
	];
}

export function categoryItems(category: AdvancementCategory): AdvancementItem[] {
	return category.groups.flatMap((group) => group.items);
}

export function flattenItems(categories: AdvancementCategory[]): AdvancementItem[] {
	return categories.flatMap(categoryItems);
}

export function countChecked(items: AdvancementItem[], checked: ReadonlySet<string>) {
	const total = items.length;
	const done = items.reduce((sum, item) => sum + (checked.has(item.id) ? 1 : 0), 0);
	const percent = total === 0 ? 0 : Math.round((done / total) * 100);
	return { done, total, percent };
}

export function labelOf(entry: { en: string; fr: string }, language: string) {
	return language.startsWith('fr') ? entry.fr : entry.en;
}
