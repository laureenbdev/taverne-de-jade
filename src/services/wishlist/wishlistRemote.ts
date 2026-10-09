import { WishlistItem } from '../../features/wishlist/types.ts';
import { supabase } from '../../lib/supabase.js';

type WishlistRow = {
	id: string;
	item_type: WishlistItem['type'];
	name: string;
	target_count: number;
	estimated_release_date: string | null;
	is_completed: boolean;
};

function toItem(row: WishlistRow): WishlistItem {
	return {
		id: row.id,
		type: row.item_type,
		name: row.name,
		targetCount: row.target_count,
		estimatedReleaseDate: row.estimated_release_date ?? undefined,
		isCompleted: row.is_completed,
	};
}

function requireClient() {
	if (!supabase) throw new Error('Supabase is not configured');
	return supabase;
}

export async function listWishlist(userId: string): Promise<WishlistItem[]> {
	const client = requireClient();
	const { data, error } = await client
		.from('wishlist_items')
		.select('id, item_type, name, target_count, estimated_release_date, is_completed')
		.eq('user_id', userId);
	if (error) throw new Error(error.message);
	return ((data ?? []) as WishlistRow[]).map(toItem);
}

export async function insertWishlistItem(userId: string, item: WishlistItem): Promise<void> {
	const client = requireClient();
	const { error } = await client.from('wishlist_items').insert({
		user_id: userId,
		id: item.id,
		item_type: item.type,
		name: item.name,
		target_count: item.targetCount,
		estimated_release_date: item.estimatedReleaseDate || null,
		is_completed: item.isCompleted,
	});
	if (error) throw new Error(error.message);
}

export async function updateWishlistItem(userId: string, item: WishlistItem): Promise<void> {
	const client = requireClient();
	const { error } = await client
		.from('wishlist_items')
		.update({
			item_type: item.type,
			name: item.name,
			target_count: item.targetCount,
			estimated_release_date: item.estimatedReleaseDate || null,
			is_completed: item.isCompleted,
		})
		.eq('user_id', userId)
		.eq('id', item.id);
	if (error) throw new Error(error.message);
}

export async function deleteWishlistItem(userId: string, id: string): Promise<void> {
	const client = requireClient();
	const { error } = await client.from('wishlist_items').delete().eq('user_id', userId).eq('id', id);
	if (error) throw new Error(error.message);
}
