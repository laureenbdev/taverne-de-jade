export function formatAdminDate(value: string, locale: string) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleString(locale.startsWith('fr') ? 'fr-FR' : 'en-GB', {
		dateStyle: 'short',
		timeStyle: 'short',
	});
}
