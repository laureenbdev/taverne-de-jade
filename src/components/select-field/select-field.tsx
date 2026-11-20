import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CaretDown } from 'phosphor-react';

import { MODAL_DURATION_MS } from '../../hooks/useModalPresence.ts';
import './select-field.scss';

export type SelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

type SelectFieldProps = {
	id?: string;
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
	disabled?: boolean;
	required?: boolean;
	name?: string;
	className?: string;
	tone?: 'light' | 'dark';
	placement?: 'bottom' | 'top';
	'aria-label'?: string;
	renderValue?: (option: SelectOption | undefined) => React.ReactNode;
	renderOption?: (option: SelectOption, selected: boolean) => React.ReactNode;
};

type MenuCoords = { top: number; left: number; width: number; placement: 'top' | 'bottom' };

const SelectField: React.FC<SelectFieldProps> = ({
	id,
	value,
	options,
	onChange,
	disabled = false,
	required = false,
	name,
	className,
	tone = 'light',
	placement = 'bottom',
	'aria-label': ariaLabel,
	renderValue,
	renderOption,
}) => {
	const autoId = useId();
	const triggerId = id || autoId;
	const listId = `${triggerId}-listbox`;
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLUListElement>(null);
	const [open, setOpen] = useState(false);
	const [present, setPresent] = useState(false);
	const [shown, setShown] = useState(false);
	const [coords, setCoords] = useState<MenuCoords | null>(null);

	const selected = useMemo(
		() => options.find((option) => option.value === value),
		[options, value],
	);

	useEffect(() => {
		if (open) {
			setPresent(true);
			return;
		}
		setShown(false);
		const timer = window.setTimeout(() => {
			setPresent(false);
			setCoords(null);
		}, MODAL_DURATION_MS);
		return () => window.clearTimeout(timer);
	}, [open]);

	useEffect(() => {
		if (!present || !open) return;
		const frame = requestAnimationFrame(() => setShown(true));
		return () => cancelAnimationFrame(frame);
	}, [present, open]);

	useLayoutEffect(() => {
		if (!present) return;

		const update = () => {
			const trigger = triggerRef.current;
			if (!trigger) return;
			const rect = trigger.getBoundingClientRect();
			const menuHeight = menuRef.current?.offsetHeight || Math.min(options.length * 40 + 16, 280);
			const spaceBelow = window.innerHeight - rect.bottom - 8;
			const spaceAbove = rect.top - 8;
			let nextPlacement = placement;
			if (placement === 'bottom' && spaceBelow < menuHeight && spaceAbove > spaceBelow) {
				nextPlacement = 'top';
			} else if (placement === 'top' && spaceAbove < menuHeight && spaceBelow >= spaceAbove) {
				nextPlacement = 'bottom';
			}

			const top = nextPlacement === 'bottom'
				? rect.bottom + 6
				: Math.max(8, rect.top - menuHeight - 6);

			setCoords({
				top,
				left: rect.left,
				width: rect.width,
				placement: nextPlacement,
			});
		};

		update();
		const frame = requestAnimationFrame(update);
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
		};
	}, [present, placement, options.length, open, shown]);

	useEffect(() => {
		if (!present) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
			setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		window.addEventListener('mousedown', onPointer);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('mousedown', onPointer);
			window.removeEventListener('keydown', onKey);
		};
	}, [present]);

	const pick = (next: string) => {
		setOpen(false);
		if (next !== value) onChange(next);
	};

	const menu = present && coords && createPortal(
		<ul
			ref={menuRef}
			id={listId}
			className={[
				'select-field-menu',
				`select-field-menu--${tone}`,
				`select-field-menu--${coords.placement}`,
				shown ? 'is-shown' : '',
			].filter(Boolean).join(' ')}
			role="listbox"
			aria-labelledby={triggerId}
			style={{
				top: coords.top,
				left: coords.left,
				width: Math.max(coords.width, 140),
			}}
		>
			{options.map((option, index) => {
				const isActive = option.value === value;
				return (
					<li
						key={option.value}
						role="presentation"
						style={{ ['--opt-i' as string]: index }}
					>
						<button
							type="button"
							role="option"
							aria-selected={isActive}
							className={`select-field-option${isActive ? ' is-active' : ''}`}
							disabled={disabled || option.disabled}
							onClick={() => pick(option.value)}
						>
							{renderOption
								? renderOption(option, isActive)
								: option.label}
						</button>
					</li>
				);
			})}
		</ul>,
		document.body,
	);

	return (
		<div
			ref={rootRef}
			className={[
				'select-field',
				`select-field--${tone}`,
				open ? 'is-open' : '',
				className || '',
			].filter(Boolean).join(' ')}
		>
			{name && (
				<input
					type="hidden"
					name={name}
					value={value}
					required={required}
					disabled={disabled}
				/>
			)}
			<button
				ref={triggerRef}
				type="button"
				id={triggerId}
				className="select-field-trigger"
				disabled={disabled}
				aria-label={ariaLabel}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listId}
				onClick={() => {
					if (!disabled) setOpen((prev) => !prev);
				}}
			>
				<span className="select-field-value">
					{renderValue
						? renderValue(selected)
						: (selected?.label || value || '—')}
				</span>
				<CaretDown className="select-field-caret" size={14} weight="bold" />
			</button>
			{menu}
		</div>
	);
};

export default SelectField;
