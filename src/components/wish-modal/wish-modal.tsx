import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './wish-modal.scss';

import { X } from 'phosphor-react';
import { WISH_BANNERS, Wish, WishBanner, WishFormData } from '../../features/wishes/types.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';
import ItemSelect from '../item-select/item-select.tsx';

interface WishModalProps {
	isOpen: boolean;
	wish?: Wish | null;
	defaultBanner?: WishBanner;
	onClose: () => void;
	onSubmit: (data: WishFormData) => void;
}

const WishModal: React.FC<WishModalProps> = ({ isOpen, wish, defaultBanner = 'character', onClose, onSubmit }) => {
	const { t } = useTranslation();
	const { characters, isLoading: isLoadingCharacters } = useCharacters();
	const { weapons, isLoading: isLoadingWeapons } = useWeapons();
	const [subject, setSubject] = useState<'character' | 'weapon'>('character');
	const [formData, setFormData] = useState<WishFormData>({
		characterName: '',
		totalWishes: 0,
		date: new Date().toISOString().split('T')[0],
		banner: defaultBanner,
		won: true,
	});

	useEffect(() => {
		if (!isOpen) return;
		const banner = wish?.banner ?? defaultBanner;
		setSubject(banner === 'weapon' ? 'weapon' : 'character');
		setFormData({
			characterName: wish?.characterName ?? '',
			totalWishes: wish?.totalWishes ?? 0,
			date: wish?.date ?? new Date().toISOString().split('T')[0],
			banner,
			won: banner === 'standard' ? null : wish ? wish.won !== false : true,
		});
	}, [isOpen, wish, defaultBanner]);

	useEffect(() => {
		if (!isOpen || !wish) return;
		if (wish.banner !== 'standard' && wish.banner !== 'chronicled') return;
		if (weapons.some((weapon) => weapon.name === wish.characterName)) setSubject('weapon');
	}, [isOpen, wish, weapons]);

	if (!isOpen) return null;

	const mixedBanner = formData.banner === 'standard' || formData.banner === 'chronicled';
	const usesWeapons = formData.banner === 'weapon' || (mixedBanner && subject === 'weapon');
	const items = (usesWeapons ? weapons : characters).filter((item) => item.rarity === 5);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.characterName.trim()) return;
		onSubmit({
			...formData,
			won: formData.banner === 'standard' ? null : formData.won === false ? false : true,
		});
		onClose();
	};

	const handleBanner = (banner: WishBanner) => {
		setFormData((prev) => ({
			...prev,
			banner,
			characterName: '',
			won: banner === 'standard' ? null : prev.won ?? true,
		}));
		if (banner === 'weapon') setSubject('weapon');
		if (banner === 'character') setSubject('character');
	};

	return createPortal(
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
						<label htmlFor="banner">{t('wishes.modal.banner')}</label>
						<select
							id="banner"
							value={formData.banner}
							onChange={(e) => handleBanner(e.target.value as WishBanner)}
						>
							{WISH_BANNERS.map((banner) => (
								<option key={banner} value={banner}>
									{t(`wishes.banners.${banner}`)}
								</option>
							))}
						</select>
					</div>

					{mixedBanner && (
						<div className="form-group">
							<label htmlFor="subject">{t('wishes.modal.subject')}</label>
							<select
								id="subject"
								value={subject}
								onChange={(e) => {
									setSubject(e.target.value as 'character' | 'weapon');
									setFormData((prev) => ({ ...prev, characterName: '' }));
								}}
							>
								<option value="character">{t('common.character')}</option>
								<option value="weapon">{t('common.weapon')}</option>
							</select>
						</div>
					)}

					<div className="form-group">
						<label htmlFor="characterName">
							{usesWeapons ? t('wishes.modal.weapon') : t('wishes.modal.character')}
						</label>
						<ItemSelect
							items={items}
							isLoading={usesWeapons ? isLoadingWeapons : isLoadingCharacters}
							value={formData.characterName}
							onChange={(characterName) => setFormData((prev) => ({ ...prev, characterName }))}
							placeholder={usesWeapons ? t('wishes.modal.selectWeapon') : t('wishes.modal.selectCharacter')}
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
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, totalWishes: parseInt(e.target.value) || 0 }))
							}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="date">{t('common.date')}</label>
						<input
							id="date"
							type="date"
							value={formData.date}
							onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
							required
						/>
					</div>

					{formData.banner !== 'standard' && (
						<div className="form-group">
							<label htmlFor="won">{t('wishes.modal.win')}</label>
							<select
								id="won"
								value={formData.won === false ? 'no' : 'yes'}
								onChange={(e) => setFormData((prev) => ({ ...prev, won: e.target.value === 'yes' }))}
							>
								<option value="yes">{t('wishes.modal.yes')}</option>
								<option value="no">{t('wishes.modal.no')}</option>
							</select>
						</div>
					)}

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
		</div>,
		document.body
	);
};

export default WishModal;
