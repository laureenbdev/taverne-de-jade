import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();
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
					<h2>{wish ? t('wishes.modal.editTitle') : t('wishes.modal.addTitle')}</h2>
					<button className="wish-modal-close" onClick={onClose} aria-label={t('common.close')}>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="wish-modal-form">
					<div className="form-group">
						<label htmlFor="characterName">{t('wishes.modal.character')}</label>
						<CharacterSelect
							characters={characters}
							isLoading={isLoadingCharacters}
							value={formData.characterName}
							onChange={(characterName) => handleChange('characterName', characterName)}
							placeholder={t('wishes.modal.selectCharacter')}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="totalWishes">{t('wishes.modal.pity')}</label>
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
						<label htmlFor="date">{t('common.date')}</label>
						<input
							id="date"
							type="date"
							value={formData.date}
							onChange={(e) => handleChange('date', e.target.value)}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="banner">{t('wishes.modal.banner')}</label>
						<input
							id="banner"
							type="text"
							value={formData.banner}
							onChange={(e) => handleChange('banner', e.target.value)}
							required
							placeholder={t('wishes.modal.bannerPlaceholder')}
						/>
					</div>

					<div className="form-actions">
						<button type="button" onClick={onClose} className="btn-cancel">
							{t('common.cancel')}
						</button>
						<button type="submit" className="btn-submit">
							{wish ? t('wishes.modal.edit') : t('wishes.modal.add')}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default WishModal;
