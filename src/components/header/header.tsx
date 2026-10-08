import React from "react";
import "./header.scss";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserCircle } from "phosphor-react";

import { navConfig } from "../../routes.tsx";
import { useAuth } from "../../features/auth/AuthContext.tsx";

function shortEmail(email: string) {
    const visible = 8;
    if (email.length <= visible) return email;
    return `${email.slice(0, visible)}...`;
}

const Header: React.FC = () => {
    const { t } = useTranslation();
    const { session, profile } = useAuth();
    const email = session?.user.email;
    const name = session ? (profile.displayName || (email ? shortEmail(email) : '')) : '';

    return (
        <header className="header">
            <div className="header_title">
                <div className="header_logo"></div>
                <h1>La Taverne de Jade</h1>
            </div>
            <nav className="header_nav">
                <ul>
                    {navConfig.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end
                                    className={({ isActive }) => (isActive ? 'active' : '')}
                                >
                                    <Icon className="icon" size={20} /> {t(item.labelKey)}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            {session && name && (
                <NavLink
                    to="/settings"
                    className="header_account"
                    title={email ? `${profile.displayName || name} · ${email}` : name}
                >
                    <UserCircle size={22} weight="duotone" />
                    <span className="header_account_text">
                        <span className="header_account_name">{name}</span>
                        <span className="header_account_uid">{profile.uid || '—'}</span>
                    </span>
                </NavLink>
            )}
        </header>
    );
};

export default Header;
