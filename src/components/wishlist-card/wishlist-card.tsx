import React from 'react';
import { useTranslation } from 'react-i18next';
import './wishlist-card.scss';

import { Pencil, Sword, Trash, User } from 'phosphor-react';
import { WishlistItem } from '../../features/wishlist/types.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';

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
	const { t, i18n } = useTranslation();
	const { characters } = useCharacters();
	const { weapons } = useWeapons();
	const catalog = item.type === 'weapon' ? weapons : characters;
	const rarity = catalog.find((entry) => entry.name === item.name)?.rarity;
	const wishes = rarity ? calculateWishes(item.targetCount, rarity) : null;
	const rarityClass = rarity === 5 ? 'rarity-5' : rarity === 4 ? 'rarity-4' : '';
	const typeClass = item.type === 'weapon' ? 'type-weapon' : 'type-character';
	const TypeIcon = item.type === 'weapon' ? Sword : User;

	const handleDelete = () => {
		if (window.confirm(t('wishlist.confirmDelete', { name: item.name }))) {
			onDelete(item.id);
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return null;
		const date = new Date(dateString);
		const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
		return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
	};

	return (
		<div className={`wishlist-card ${rarityClass} ${typeClass} ${item.isCompleted ? 'completed' : ''}`}>
			<div className="wishlist-card-top">
				<div className="wishlist-card-title">
					<h4>{item.name}</h4>
					<p className="wishlist-card-meta">
						<span className="wishlist-card-type">
							<TypeIcon size={14} aria-hidden="true" />
							{t(`common.${item.type}`)}
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
						aria-label={t('wishlist.edit')}
						title={t('wishlist.edit')}
					>
						<Pencil size={16} />
					</button>
					<button
						className="icon-button delete"
						onClick={handleDelete}
						aria-label={t('wishlist.delete')}
						title={t('wishlist.delete')}
					>
						<Trash size={16} />
					</button>
					<label className="complete-checkbox-small">
						<input
							type="checkbox"
							checked={item.isCompleted}
							onChange={() => onToggleCompleted(item.id)}
							aria-label={t('wishlist.completed')}
						/>
					</label>
				</div>
			</div>

			<dl className="wishlist-card-stats">
				<div>
					<dt>{t('wishlist.rarity')}</dt>
					<dd><span className="star" aria-hidden="true">★</span> {rarity ?? '—'}</dd>
				</div>
				<div>
					<dt>{t('wishlist.count')}</dt>
					<dd className="tooltip-anchor" tabIndex={0}>
						{item.targetCount}
						<span className="tooltip bottom" role="tooltip">{t('wishlist.countTip')}</span>
					</dd>
				</div>
				<div>
					<dt>{t('wishlist.avg')}</dt>
					<dd className="tooltip-anchor" tabIndex={0}>
						{wishes ? wishes.average : '—'}
						<span className="tooltip bottom" role="tooltip">{t('wishlist.avgTip')}</span>
					</dd>
				</div>
				<div>
					<dt>{t('wishlist.max')}</dt>
					<dd className="tooltip-anchor" tabIndex={0}>
						{wishes ? wishes.max : '—'}
						<span className="tooltip bottom" role="tooltip">{t('wishlist.maxTip')}</span>
					</dd>
				</div>
			</dl>
		</div>
	);
};

export default WishlistCard;
