import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './wish-modal.scss';

import { X } from 'phosphor-react';
import { WISH_BANNERS, Wish, WishBanner, WishFormData } from '../../features/wishes/types.ts';
import { useCharacters } from '../../hooks/useCharacters.ts';
import { useWeapons } from '../../hooks/useWeapons.ts';
import ItemSelect from '../item-select/item-select.tsx';
import SelectField from '../select-field/select-field.tsx';
import { characterIconUrl, weaponIconUrl } from '../../services/genshin/images.ts';
import { useModalPresence } from '../../hooks/useModalPresence.ts';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.ts';

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
		if (!isOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.defaultPrevented) onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen || !wish) return;
		if (wish.banner !== 'standard' && wish.banner !== 'chronicled') return;
		if (weapons.some((weapon) => weapon.name === wish.characterName)) setSubject('weapon');
	}, [isOpen, wish, weapons]);

	const { present, shown } = useModalPresence(isOpen);
	useLockBodyScroll(present);
	if (!present) return null;

	const mixedBanner = formData.banner === 'standard' || formData.banner === 'chronicled';
	const usesWeapons = formData.banner === 'weapon' || (mixedBanner && subject === 'weapon');
	const items = (usesWeapons ? weapons : characters)
		.filter((item) => item.rarity === 5)
		.map((item) => ({ ...item, image: usesWeapons ? weaponIconUrl(item.id) : characterIconUrl(item.id) }));

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
		<div className={`wish-modal-overlay modal-layer${shown ? ' is-open' : ''}`} onClick={onClose}>
			<div
				className="wish-modal-content inner-scroll"
				role="dialog"
				aria-modal="true"
				aria-labelledby="wish-modal-title"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="wish-modal-header">
					<h2 id="wish-modal-title">{wish ? t('wishes.modal.editTitle') : t('wishes.modal.addTitle')}</h2>
					<button type="button" className="wish-modal-close" onClick={onClose} aria-label={t('common.close')}>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="wish-modal-form">
					<div className="form-group">
						<label htmlFor="banner">{t('wishes.modal.banner')}</label>
						<SelectField
							id="banner"
							value={formData.banner}
							onChange={(next) => handleBanner(next as WishBanner)}
							options={WISH_BANNERS.map((banner) => ({
								value: banner,
								label: t(`wishes.banners.${banner}`),
							}))}
						/>
					</div>

					{mixedBanner && (
						<div className="form-group">
							<label htmlFor="subject">{t('wishes.modal.subject')}</label>
							<SelectField
								id="subject"
								value={subject}
								onChange={(next) => {
									setSubject(next as 'character' | 'weapon');
									setFormData((prev) => ({ ...prev, characterName: '' }));
								}}
								options={[
									{ value: 'character', label: t('common.character') },
									{ value: 'weapon', label: t('common.weapon') },
								]}
							/>
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
							<SelectField
								id="won"
								value={formData.won === false ? 'no' : 'yes'}
								onChange={(next) => setFormData((prev) => ({ ...prev, won: next === 'yes' }))}
								options={[
									{ value: 'yes', label: t('wishes.modal.yes') },
									{ value: 'no', label: t('wishes.modal.no') },
								]}
							/>
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
