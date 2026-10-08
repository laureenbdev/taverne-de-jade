import React, { useState } from 'react';
import './wishlist.scss';

import { Plus } from 'phosphor-react';
import { useWishlist } from '../../hooks/useWishlist.ts';
import { WishlistItem, WishlistItemFormData } from '../../features/wishlist/types.ts';
import WishlistCard from '../wishlist-card/wishlist-card.tsx';
import WishlistForm from '../wishlist-form/wishlist-form.tsx';

/**
 * Composant principal de la wishlist
 */
const Wishlist: React.FC = () => {
	const { items, addItem, updateItem, toggleCompleted, deleteItem } = useWishlist();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

	const handleAddClick = () => {
		setEditingItem(null);
		setIsFormOpen(true);
	};

	const handleEdit = (item: WishlistItem) => {
		setEditingItem(item);
		setIsFormOpen(true);
	};

	const handleDelete = (id: string) => {
		deleteItem(id);
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingItem(null);
	};

	const handleFormSubmit = (data: WishlistItemFormData) => {
		if (editingItem) {
			updateItem(editingItem.id, data);
		} else {
			addItem(data);
		}
	};

	// Trier les items: éléments complétés à la fin, puis par date, puis par nom
	const sortedItems = [...items].sort((a, b) => {
		// Items complétés à la fin
		if (a.isCompleted !== b.isCompleted) {
			return a.isCompleted ? 1 : -1;
		}

		// Items sans date en bas (mais après les complétés)
		if (!a.estimatedReleaseDate && !b.estimatedReleaseDate) {
			return a.name.localeCompare(b.name);
		}
		if (!a.estimatedReleaseDate) return 1;
		if (!b.estimatedReleaseDate) return -1;

		// Trier par date
		const dateA = new Date(a.estimatedReleaseDate).getTime();
		const dateB = new Date(b.estimatedReleaseDate).getTime();
		if (dateA !== dateB) {
			return dateA - dateB;
		}

		// Si même date, trier par nom
		return a.name.localeCompare(b.name);
	});

	// Séparer les items avec et sans date
	const itemsWithDate = sortedItems.filter(item => item.estimatedReleaseDate);
	const itemsWithoutDate = sortedItems.filter(item => !item.estimatedReleaseDate);

	return (
		<div className="wishlist">
			<div className="wishlist-content inner-scroll">
				{itemsWithDate.length > 0 && (
					<div className="wishlist-section">
						{itemsWithDate.map((item) => (
							<WishlistCard
								key={item.id}
								item={item}
								onEdit={handleEdit}
								onDelete={handleDelete}
								onToggleCompleted={toggleCompleted}
							/>
						))}
					</div>
				)}

				{itemsWithoutDate.length > 0 && (
					<div className="wishlist-section">
						{itemsWithoutDate.map((item) => (
							<WishlistCard
								key={item.id}
								item={item}
								onEdit={handleEdit}
								onDelete={handleDelete}
								onToggleCompleted={toggleCompleted}
							/>
						))}
					</div>
				)}

				{items.length === 0 && (
					<div className="wishlist-empty">
						<p>No items in your wishlist yet. Click "Add item" to get started!</p>
					</div>
				)}
			</div>

			<button
				className="add-item-button"
				onClick={handleAddClick}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleAddClick();
					}
				}}
			>
				<Plus size={24} />
				<span>Add item</span>
			</button>

			<WishlistForm
				isOpen={isFormOpen}
				item={editingItem}
				onClose={handleFormClose}
				onSubmit={handleFormSubmit}
			/>
		</div>
	);
};

export default Wishlist;
