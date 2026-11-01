export interface AdvancementItem {
	id: string;
	en: string;
	fr: string;
}

export type AdvancementTodo = 'story' | 'world' | 'hangouts' | 'areas' | 'viewpoints' | 'achievements';

export interface AdvancementGroup {
	id: string;
	en: string;
	fr: string;
	items: AdvancementItem[];
	todo?: AdvancementTodo;
}

export interface AdvancementCategory {
	id: string;
	en: string;
	fr: string;
	groups: AdvancementGroup[];
}

const act = (id: string, en: string, fr: string): AdvancementItem => ({ id, en, fr });

export const ADVANCEMENT_CATEGORIES: AdvancementCategory[] = [
	{
		id: 'quests',
		en: 'Quests',
		fr: 'Quêtes',
		groups: [
			{
				id: 'aq-prologue',
				en: 'Prologue — Mondstadt',
				fr: 'Prologue — Mondstadt',
				items: [
					act('aq-prologue-1', 'Act I — The Outlander Who Caught the Wind', 'Acte I — L\'étranger qui attrapa le vent'),
					act('aq-prologue-2', 'Act II — For a Tomorrow Without Tears', 'Acte II — Pour un lendemain sans larmes'),
					act('aq-prologue-3', 'Act III — Song of the Dragon and Freedom', 'Acte III — Le chant du dragon et de la liberté'),
				],
			},
			{
				id: 'aq-liyue',
				en: 'Chapter I — Liyue',
				fr: 'Chapitre I — Liyue',
				items: [
					act('aq-li-1', 'Act I — Of the Land Amidst Monoliths', 'Acte I — Au pays des monolithes'),
					act('aq-li-2', 'Act II — Farewell, Archaic Lord', 'Acte II — Adieu à l\'Archon'),
					act('aq-li-3', 'Act III — A New Star Approaches', 'Acte III — Une nouvelle étoile approche'),
					act('aq-li-4p', 'Act IV prelude — Bough Keeper: Dainsleif', 'Prélude de l\'acte IV — Gardien des branches : Dainsleif'),
					act('aq-li-4', 'Act IV — We Will Be Reunited', 'Acte IV — Nous nous retrouverons'),
				],
			},
			{
				id: 'aq-inazuma',
				en: 'Chapter II — Inazuma',
				fr: 'Chapitre II — Inazuma',
				items: [
					act('aq-ina-0', 'Prologue — Autumn Winds, Scarlet Leaves', 'Prologue — Vents d\'automne et feuilles écarlates'),
					act('aq-ina-1', 'Act I — The Immovable God and the Eternal Euthymia', 'Acte I — Le dieu immuable et l\'éternelle euthymie'),
					act('aq-ina-2', 'Act II — Stillness, the Sublimation of Shadow', 'Acte II — Quiétude, sublimation de l\'ombre'),
					act('aq-ina-3', 'Act III — Omnipresence Over Mortals', 'Acte III — Omniprésence sur les mortels'),
					act('aq-ina-4', 'Act IV — Requiem of the Echoing Depths', 'Acte IV — Requiem des profondeurs'),
				],
			},
			{
				id: 'aq-interlude',
				en: 'Interlude chapters',
				fr: 'Chapitres interludes',
				items: [
					act('aq-int-1', 'Act I — The Crane Returns on the Wind', 'Acte I — La grue revient avec le vent'),
					act('aq-int-2', 'Act II — Perilous Trail', 'Acte II — Périlleux sentier'),
					act('aq-int-3', 'Act III — Inversion of Genesis', 'Acte III — Inversion de la genèse'),
					act('aq-int-4', 'Act IV — Paralogism', 'Acte IV — Paralogisme'),
				],
			},
			{
				id: 'aq-sumeru',
				en: 'Chapter III — Sumeru',
				fr: 'Chapitre III — Sumeru',
				items: [
					act('aq-sum-1', 'Act I — Through Mists of Smoke and Forests Dark', 'Acte I — À travers brumes et forêts obscures'),
					act('aq-sum-2', 'Act II — The Morn a Thousand Roses Brings', 'Acte II — Le matin aux mille roses'),
					act('aq-sum-3', 'Act III — Dreams, Emptiness, Deception', 'Acte III — Rêves, vacuité, tromperie'),
					act('aq-sum-4', 'Act IV — King Deshret and the Three Magi', 'Acte IV — Le roi Deshret et les trois mages'),
					act('aq-sum-5', 'Act V — Akasha Pulses, the Kalpa Flame Rises', 'Acte V — L\'Akasha pulse, la flamme de kalpa s\'élève'),
					act('aq-sum-6', 'Act VI — Caribert', 'Acte VI — Caribert'),
				],
			},
			{
				id: 'aq-fontaine',
				en: 'Chapter IV — Fontaine',
				fr: 'Chapitre IV — Fontaine',
				items: [
					act('aq-fon-1', 'Act I — Prelude of Blancheur and Noirceur', 'Acte I — Prélude de blancheur et de noirceur'),
					act('aq-fon-2', 'Act II — As Light Rain Falls Without Reason', 'Acte II — Quand la pluie légère tombe sans raison'),
					act('aq-fon-3', 'Act III — To the Stars Shining in the Depths', 'Acte III — Vers les étoiles au fond des eaux'),
					act('aq-fon-4', 'Act IV — Cataclysm\'s Quickening', 'Acte IV — L\'accélération du cataclysme'),
					act('aq-fon-5', 'Act V — Masquerade of the Guilty', 'Acte V — Mascarade du coupable'),
					act('aq-fon-6', 'Act VI — Bedtime Story', 'Acte VI — Histoire du soir'),
				],
			},
			{
				id: 'aq-natlan',
				en: 'Chapter V — Natlan',
				fr: 'Chapitre V — Natlan',
				items: [
					act('aq-nat-1', 'Act I — Flowers Resplendent on the Sun-Scorched Sojourn', 'Acte I — Fleurs sur le séjour brûlé par le soleil'),
					act('aq-nat-2', 'Act II — Black Stone Under a White Stone', 'Acte II — Pierre noire sous une pierre blanche'),
					act('aq-nat-3', 'Act III — Beyond the Smoke and Mirrors', 'Acte III — Au-delà des fumées et des miroirs'),
					act('aq-nat-4', 'Act IV — The Rainbow Destined to Burn', 'Acte IV — L\'arc-en-ciel destiné à brûler'),
					act('aq-nat-i', 'Interlude — All Fires Fuel the Flame', 'Interlude — Tous les feux nourrissent la flamme'),
					act('aq-nat-5', 'Act V — Incandescent Ode of Resurrection', 'Acte V — Ode incandescente de la résurrection'),
					act('aq-nat-6', 'Act VI — A Space and Time for You', 'Acte VI — Un espace et un temps pour toi'),
				],
			},
			{
				id: 'aq-nodkrai',
				en: 'Song of the Welkin Moon — Nod-Krai',
				fr: 'Chant de la lune du ciel — Nod-Krai',
				items: [
					act('aq-nk-0', 'Prelude — The Journey Home', 'Prélude — Le retour au foyer'),
					act('aq-nk-1', 'Act I — A Dance of Snowy Tides and Hoarfrost Groves', 'Acte I — Danse des marées neigeuses et des bois givrés'),
					act('aq-nk-2', 'Act II — Elegy of Dust and Lamplight', 'Acte II — Élégie de poussière et de lampe'),
					act('aq-nk-3', 'Act III — A Nation That Doesn\'t Exist', 'Acte III — Une nation qui n\'existe pas'),
					act('aq-nk-4', 'Act IV — An Elegy for Faded Moonlight', 'Acte IV — Élégie pour un clair de lune fané'),
					act('aq-nk-5', 'Act V — A Nocturne of the Far North', 'Acte V — Nocturne du Grand Nord'),
					act('aq-nk-6', 'Act VI — Melting Moonlight in the Morning Mist', 'Acte VI — Clair de lune fondu dans la brume'),
					act('aq-nk-7', 'Act VII — A Traveler on a Winter\'s Night', 'Acte VII — Un voyageur par une nuit d\'hiver'),
					act('aq-nk-8', 'Act VIII — True Moon', 'Acte VIII — Lune véritable'),
					act('aq-nk-9', 'Act IX — As All Falls to Emptiness', 'Acte IX — Quand tout retombe dans le vide'),
					act('aq-nk-10', 'Act X — Of Myriad Paths, Flux, and Dissolution', 'Acte X — Des voies innombrables, du flux et de la dissolution'),
				],
			},
			{
				id: 'aq-snezhnaya',
				en: 'Chapter VII — Snezhnaya',
				fr: 'Chapitre VII — Snezhnaya',
				items: [
					act('aq-sn-1', 'Act I — Everwinter Without Mercy', 'Acte I — Hiver éternel sans merci'),
					act('aq-sn-2', 'Act II — Wraith\'s Nocturne', 'Acte II — Nocturne du spectre'),
					act('aq-sn-3', 'Act III — White Night, Like a Dream Upon Waking', 'Acte III — Nuit blanche, comme un rêve au réveil'),
					act('aq-sn-4', 'Act IV — A Rekviem for the Underworld', 'Acte IV — Un rekviem pour les enfers'),
					act('aq-sn-5', 'Act V — Hour of Ruin', 'Acte V — L\'heure de la ruine'),
					act('aq-sn-6', 'Act VI — A Yesterday Sent From Beyond', 'Acte VI — Un hier venu d\'ailleurs'),
				],
			},
			{
				// TODO: remplacer cet extrait par la liste des quêtes d'histoire de l'API.
				id: 'story',
				en: 'Story quests',
				fr: 'Quêtes d\'histoire',
				todo: 'story',
				items: [
					act('sq-venti', 'Venti — Carmen Dei', 'Venti — Carmen Dei'),
					act('sq-zhongli', 'Zhongli — Historia Antiqua', 'Zhongli — Historia Antiqua'),
					act('sq-raiden', 'Raiden Shogun — Imperatrix Umbrosa', 'Shogun Raiden — Imperatrix Umbrosa'),
					act('sq-nahida', 'Nahida — Sapientia Oromasdis', 'Nahida — Sapientia Oromasdis'),
					act('sq-furina', 'Furina — Animula Choragi', 'Furina — Animula Choragi'),
					act('sq-neuvillette', 'Neuvillette — Diluvies', 'Neuvillette — Diluvies'),
				],
			},
			{
				id: 'world',
				en: 'World quest chains',
				fr: 'Chaînes de quêtes du monde',
				todo: 'world',
				items: [
					act('wq-dragonspine', 'In the Mountains', 'Dans les montagnes'),
					act('wq-chasm', 'The Chasm Delvers', 'Les explorateurs du Gouffre'),
					act('wq-enka', 'The Subterranean Trials of Drake and Serpent', 'Les épreuves souterraines du drake et du serpent'),
					act('wq-aranyaka', 'Aranyaka', 'Aranyaka'),
					act('wq-golden', 'Golden Slumber', 'Sommeil doré'),
					act('wq-narzissenkreuz', 'Narzissenkreuz adventure', 'Aventure du Narzissenkreuz'),
					act('wq-polkka', 'Polkka Beneath the Moon\'s Oracle', 'Polkka sous l\'oracle de la lune'),
				],
			},
			{
				id: 'hangouts',
				en: 'Hangouts',
				fr: 'Anecdotes',
				todo: 'hangouts',
				items: [
					act('ho-noelle', 'Noelle', 'Noëlle'),
					act('ho-bennett', 'Bennett', 'Bennett'),
					act('ho-thoma', 'Thoma', 'Thoma'),
					act('ho-layla', 'Layla', 'Layla'),
				],
			},
		],
	},
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
				todo: 'areas',
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
				todo: 'areas',
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
	{
		id: 'viewpoints',
		en: 'Viewpoints',
		fr: 'Panoramas',
		groups: [
			{
				id: 'vp-regions',
				en: 'By region',
				fr: 'Par région',
				todo: 'viewpoints',
				items: [
					act('vp-mondstadt', 'All Mondstadt viewpoints', 'Tous les panoramas de Mondstadt'),
					act('vp-liyue', 'All Liyue viewpoints', 'Tous les panoramas de Liyue'),
					act('vp-inazuma', 'All Inazuma viewpoints', 'Tous les panoramas d\'Inazuma'),
					act('vp-sumeru', 'All Sumeru viewpoints', 'Tous les panoramas de Sumeru'),
					act('vp-fontaine', 'All Fontaine viewpoints', 'Tous les panoramas de Fontaine'),
					act('vp-natlan', 'All Natlan viewpoints', 'Tous les panoramas de Natlan'),
					act('vp-snezhnaya', 'All Snezhnaya viewpoints', 'Tous les panoramas de Snezhnaya'),
				],
			},
			{
				id: 'vp-nodkrai',
				en: 'Nod-Krai — sample',
				fr: 'Nod-Krai — extrait',
				todo: 'viewpoints',
				items: [
					act('vp-border-town', 'Border Town', 'Ville frontière'),
					act('vp-craftshop', 'Clinky, Clanky Craftshop', 'Atelier cliquetant'),
					act('vp-far-north', 'Echoes of the Far North', 'Échos du Grand Nord'),
					act('vp-pilgrimage', 'Pilgrimage to the Moon', 'Pèlerinage vers la lune'),
					act('vp-fortress', 'Fortress of Steel', 'Forteresse d\'acier'),
					act('vp-beacon', 'Beacon in the Long Night', 'Phare dans la longue nuit'),
					act('vp-wonderland', 'Wonderland in the Rabbit Hole', 'Pays des merveilles dans le terrier'),
				],
			},
		],
	},
	{
		id: 'achievements',
		en: 'Achievements',
		fr: 'Succès',
		groups: [
			{
				id: 'ach-wonders',
				en: 'Wonders of the World',
				fr: 'Merveilles du monde',
				todo: 'achievements',
				items: [
					act('ach-w-gale', 'The Remains of the Gale', 'Les vestiges de la bourrasque'),
				],
			},
			{
				id: 'ach-mortal-1',
				en: 'Mortal Travails: Series I',
				fr: 'Pérégrinations mortelles : série I',
				items: [
					act('ach-mt-wind', 'The Wind and The Star Traveler', 'Le vent et le voyageur des étoiles'),
					act('ach-mt-mountains', 'Of Mountains High', 'Des hautes montagnes'),
					act('ach-mt-water', 'The Voice of Flowing Water', 'La voix de l\'eau courante'),
					act('ach-mt-halberd', 'The Divine Halberd Mocks the Heavens', 'La hallebarde divine nargue les cieux'),
					act('ach-mt-drunkard', 'The Drunkard and the Wolf', 'L\'ivrogne et le loup'),
					act('ach-mt-spring', 'Spring, White Horse and Moonlight', 'Printemps, cheval blanc et clair de lune'),
				],
			},
			{
				// TODO: remplacer ces extraits par le détail des succès via l'API.
				id: 'ach-mondstadt',
				en: 'Mondstadt: The City of Wind and Song',
				fr: 'Mondstadt : la cité du vent et de la chanson',
				todo: 'achievements',
				items: [
					act('ach-md-explorer', 'Continental Explorer: Mondstadt', 'Explorateur continental : Mondstadt'),
					act('ach-md-brush', 'Brush of a Thousand Winds', 'Pinceau des mille vents'),
					act('ach-md-statue', 'Let the Wind Lead', 'Que le vent guide'),
				],
			},
			{
				id: 'ach-liyue',
				en: 'Liyue: The Harbor of Stone and Contracts',
				fr: 'Liyue : le port de la pierre et des contrats',
				todo: 'achievements',
				items: [
					act('ach-ly-explorer', 'Continental Explorer: Liyue', 'Explorateur continental : Liyue'),
				],
			},
			{
				id: 'ach-inazuma',
				en: 'Inazuma: The Islands of Thunder and Eternity',
				fr: 'Inazuma : les îles du tonnerre et de l\'éternité',
				todo: 'achievements',
				items: [
					act('ach-ina-explorer', 'Continental Explorer: Inazuma', 'Explorateur continental : Inazuma'),
				],
			},
			{
				id: 'ach-challenger',
				en: 'Challenger: Series I',
				fr: 'Challengeur : série I',
				todo: 'achievements',
				items: [
					act('ach-ch-art', 'The Art of War', 'L\'art de la guerre'),
				],
			},
			{
				id: 'ach-olah',
				en: 'Olah!: Series I',
				fr: 'Olah ! : série I',
				todo: 'achievements',
				items: [
					act('ach-olah-1', 'Yo dala?', 'Yo dala ?'),
				],
			},
		],
	},
];

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
