import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CaretLeft } from 'phosphor-react';
import './side-nav.scss';

import { navConfig } from '../../routes.tsx';

interface SideNavProps {
	collapsed: boolean;
	onToggle: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ collapsed, onToggle }) => {
	const { t } = useTranslation();

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
				{navConfig.map((item) => {
					const Icon = item.icon;
					return (
						<li key={item.path}>
							<NavLink
								to={item.path}
								end
								className={({ isActive }) => `tooltip-anchor${isActive ? ' active' : ''}`}
							>
								<Icon className="icon" size={22} />
								<span className="nav-label">{t(item.labelKey)}</span>
								{collapsed && (
									<span className="tooltip right" role="tooltip" aria-hidden="true">
										{t(item.labelKey)}
									</span>
								)}
							</NavLink>
						</li>
					);
				})}
			</ul>
		</nav>
		</div>
	);
};

export default SideNav;
