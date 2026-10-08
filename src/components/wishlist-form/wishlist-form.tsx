import React, { useEffect, useState } from 'react';
import './wishlist-form.scss';

import { X } from 'phosphor-react';
import { WishlistItem, WishlistItemFormData } from '../../features/wishlist/types.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';
import ItemSelect from '../item-select/item-select.tsx';

interface WishlistFormProps {
	isOpen: boolean;
	item?: WishlistItem | null;
	onClose: () => void;
	onSubmit: (data: WishlistItemFormData) => void;
}

/**
 * Composant modale pour ajouter/éditer un élément de wishlist
 */
const WishlistForm: React.FC<WishlistFormProps> = ({ isOpen, item, onClose, onSubmit }) => {
	const { characters, isLoading: isLoadingCharacters } = useCharacters();
	const { weapons, isLoading: isLoadingWeapons } = useWeapons();
	const [formData, setFormData] = useState<WishlistItemFormData>({
		type: 'character',
		name: '',
		rarity: 5,
		targetCount: 1,
		estimatedReleaseDate: undefined,
	});

	// Réinitialise le formulaire quand la modale s'ouvre ou que l'item change
	useEffect(() => {
		if (isOpen) {
			if (item) {
				// Mode édition : pré-remplir avec les données de l'item
				setFormData({
					type: item.type,
					name: item.name,
					rarity: item.rarity,
					targetCount: item.targetCount,
					estimatedReleaseDate: item.estimatedReleaseDate,
				});
			} else {
				// Mode création : formulaire vide
				setFormData({
					type: 'character',
					name: '',
					rarity: 5,
					targetCount: 1,
					estimatedReleaseDate: undefined,
				});
			}
		}
	}, [isOpen, item]);

	const availableItems = formData.type === 'character' ? characters : weapons;
	const isLoading = formData.type === 'character' ? isLoadingCharacters : isLoadingWeapons;
	const selectedItem = availableItems.find((i) => i.name === formData.name);

	// Mettre à jour la rareté quand on sélectionne un item
	useEffect(() => {
		if (selectedItem) {
			setFormData((prev) => ({ ...prev, rarity: selectedItem.rarity }));
		}
	}, [selectedItem]);

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name) {
			alert('Please select an item');
			return;
		}
		onSubmit(formData);
		onClose();
	};

	const handleChange = (field: keyof WishlistItemFormData, value: string | number | undefined) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Si on change de type, réinitialiser le nom
		if (field === 'type') {
			setFormData((prev) => ({ ...prev, name: '' }));
		}
	};

	return (
		<div className="wishlist-form-overlay" onClick={onClose}>
			<div className="wishlist-form-content inner-scroll" onClick={(e) => e.stopPropagation()}>
				<div className="wishlist-form-header">
					<h2>{item ? 'Edit item' : 'Add item'}</h2>
					<button className="wishlist-form-close" onClick={onClose} aria-label="Close">
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="wishlist-form-form">
					<div className="form-group">
						<label htmlFor="type">Type</label>
						<div className="switch-container">
							<button
								type="button"
								className={`switch-option ${formData.type === 'character' ? 'active' : ''}`}
								onClick={() => handleChange('type', 'character')}
							>
								Character
							</button>
							<button
								type="button"
								className={`switch-option ${formData.type === 'weapon' ? 'active' : ''}`}
								onClick={() => handleChange('type', 'weapon')}
							>
								Weapon
							</button>
						</div>
					</div>

					<div className="form-group">
						<label htmlFor="name">{formData.type === 'character' ? 'Character' : 'Weapon'}</label>
						<ItemSelect
							items={availableItems}
							isLoading={isLoading}
							value={formData.name}
							onChange={(name) => handleChange('name', name)}
							placeholder={`Select a ${formData.type}...`}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="targetCount">Target count (1-7)</label>
						<input
							id="targetCount"
							type="number"
							min="1"
							max="7"
							value={formData.targetCount}
							onChange={(e) => {
								const val = parseInt(e.target.value) || 1;
								const clamped = Math.min(7, Math.max(1, val));
								handleChange('targetCount', clamped);
							}}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="estimatedReleaseDate">Estimated release date (optional)</label>
						<input
							id="estimatedReleaseDate"
							type="date"
							value={formData.estimatedReleaseDate || ''}
							onChange={(e) => handleChange('estimatedReleaseDate', e.target.value || undefined)}
						/>
					</div>

					<div className="form-actions">
						<button type="button" onClick={onClose} className="btn-cancel">
							Cancel
						</button>
						<button type="submit" className="btn-submit">
							{item ? 'Save' : 'Add'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default WishlistForm;
