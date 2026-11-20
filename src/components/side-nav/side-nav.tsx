import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CaretDown, CaretLeft, Translate } from 'phosphor-react';
import './side-nav.scss';


import { useAuth, type Language } from '../../features/auth/AuthContext.tsx';
import { isImpersonating } from '../../features/admin/impersonation.ts';
import SelectField from '../select-field/select-field.tsx';
import { navConfig, type NavItem } from '../../routes.tsx';

interface SideNavProps {
	collapsed: boolean;
	onToggle: () => void;
}

const LANGUAGES: { value: Language; label: string }[] = [
	{ value: 'fr', label: 'Français' },
	{ value: 'en', label: 'English' },
];

function pathMatches(pathname: string, path: string) {
	if (path === '/') return pathname === '/';
	return pathname === path || pathname.startsWith(`${path}/`);
}

const SideNav: React.FC<SideNavProps> = ({ collapsed, onToggle }) => {
	const { t, i18n } = useTranslation();
	const { isAdmin, setLanguage } = useAuth();
	const location = useLocation();
	const items = useMemo(
		() => navConfig.filter((item) => !item.adminOnly || (isAdmin && !isImpersonating())),
		[isAdmin],
	);
	const language: Language = (i18n.resolvedLanguage || 'en').startsWith('fr') ? 'fr' : 'en';
	const [langBusy, setLangBusy] = useState(false);
	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ '/admin': true });
	const adminDefaulted = useRef(false);

	useEffect(() => {
		const next: Record<string, boolean> = {};
		for (const item of items) {
			if (!item.children?.length) continue;
			if (pathMatches(location.pathname, item.path)) {
				next[item.path] = true;
			}
		}
		const hasAdmin = items.some((item) => item.path === '/admin' && item.children?.length);
		if (hasAdmin && !adminDefaulted.current) {
			next['/admin'] = true;
			adminDefaulted.current = true;
		}
		if (Object.keys(next).length) {
			setOpenGroups((prev) => ({ ...prev, ...next }));
		}
	}, [items, location.pathname]);

	const toggleGroup = (path: string) => {
		setOpenGroups((prev) => ({ ...prev, [path]: !prev[path] }));
	};

	const handleLanguage = async (next: Language) => {
		if (next === language || langBusy) return;
		setLangBusy(true);
		await setLanguage(next);
		setLangBusy(false);
	};

	const renderLink = (item: NavItem, options?: { nested?: boolean; end?: boolean }) => {
		const Icon = item.icon;
		const nested = Boolean(options?.nested);
		return (
			<NavLink
				to={item.path}
				end={options?.end ?? item.path === '/'}
				className={({ isActive }) => [
					'tooltip-anchor',
					nested ? 'side-nav-sublink' : '',
					isActive ? 'active' : '',
				].filter(Boolean).join(' ')}
			>
				<Icon className="icon" size={nested ? 18 : 22} />
				<span className="nav-label">{t(item.labelKey)}</span>
				{collapsed && !nested && (
					<span className="tooltip right" role="tooltip" aria-hidden="true">
						{t(item.labelKey)}
					</span>
				)}
			</NavLink>
		);
	};

	const renderGroup = (item: NavItem, className?: string) => {
		const Icon = item.icon;
		const children = item.children || [];
		const open = Boolean(openGroups[item.path]);
		const childActive = children.some((child) => pathMatches(location.pathname, child.path));
		const liClass = [className, 'side-nav-group', collapsed ? 'is-collapsed-group' : '', open ? 'is-open' : '']
			.filter(Boolean)
			.join(' ');

		if (collapsed) {
			return (
				<li key={item.path} className={liClass}>
					<div className={`side-nav-flyout-anchor tooltip-anchor${childActive ? ' has-active' : ''}`}>
						<button
							type="button"
							className={`side-nav-group-btn${childActive ? ' is-active' : ''}`}
							aria-label={t(item.labelKey)}
							aria-haspopup="true"
						>
							<Icon className="icon" size={22} />
						</button>
						<span className="tooltip right" role="tooltip" aria-hidden="true">
							{t(item.labelKey)}
						</span>
						<div className="side-nav-flyout" role="menu">
							<p className="side-nav-flyout-title">{t(item.labelKey)}</p>
							{children.map((child) => {
								const ChildIcon = child.icon;
								return (
									<NavLink
										key={child.path}
										to={child.path}
										role="menuitem"
										className={({ isActive }) => `side-nav-flyout-link${isActive ? ' active' : ''}`}
									>
										<ChildIcon className="icon" size={16} />
										<span>{t(child.labelKey)}</span>
									</NavLink>
								);
							})}
						</div>
					</div>
				</li>
			);
		}

		return (
			<li key={item.path} className={liClass}>
				<button
					type="button"
					className={`side-nav-group-btn${childActive ? ' is-active' : ''}`}
					aria-expanded={open}
					onClick={() => toggleGroup(item.path)}
				>
					<Icon className="icon" size={22} />
					<span className="nav-label">{t(item.labelKey)}</span>
					<CaretDown className="side-nav-caret" size={14} weight="bold" />
				</button>
				<div className={`side-nav-submenu${open ? ' is-open' : ''}`} inert={!open || undefined}>
					<div className="side-nav-submenu-inner">
						<ul>
							{children.map((child, index) => (
								<li
									key={child.path}
									style={{ ['--sub-i' as string]: index }}
								>
									{renderLink(child, { nested: true, end: true })}
								</li>
							))}
						</ul>
					</div>
				</div>
			</li>
		);
	};

	return (
		<div className={`side-nav-slot${collapsed ? ' is-collapsed' : ''}`}>
			<nav className={`side-nav${collapsed ? ' is-collapsed' : ''}`} aria-label={t('nav.menu')}>
				<button
					type="button"
					className="side-nav-toggle"
					onClick={onToggle}
					aria-expanded={!collapsed}
					aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
				>
					<CaretLeft size={18} />
				</button>
				<ul>
					{items.map((item, index) => {
						const sepClass = item.adminOnly && !items[index - 1]?.adminOnly ? 'side-nav-sep' : undefined;
						if (item.children?.length) {
							return renderGroup(item, sepClass);
						}
						return (
							<li key={item.path} className={sepClass}>
								{renderLink(item)}
							</li>
						);
					})}
				</ul>

				{!collapsed && (
					<div className="side-nav-lang">
						<span className="side-nav-lang-label" aria-hidden="true">
							<Translate className="icon" size={20} />
							<span className="nav-label">{t('settings.language')}</span>
						</span>
						<SelectField
							id="side-nav-language"
							className="side-nav-lang-select"
							tone="dark"
							placement="top"
							value={language}
							disabled={langBusy}
							aria-label={t('settings.language')}
							onChange={(next) => void handleLanguage(next as Language)}
							options={LANGUAGES.map((option) => ({
								value: option.value,
								label: option.label,
							}))}
							renderValue={(option) => (option?.value || language).toUpperCase()}
							renderOption={(option) => (
								<>
									<span className="side-nav-lang-code">{option.value.toUpperCase()}</span>
									<span className="side-nav-lang-name">({option.label})</span>
								</>
							)}
						/>
					</div>
				)}
			</nav>
		</div>
	);
};

export default SideNav;
