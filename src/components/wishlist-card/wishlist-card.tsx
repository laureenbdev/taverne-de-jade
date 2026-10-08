import React from 'react';
import './wishlist-card.scss';

import { Pencil, Sword, Trash, User } from 'phosphor-react';
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
	const TypeIcon = item.type === 'weapon' ? Sword : User;

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
			<div className="wishlist-card-top">
				<div className="wishlist-card-title">
					<h4>{item.name}</h4>
					<p className="wishlist-card-meta">
						<span className="wishlist-card-type">
							<TypeIcon size={14} aria-hidden="true" />
							{item.type}
						</span>
						{item.estimatedReleaseDate && (
							<span className="wishlist-card-date">{formatDate(item.estimatedReleaseDate)}</span>
						)}
					</p>
				</div>
				<div className="wishlist-card-actions">
					<button
						className="icon-button edit"
						onClick={() => onEdit(item)}
						aria-label="Edit"
						title="Edit"
					>
						<Pencil size={16} />
					</button>
					<button
						className="icon-button delete"
						onClick={handleDelete}
						aria-label="Delete"
						title="Delete"
					>
						<Trash size={16} />
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

			<dl className="wishlist-card-stats">
				<div>
					<dt>Rarity</dt>
					<dd><span className="star" aria-hidden="true">★</span> {item.rarity}</dd>
				</div>
				<div>
					<dt>Count</dt>
					<dd className="tooltip-anchor" tabIndex={0}>
						{item.targetCount}
						<span className="tooltip bottom" role="tooltip">Nombre d'exemplaires visés</span>
					</dd>
				</div>
				<div>
					<dt>Avg</dt>
					<dd className="tooltip-anchor" tabIndex={0}>
						{wishes.average}
						<span className="tooltip bottom" role="tooltip">Estimation moyenne des vœux nécessaires</span>
					</dd>
				</div>
				<div>
					<dt>Max</dt>
					<dd className="tooltip-anchor" tabIndex={0}>
						{wishes.max}
						<span className="tooltip bottom" role="tooltip">Nombre de vœux nécessaires dans le pire cas</span>
					</dd>
				</div>
			</dl>
		</div>
	);
};

export default WishlistCard;
