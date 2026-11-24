import React, { useState, useRef, useEffect, useId, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { usePresence } from '../unfold/unfold.tsx';
import './item-select.scss';

import { CaretDown, MagnifyingGlass, X } from 'phosphor-react';

interface SelectableItem {
	id: string;
	name: string;
	nameFr?: string;
	rarity: number;
	image?: string;
}

interface ItemSelectProps {
	items: SelectableItem[];
	isLoading?: boolean;
	value: string;
	onChange: (itemName: string) => void;
	placeholder?: string;
	required?: boolean;
}

/**
 * Composant select générique avec recherche (pour personnages et armes)
 */
const ItemSelect: React.FC<ItemSelectProps> = ({
	items,
	isLoading = false,
	value,
	onChange,
	placeholder,
	required = false,
}) => {
	const { t, i18n } = useTranslation();
	const french = i18n.language.toLowerCase().startsWith('fr');
	const titleOf = (item: SelectableItem) => (french && item.nameFr ? item.nameFr : item.name);
	const listboxId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const dropdown = usePresence(isOpen);
	const [searchTerm, setSearchTerm] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [anchor, setAnchor] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);

	// Trouver l'élément sélectionné
	const selectedItem = items.find((item) => item.name === value);

	// Filtrer puis trier selon le libellé affiché (FR ou EN), pas le nom EN source
	const needle = searchTerm.toLowerCase();
	const filteredItems = items
		.filter((item) => `${item.name} ${item.nameFr ?? ''}`.toLowerCase().includes(needle))
		.sort((left, right) => titleOf(left).localeCompare(titleOf(right), i18n.language, { sensitivity: 'base' }));

	// Fermer la dropdown si on clique en dehors
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const insideTrigger = containerRef.current?.contains(target);
			const insideMenu = dropdownRef.current?.contains(target);
			if (!insideTrigger && !insideMenu) {
				setIsOpen(false);
				setSearchTerm('');
				setHighlightedIndex(-1);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	useLayoutEffect(() => {
		if (!dropdown.present) return;

		const place = () => {
			const rect = triggerRef.current?.getBoundingClientRect();
			if (!rect) return;
			const gap = 4;
			const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
			const spaceAbove = rect.top - gap - 8;
			const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
			setAnchor({
				left: rect.left,
				width: rect.width,
				maxHeight: Math.max(160, Math.min(320, openUp ? spaceAbove : spaceBelow)),
				top: openUp ? undefined : rect.bottom + gap,
				bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
			});
		};

		place();
		window.addEventListener('resize', place);
		window.addEventListener('scroll', place, true);
		return () => {
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', place, true);
		};
	}, [dropdown.present]);

	// Gérer la navigation au clavier
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault();
				setIsOpen(true);
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < filteredItems.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
					handleSelect(filteredItems[highlightedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				close();
				break;
			case 'Tab':
				close();
				break;
		}
	};

	/* la liste est rendue en bas de <body> : le focus revient sur le champ en la fermant */
	const close = () => {
		setIsOpen(false);
		setSearchTerm('');
		setHighlightedIndex(-1);
		triggerRef.current?.focus({ preventScroll: true });
	};

	const handleSelect = (item: SelectableItem) => {
		onChange(item.name);
		close();
	};

	const handleClear = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onChange('');
		setIsOpen(false);
		setSearchTerm('');
		setHighlightedIndex(-1);
	};

	const handleToggle = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			setSearchTerm('');
			setHighlightedIndex(-1);
		}
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setHighlightedIndex(-1);
	};

	useEffect(() => {
		if (!dropdown.present || !dropdown.shown || !anchor) return;
		const frame = window.requestAnimationFrame(() => {
			searchInputRef.current?.focus({ preventScroll: true });
		});
		return () => window.cancelAnimationFrame(frame);
	}, [dropdown.present, dropdown.shown, anchor]);

	useEffect(() => {
		if (highlightedIndex < 0 || !dropdownRef.current) return;
		const list = dropdownRef.current.querySelector('.item-select-options');
		const option = list?.querySelectorAll('.item-select-option')[highlightedIndex] as HTMLElement | undefined;
		if (!list || !option) return;
		const top = option.offsetTop;
		const bottom = top + option.offsetHeight;
		if (top < list.scrollTop) list.scrollTop = top;
		else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
	}, [highlightedIndex]);

	return (
		<div className="item-select" ref={containerRef}>
			<div
				ref={triggerRef}
				className={`item-select-trigger ${isOpen ? 'open' : ''} ${!value ? 'placeholder' : ''}`}
				onMouseDown={(event) => event.preventDefault()}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				role="combobox"
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-controls={listboxId}
				tabIndex={0}
			>
				<span className="item-select-value">
					{selectedItem?.image && <SelectIcon src={selectedItem.image} />}
					<span>{value ? (selectedItem ? titleOf(selectedItem) : value) : (placeholder || t('itemSelect.placeholder'))}</span>
				</span>
				{value && !required && (
					<button
						type="button"
						className="item-select-clear"
						aria-label={t('itemSelect.clear')}
						onMouseDown={(event) => event.preventDefault()}
						onClick={handleClear}
					>
						<X size={14} weight="bold" />
					</button>
				)}
				<CaretDown size={16} className={`caret ${isOpen ? 'open' : ''}`} />
			</div>

			{dropdown.present && anchor && createPortal(
				<div
					className={`item-select-dropdown${dropdown.shown ? ' is-open' : ''}`}
					ref={dropdownRef}
					style={{ top: anchor.top, bottom: anchor.bottom, left: anchor.left, width: anchor.width }}
				>
					<div className="item-select-panel" style={{ maxHeight: anchor.maxHeight }}>
					<div className="item-select-search">
						<MagnifyingGlass size={16} />
						<input
							ref={searchInputRef}
							type="text"
							value={searchTerm}
							onChange={handleSearchChange}
							onKeyDown={handleKeyDown}
							placeholder={t('itemSelect.search')}
							className="item-select-search-input"
						/>
					</div>

					<div className="item-select-options inner-scroll" id={listboxId} role="listbox">
						{isLoading ? (
							<div className="item-select-option loading">{t('common.loading')}</div>
						) : filteredItems.length === 0 ? (
							<div className="item-select-option no-results">
								{t('itemSelect.empty')}
							</div>
						) : (
							filteredItems.map((item, index) => (
								<div
									key={item.id}
									className={`item-select-option ${
										index === highlightedIndex ? 'highlighted' : ''
									} ${item.name === value ? 'selected' : ''}`}
									onClick={() => handleSelect(item)}
									onMouseEnter={() => setHighlightedIndex(index)}
									role="option"
									aria-selected={item.name === value}
								>
									{item.image && <SelectIcon src={item.image} />}
									<span className="item-name">{titleOf(item)}</span>
									<span className="item-rarity">⭐{item.rarity}</span>
								</div>
							))
						)}
					</div>
					</div>
				</div>,
				document.body,
			)}
		</div>
	);
};

const SelectIcon: React.FC<{ src: string }> = ({ src }) => (
	<img src={src} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
);

export default ItemSelect;
