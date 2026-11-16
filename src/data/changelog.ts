export interface ChangelogEntry {
	date: string;
	fr: string[];
	en: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
	{
		date: '2026-11-16',
		fr: [
			'Amélioration du planner et organisation par tâches',
			"Ajout d'images dans l'API pour les matériaux",
		],
		en: [
			'Improved the planner and organized it by tasks',
			'Added material images to the API',
		],
	},
	{
		date: '2026-11-01',
		fr: [
			'Création des outils de planification',
			"Création des outils de suivi de l'avancée",
			'Déplacement des liens vers un menu latéral',
		],
		en: [
			'Created the planning tools',
			'Created the progress-tracking tools',
			'Moved the links into a side menu',
		],
	},
	{
		date: '2026-10-09',
		fr: [
			'Connexion au compte et enregistrement des données en base',
		],
		en: [
			'Account sign-in and saving data in the database',
		],
	},
	{
		date: '2025-01-22',
		fr: [
			"Ajout de l'historique de vœux et de la liste de souhaits",
			'Refonte du code et des styles',
		],
		en: [
			'Added wish history and wish list',
			'Refactored the codebase and styles',
		],
	},
];

const PREVIEW_LINES = 5;

export function changelogPreview(language: string): { date: string; lines: string[] }[] {
	const key = language.startsWith('fr') ? 'fr' : 'en';
	const preview: { date: string; lines: string[] }[] = [];
	let remaining = PREVIEW_LINES;
	for (const entry of CHANGELOG) {
		if (remaining <= 0) break;
		const lines = entry[key].slice(0, remaining);
		remaining -= lines.length;
		preview.push({ date: entry.date, lines });
	}
	return preview;
}
