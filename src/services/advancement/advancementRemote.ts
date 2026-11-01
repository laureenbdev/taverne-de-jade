import { supabase } from '../../lib/supabase.js';

function requireClient() {
	if (!supabase) throw new Error('Supabase is not configured');
	return supabase;
}

function normalize(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	const ids = raw.filter((id): id is string => typeof id === 'string' && id.trim() !== '');
	return [...new Set(ids)];
}

export async function listAdvancement(userId: string): Promise<string[]> {
	const client = requireClient();
	const { data, error } = await client
		.from('advancement_progress')
		.select('checked_ids')
		.eq('user_id', userId)
		.maybeSingle();
	if (error) throw new Error(error.message);
	return normalize(data?.checked_ids);
}

export async function saveAdvancement(userId: string, ids: string[]): Promise<void> {
	const client = requireClient();
	const { error } = await client.from('advancement_progress').upsert({
		user_id: userId,
		checked_ids: normalize(ids),
	}, { onConflict: 'user_id' });
	if (error) throw new Error(error.message);
}
