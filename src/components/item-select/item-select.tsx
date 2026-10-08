import React, { useState, useRef, useEffect } from 'react';
import './item-select.scss';

import { CaretDown, MagnifyingGlass } from 'phosphor-react';

interface SelectableItem {
	id: string;
	name: string;
	rarity: number;
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
	placeholder = 'Select an item...',
	required = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Trouver l'élément sélectionné
	const selectedItem = items.find((item) => item.name === value);

	// Filtrer les éléments selon la recherche
	const filteredItems = items.filter((item) =>
		item.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Fermer la dropdown si on clique en dehors
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

	// Focus sur l'input de recherche quand la dropdown s'ouvre
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isOpen]);

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
				setIsOpen(false);
				setSearchTerm('');
				setHighlightedIndex(-1);
				break;
		}
	};

	const handleSelect = (item: SelectableItem) => {
		onChange(item.name);
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

	// Scroll vers l'élément highlighté
	useEffect(() => {
		if (highlightedIndex >= 0 && dropdownRef.current) {
			const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}, [highlightedIndex]);

	return (
		<div className="item-select" ref={containerRef}>
			<div
				className={`item-select-trigger ${isOpen ? 'open' : ''} ${!value ? 'placeholder' : ''}`}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				role="combobox"
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				tabIndex={0}
			>
				<span className="item-select-value">
					{value ? (selectedItem ? selectedItem.name : value) : placeholder}
				</span>
				<CaretDown size={16} className={`caret ${isOpen ? 'open' : ''}`} />
			</div>

			{isOpen && (
				<div className="item-select-dropdown" ref={dropdownRef}>
					<div className="item-select-search">
						<MagnifyingGlass size={16} />
						<input
							ref={searchInputRef}
							type="text"
							value={searchTerm}
							onChange={handleSearchChange}
							onKeyDown={handleKeyDown}
							placeholder="Search..."
							className="item-select-search-input"
						/>
					</div>

					<div className="item-select-options inner-scroll" role="listbox">
						{isLoading ? (
							<div className="item-select-option loading">Loading...</div>
						) : filteredItems.length === 0 ? (
							<div className="item-select-option no-results">
								No item found
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
									<span className="item-name">{item.name}</span>
									<span className="item-rarity">⭐{item.rarity}</span>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default ItemSelect;
