import React from 'react';
import './wishlist-card.scss';

import { Pencil, Trash } from 'phosphor-react';
import { WishlistItem } from '../../features/wishlist/types.ts';

interface WishlistCardProps {
	item: WishlistItem;
	onEdit: (item: WishlistItem) => void;
	onDelete: (id: string) => void;
	onToggleCompleted: (id: string) => void;
}

/**
 * Calcule le nombre moyen et max de voeux nécessaires pour obtenir un 5★
 * Moyenne: ~62.5 voeux (soft pity à 75, hard pity à 90)
 * Max: 90 voeux (hard pity)
 */
const calculateWishes = (targetCount: number, rarity: number) => {
	if (rarity === 5) {
		const averagePerItem = 62.5;
		const maxPerItem = 90;
		return {
			average: Math.ceil(targetCount * averagePerItem),
			max: targetCount * maxPerItem,
		};
	} else {
		// Pour les 4★, moyenne ~10, max ~20
		const averagePerItem = 10;
		const maxPerItem = 20;
		return {
			average: Math.ceil(targetCount * averagePerItem),
			max: targetCount * maxPerItem,
		};
	}
};

/**
 * Composant carte pour afficher un élément de wishlist
 */
const WishlistCard: React.FC<WishlistCardProps> = ({
	item,
	onEdit,
	onDelete,
	onToggleCompleted,
}) => {
	const wishes = calculateWishes(item.targetCount, item.rarity);
	const rarityClass = item.rarity === 5 ? 'rarity-5' : 'rarity-4';
	const typeClass = item.type === 'weapon' ? 'type-weapon' : 'type-character';

	const handleDelete = () => {
		if (window.confirm(`Are you sure you want to delete "${item.name}" from your wishlist?`)) {
			onDelete(item.id);
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return null;
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	};

	return (
		<div className={`wishlist-card ${rarityClass} ${typeClass} ${item.isCompleted ? 'completed' : ''}`}>
			<div className="wishlist-card-header">
				<div className="wishlist-card-title">
					<h4>{item.name}</h4>
					<span className="wishlist-card-type">{item.type}</span>
					{item.estimatedReleaseDate && (
						<span className="wishlist-card-date">Release: {formatDate(item.estimatedReleaseDate)}</span>
					)}
				</div>
				<div className="wishlist-card-actions">
					<button
						className="icon-button"
						onClick={() => onEdit(item)}
						aria-label="Edit"
						title="Edit"
					>
						<Pencil size={18} />
					</button>
					<button
						className="icon-button"
						onClick={handleDelete}
						aria-label="Delete"
						title="Delete"
					>
						<Trash size={18} />
					</button>
					<label className="complete-checkbox-small">
						<input
							type="checkbox"
							checked={item.isCompleted}
							onChange={() => onToggleCompleted(item.id)}
							aria-label="Mark as completed"
						/>
					</label>
				</div>
			</div>

			<div className="wishlist-card-body">
				<div className="wishlist-card-info">
					<div className="info-row">
						<span className="info-label">Rarity:</span>
						<span className="info-value">⭐{item.rarity}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Target count:</span>
						<span className="info-value">{item.targetCount}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Avg wishes:</span>
						<span className="info-value">{wishes.average}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Max wishes:</span>
						<span className="info-value">{wishes.max}</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WishlistCard;
