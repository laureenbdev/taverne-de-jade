export type WishlistItemType = 'character' | 'weapon';

export interface WishlistItem {
	id: string;
	type: WishlistItemType;
	name: string;
	targetCount: number;
	estimatedReleaseDate?: string;
	isCompleted: boolean;
}

export type WishlistItemFormData = Omit<WishlistItem, 'id' | 'isCompleted'>;
