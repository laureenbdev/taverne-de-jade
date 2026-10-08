import React, { useEffect, useState } from 'react';
import './wish-modal.scss';

import { X } from 'phosphor-react';
import { Wish, WishFormData } from '../../features/wishes/types.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import CharacterSelect from '../character-select/character-select.tsx';

interface WishModalProps {
	isOpen: boolean;
	wish?: Wish | null;
	onClose: () => void;
	onSubmit: (data: WishFormData) => void;
}

/**
 * Composant modale pour ajouter/éditer un vœu
 */
const WishModal: React.FC<WishModalProps> = ({ isOpen, wish, onClose, onSubmit }) => {
	const { characters, isLoading: isLoadingCharacters } = useCharacters();
	const [formData, setFormData] = useState<WishFormData>({
		characterName: '',
		totalWishes: 0,
		date: new Date().toISOString().split('T')[0],
		banner: '',
	});

	// Réinitialise le formulaire quand la modale s'ouvre ou que le wish change
	useEffect(() => {
		if (isOpen) {
			if (wish) {
				// Mode édition : pré-remplir avec les données du vœu
				setFormData({
					characterName: wish.characterName,
					totalWishes: wish.totalWishes,
					date: wish.date,
					banner: wish.banner,
				});
			} else {
				// Mode création : formulaire vide
				setFormData({
					characterName: '',
					totalWishes: 0,
					date: new Date().toISOString().split('T')[0],
					banner: '',
				});
			}
		}
	}, [isOpen, wish]);

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
		onClose();
	};

	const handleChange = (field: keyof WishFormData, value: string | number | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<div className="wish-modal-overlay" onClick={onClose}>
			<div className="wish-modal-content inner-scroll" onClick={(e) => e.stopPropagation()}>
				<div className="wish-modal-header">
					<h2>{wish ? 'Edit wish' : 'Add wish'}</h2>
					<button className="wish-modal-close" onClick={onClose} aria-label="Fermer">
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="wish-modal-form">
					<div className="form-group">
						<label htmlFor="characterName">Character</label>
						<CharacterSelect
							characters={characters}
							isLoading={isLoadingCharacters}
							value={formData.characterName}
							onChange={(characterName) => handleChange('characterName', characterName)}
							placeholder="Select a 5☆ character..."
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="totalWishes">Pity count</label>
						<input
							id="totalWishes"
							type="number"
							min="0"
							value={formData.totalWishes}
							onChange={(e) => handleChange('totalWishes', parseInt(e.target.value) || 0)}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="date">Date</label>
						<input
							id="date"
							type="date"
							value={formData.date}
							onChange={(e) => handleChange('date', e.target.value)}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="banner">Banner / Patch</label>
						<input
							id="banner"
							type="text"
							value={formData.banner}
							onChange={(e) => handleChange('banner', e.target.value)}
							required
							placeholder="Ex: 5.0, 4.8, Perma..."
						/>
					</div>

					<div className="form-actions">
						<button type="button" onClick={onClose} className="btn-cancel">
							Cancel
						</button>
						<button type="submit" className="btn-submit">
							{wish ? 'Edit' : 'Add'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default WishModal;
