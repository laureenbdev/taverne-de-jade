export type WishlistItemType = 'character' | 'weapon';

export interface WishlistItem {
	id: string;
	type: WishlistItemType;
	name: string;
	rarity: number;
	targetCount: number;
	estimatedReleaseDate?: string;
	isCompleted: boolean;
}

export type WishlistItemFormData = Omit<WishlistItem, 'id' | 'isCompleted'>;
