import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { usePresence } from '../unfold/unfold.tsx';
import './character-select.scss';

import { CaretDown, MagnifyingGlass } from 'phosphor-react';
import { Character } from '../../services/genshin/charactersApi.ts';
import { characterIconUrl } from '../../services/genshin/images.ts';

interface CharacterSelectProps {
	characters: Character[];
	isLoading?: boolean;
	value: string;
	onChange: (characterName: string) => void;
	placeholder?: string;
	required?: boolean;
}

/**
 * Composant select avec recherche (chosen custom)
 * UI pur et stateless pour la partie affichage
 */
const CharacterSelect: React.FC<CharacterSelectProps> = ({
	characters,
	isLoading = false,
	value,
	onChange,
	placeholder,
	required = false,
}) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const dropdown = usePresence(isOpen);
	const [searchTerm, setSearchTerm] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [anchor, setAnchor] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);

	// Trouver le personnage sélectionné
	const selectedCharacter = characters.find((char) => char.name === value);

	// Filtrer les personnages selon la recherche
	const filteredCharacters = characters.filter((char) =>
		char.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

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

	useEffect(() => {
		if (!dropdown.present || !dropdown.shown || !anchor) return;
		const frame = window.requestAnimationFrame(() => {
			searchInputRef.current?.focus({ preventScroll: true });
		});
		return () => window.cancelAnimationFrame(frame);
	}, [dropdown.present, dropdown.shown, anchor]);

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
					prev < filteredCharacters.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && filteredCharacters[highlightedIndex]) {
					handleSelect(filteredCharacters[highlightedIndex]);
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

	const handleSelect = (character: Character) => {
		onChange(character.name);
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
			const list = dropdownRef.current.querySelector('.character-select-options');
			const highlightedElement = list?.children[highlightedIndex] as HTMLElement | undefined;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({ block: 'nearest' });
			}
		}
	}, [highlightedIndex]);

	return (
		<div className="character-select" ref={containerRef}>
			<div
				ref={triggerRef}
				className={`character-select-trigger ${isOpen ? 'open' : ''} ${!value ? 'placeholder' : ''}`}
				onMouseDown={(event) => event.preventDefault()}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				role="combobox"
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				tabIndex={0}
			>
				<span className="character-select-value">
					{selectedCharacter && <SelectIcon src={characterIconUrl(selectedCharacter.id)} />}
					<span>{value ? (selectedCharacter ? selectedCharacter.name : value) : (placeholder || t('characterSelect.placeholder'))}</span>
				</span>
				<CaretDown size={16} className={`caret ${isOpen ? 'open' : ''}`} />
			</div>

			{dropdown.present && anchor && createPortal(
				<div
					className={`character-select-dropdown${dropdown.shown ? ' is-open' : ''}`}
					ref={dropdownRef}
					style={{ top: anchor.top, bottom: anchor.bottom, left: anchor.left, width: anchor.width }}
				>
					<div className="character-select-panel" style={{ maxHeight: anchor.maxHeight }}>
					<div className="character-select-search">
						<MagnifyingGlass size={16} />
						<input
							ref={searchInputRef}
							type="text"
							value={searchTerm}
							onChange={handleSearchChange}
							onKeyDown={handleKeyDown}
							placeholder={t('characterSelect.search')}
							className="character-select-search-input"
						/>
					</div>

					<div className="character-select-options inner-scroll" role="listbox">
						{isLoading ? (
							<div className="character-select-option loading">{t('common.loading')}</div>
						) : filteredCharacters.length === 0 ? (
							<div className="character-select-option no-results">
								{t('characterSelect.empty')}
							</div>
						) : (
							filteredCharacters.map((character, index) => (
								<div
									key={character.id}
									className={`character-select-option ${
										index === highlightedIndex ? 'highlighted' : ''
									} ${character.name === value ? 'selected' : ''}`}
									onClick={() => handleSelect(character)}
									onMouseEnter={() => setHighlightedIndex(index)}
									role="option"
									aria-selected={character.name === value}
								>
									<SelectIcon src={characterIconUrl(character.id)} />
									<span>{character.name}</span>
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

export default CharacterSelect;
