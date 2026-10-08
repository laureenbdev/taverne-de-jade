import React from "react";
import "./footer.scss";

import { GithubLogo, TwitterLogo, DiscordLogo, Envelope } from "phosphor-react";

const Footer: React.FC = () => {
    return (
        <footer>
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="footer-logo" aria-hidden="true" />
                    <div>
                        <p className="footer-name">La Taverne de Jade</p>
                        <p className="footer-tag">Un outil multifonction.</p>
                    </div>
                </div>

                <div className="footer-col">
                    <h3>Contact</h3>
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
                    <h3>Crédits</h3>
                    <p className="credit">
                        <span>Développé par</span>
                        <a href="https://github.com/laureenbdev" target="_blank" rel="noreferrer">Mei</a>
                    </p>
                    <p className="credit">
                        <span>Avec l'aide de</span>
                        <a href="https://github.com/Erlow38" target="_blank" rel="noreferrer">Erlow</a>
                    </p>
                    <p className="credit">
                        <span>Logo par</span>
                        <a href="https://github.com/R4it0" target="_blank" rel="noreferrer">Raito</a>
                    </p>
                </div>
            </div>

            <div className="footer-legal">
                <p>
                    Genshin Impact™ is a registered trademark of HoYoverse Co., Ltd. This site is not affiliated with or endorsed by HoYoverse. Images and data © HoYoverse Co., Ltd.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
