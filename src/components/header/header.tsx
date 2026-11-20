import React, { useEffect, useRef, useState } from "react";
import "./header.scss";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChatCircleText, UserCircle } from "phosphor-react";

import FeedbackModal from "../feedback-modal/feedback-modal.tsx";
import { useAuth } from "../../features/auth/AuthContext.tsx";

function shortEmail(email: string) {
    const visible = 8;
    if (email.length <= visible) return email;
    return `${email.slice(0, visible)}...`;
}

const Header: React.FC = () => {
    const headerRef = useRef<HTMLElement>(null);
    const { t } = useTranslation();
    const { session, profile } = useAuth();
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const email = session?.user.email;
    const name = session ? (profile.displayName || (email ? shortEmail(email) : '')) : '';

    useEffect(() => {
        const element = headerRef.current;
        if (!element) return;
        const apply = () => {
            document.documentElement.style.setProperty('--header-height', `${element.offsetHeight}px`);
        };
        apply();
        const observer = new ResizeObserver(apply);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <header ref={headerRef} className="header">
            <NavLink to="/" end className="header_title">
                <span className="header_logo" aria-hidden="true" />
                <h1>
                    <span className="header_title_main">La Taverne</span>
                    <span className="header_title_accent">de Jade</span>
                </h1>
            </NavLink>
            {session && (
                <div className="header_actions">
                    <div className="tooltip-anchor header_feedback_anchor">
                        <button
                            type="button"
                            className="header_feedback"
                            onClick={() => setFeedbackOpen(true)}
                            aria-label={t('feedback.open')}
                        >
                            <ChatCircleText size={22} weight="duotone" />
                        </button>
                        <span className="tooltip bottom" role="tooltip">{t('feedback.open')}</span>
                    </div>
                    {name && (
                        <NavLink
                            to="/settings"
                            className="header_account"
                        >
                            <UserCircle size={22} weight="duotone" />
                            <span className="header_account_text">
                                <span className="header_account_name">{name}</span>
                                <span className="header_account_uid">{profile.uid || '—'}</span>
                            </span>
                        </NavLink>
                    )}
                </div>
            )}
            <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </header>
    );
};

export default Header;
