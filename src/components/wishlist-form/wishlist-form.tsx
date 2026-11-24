import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './wishlist-form.scss';

import { X } from 'phosphor-react';
import { WishlistItem, WishlistItemFormData } from '../../features/wishlist/types.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';
import ItemSelect from '../item-select/item-select.tsx';
import { characterIconUrl, weaponIconUrl } from '../../services/genshin/images.ts';
import { useModalPresence } from '../../hooks/useModalPresence.ts';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';

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
	const { t } = useTranslation();
	const { characters, isLoading: isLoadingCharacters } = useCharacters();
	const { weapons, isLoading: isLoadingWeapons } = useWeapons();
	const [formData, setFormData] = useState<WishlistItemFormData>({
		type: 'character',
		name: '',
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
					targetCount: item.targetCount,
					estimatedReleaseDate: item.estimatedReleaseDate,
				});
			} else {
				setFormData({
					type: 'character',
					name: '',
					targetCount: 1,
					estimatedReleaseDate: undefined,
				});
			}
		}
	}, [isOpen, item]);

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.defaultPrevented) onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, onClose]);

	const availableItems = (formData.type === 'character' ? characters : weapons).map((item) => ({
		...item,
		image: formData.type === 'character' ? characterIconUrl(item.id) : weaponIconUrl(item.id),
	}));
	const isLoading = formData.type === 'character' ? isLoadingCharacters : isLoadingWeapons;
	const { present, shown } = useModalPresence(isOpen);
	useLockBodyScroll(present);
	if (!present) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name) {
			alert(t('wishlist.form.selectRequired'));
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

	return createPortal(
		<div className={`wishlist-form-overlay modal-layer${shown ? ' is-open' : ''}`} onClick={onClose}>
			<div
				className="wishlist-form-content inner-scroll"
				role="dialog"
				aria-modal="true"
				aria-labelledby="wishlist-form-title"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="wishlist-form-header">
					<h2 id="wishlist-form-title">{item ? t('wishlist.form.editTitle') : t('wishlist.form.addTitle')}</h2>
					<button type="button" className="wishlist-form-close" onClick={onClose} aria-label={t('common.close')}>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="wishlist-form-form">
					<div className="form-group">
						<label htmlFor="type">{t('wishlist.form.type')}</label>
						<div className="switch-container">
							<button
								type="button"
								className={`switch-option ${formData.type === 'character' ? 'active' : ''}`}
								aria-pressed={formData.type === 'character'}
								onClick={() => handleChange('type', 'character')}
							>
								{t('wishlist.form.character')}
							</button>
							<button
								type="button"
								className={`switch-option ${formData.type === 'weapon' ? 'active' : ''}`}
								aria-pressed={formData.type === 'weapon'}
								onClick={() => handleChange('type', 'weapon')}
							>
								{t('wishlist.form.weapon')}
							</button>
						</div>
					</div>

					<div className="form-group">
						<label htmlFor="name">{formData.type === 'character' ? t('wishlist.form.character') : t('wishlist.form.weapon')}</label>
						<ItemSelect
							items={availableItems}
							isLoading={isLoading}
							value={formData.name}
							onChange={(name) => handleChange('name', name)}
							placeholder={formData.type === 'character' ? t('wishlist.form.selectCharacter') : t('wishlist.form.selectWeapon')}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="targetCount">{t('wishlist.form.targetCount')}</label>
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
						<label htmlFor="estimatedReleaseDate">{t('wishlist.form.releaseDate')}</label>
						<input
							id="estimatedReleaseDate"
							type="date"
							value={formData.estimatedReleaseDate || ''}
							onChange={(e) => handleChange('estimatedReleaseDate', e.target.value || undefined)}
						/>
					</div>

					<div className="form-actions">
						<button type="button" onClick={onClose} className="btn-cancel">
							{t('common.cancel')}
						</button>
						<button type="submit" className="btn-submit">
							{item ? t('wishlist.form.save') : t('wishlist.form.add')}
						</button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	);
};

export default WishlistForm;
