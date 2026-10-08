import React, { useState, useRef, useEffect } from 'react';
import './character-select.scss';

import { CaretDown, MagnifyingGlass } from 'phosphor-react';
import { Character } from '../../services/genshin/charactersApi.ts';

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
	placeholder = 'Select a character...',
	required = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Trouver le personnage sélectionné
	const selectedCharacter = characters.find((char) => char.name === value);

	// Filtrer les personnages selon la recherche
	const filteredCharacters = characters.filter((char) =>
		char.name.toLowerCase().includes(searchTerm.toLowerCase())
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
			const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}, [highlightedIndex]);

	return (
		<div className="character-select" ref={containerRef}>
			<div
				className={`character-select-trigger ${isOpen ? 'open' : ''} ${!value ? 'placeholder' : ''}`}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				role="combobox"
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				tabIndex={0}
			>
				<span className="character-select-value">
					{value ? (selectedCharacter ? selectedCharacter.name : value) : placeholder}
				</span>
				<CaretDown size={16} className={`caret ${isOpen ? 'open' : ''}`} />
			</div>

			{isOpen && (
				<div className="character-select-dropdown" ref={dropdownRef}>
					<div className="character-select-search">
						<MagnifyingGlass size={16} />
						<input
							ref={searchInputRef}
							type="text"
							value={searchTerm}
							onChange={handleSearchChange}
							onKeyDown={handleKeyDown}
							placeholder="Search a character..."
							className="character-select-search-input"
						/>
					</div>

					<div className="character-select-options inner-scroll" role="listbox">
						{isLoading ? (
							<div className="character-select-option loading">Loading...</div>
						) : filteredCharacters.length === 0 ? (
							<div className="character-select-option no-results">
								No character found
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
									{character.name}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default CharacterSelect;
