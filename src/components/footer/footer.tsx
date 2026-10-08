import React from "react";
import "./footer.scss";
import { useTranslation } from "react-i18next";

import { GithubLogo, TwitterLogo, DiscordLogo, Envelope } from "phosphor-react";

const Footer: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer>
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="footer-logo" aria-hidden="true" />
                    <div>
                        <p className="footer-name">La Taverne de Jade</p>
                        <p className="footer-tag">{t("footer.tag")}</p>
                    </div>
                </div>

                <div className="footer-col">
                    <h3>{t("footer.contact")}</h3>
                    <a href="https://github.com/laureenbdev" target="_blank" rel="noreferrer">
                        <GithubLogo className="icon" size={20} /> Github
                    </a>
                    <a href="https://x.com/meinko__" target="_blank" rel="noreferrer">
                        <TwitterLogo className="icon" size={20} /> Twitter
                    </a>
                    <a href="https://discord.gg/Urwmqt9jgK" target="_blank" rel="noreferrer">
                        <DiscordLogo className="icon" size={20} /> Discord
                    </a>
                    <a href="mailto:laureenbelgrand.dev@gmail.com">
                        <Envelope className="icon" size={20} /> laureenbelgrand.dev@gmail.com
                    </a>
                </div>

                <div className="footer-col">
                    <h3>{t("footer.credits")}</h3>
                    <p className="credit">
                        <span>{t("footer.developedBy")}</span>
                        <a href="https://github.com/laureenbdev" target="_blank" rel="noreferrer">Mei</a>
                    </p>
                    <p className="credit">
                        <span>{t("footer.withHelp")}</span>
                        <a href="https://github.com/Erlow38" target="_blank" rel="noreferrer">Erlow</a>
                    </p>
                    <p className="credit">
                        <span>{t("footer.logoBy")}</span>
                        <a href="https://github.com/R4it0" target="_blank" rel="noreferrer">Raito</a>
                    </p>
                </div>
            </div>

            <div className="footer-legal">
                <p>{t("footer.legal")}</p>
            </div>
        </footer>
    );
};

export default Footer;
