import React from "react";
import "./footer.scss";

import { GithubLogo } from "phosphor-react";
import { TwitterLogo } from "phosphor-react";
import { DiscordLogo } from "phosphor-react";
import { Envelope } from "phosphor-react";

const Footer: React.FC = () => {
    return (
        <>
            <footer>
                <div className="footer-container">
                    <div className="footer-content">
                        <div className="col">
                            <h3>About me</h3>
                            <a href="https://github.com/laureenbdev" target="_blank"><GithubLogo className="icon" size={24} /> Github</a> 
                            <a href="https://x.com/meinko__" target="_blank"><TwitterLogo className="icon" size={24} /> Twitter</a> 
                            <a href="https://discord.gg/Urwmqt9jgK" target="_blank"><DiscordLogo className="icon" size={24} /> Discord</a> 
                            <a href="mailto:laureenbelgrand.dev@gmail.com" target="_blank"><Envelope className="icon" size={24} /> Mail : laureenbelgrand.dev@gmail.com</a> 
                        </div>
                        <div className="col">
                            <h3>Developed by</h3>
                            <a href="https://github.com/laureenbdev" target="_blank">Mei</a>
                            <h4>With the help of</h4>
                            <a href="https://github.com/Erlow38" target="_blank">Erlow</a>
                            <h4>Logo by</h4>
                            <a href="https://github.com/R4it0" target="_blank">Raito</a>
                        </div>
                        <div className="col">
                            <p>Genshin Impact™ is a registered trademark of hoYoverse Co., Ltd. This site is not affiliated with or endorsed by hoYoverse. Images and data © hoYoverse Co., Ltd.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;