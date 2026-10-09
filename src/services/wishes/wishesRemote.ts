import { normalizeWish, Wish } from '../../features/wishes/types.ts';
import { supabase } from '../../lib/supabase.js';

type WishRow = {
	id: string;
	character_name: string;
	total_wishes: number;
	wished_on: string;
	banner: string;
	won: boolean | null;
};

function toWish(row: WishRow): Wish | null {
	return normalizeWish({
		id: row.id,
		characterName: row.character_name,
		totalWishes: row.total_wishes,
		date: row.wished_on,
		banner: row.banner as Wish['banner'],
		won: row.won,
	});
}

function toRow(userId: string, wish: Wish) {
	return {
		user_id: userId,
		id: wish.id,
		character_name: wish.characterName,
		total_wishes: wish.totalWishes,
		wished_on: wish.date,
		banner: wish.banner,
		won: wish.banner === 'standard' ? null : wish.won,
	};
}

function requireClient() {
	if (!supabase) throw new Error('Supabase is not configured');
	return supabase;
}

export async function listWishes(userId: string): Promise<Wish[]> {
	const client = requireClient();
	const { data, error } = await client
		.from('wishes')
		.select('id, character_name, total_wishes, wished_on, banner, won')
		.eq('user_id', userId);
	if (error) throw new Error(error.message);
	return ((data ?? []) as WishRow[]).flatMap((row) => {
		const wish = toWish(row);
		return wish ? [wish] : [];
	});
}

export async function insertWish(userId: string, wish: Wish): Promise<void> {
	const client = requireClient();
	const { error } = await client.from('wishes').insert(toRow(userId, wish));
	if (error) throw new Error(error.message);
}

export async function updateWishRow(userId: string, wish: Wish): Promise<void> {
	const client = requireClient();
	const { error } = await client
		.from('wishes')
		.update({
			character_name: wish.characterName,
			total_wishes: wish.totalWishes,
			wished_on: wish.date,
			banner: wish.banner,
			won: wish.banner === 'standard' ? null : wish.won,
		})
		.eq('user_id', userId)
		.eq('id', wish.id);
	if (error) throw new Error(error.message);
}

export async function deleteWishRow(userId: string, id: string): Promise<void> {
	const client = requireClient();
	const { error } = await client.from('wishes').delete().eq('user_id', userId).eq('id', id);
	if (error) throw new Error(error.message);
}
