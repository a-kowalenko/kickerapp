import styled from "styled-components";
import { useDarkMode } from "../contexts/DarkModeContext";

const StyledLogo = styled.div`
    text-align: center;
`;

const Img = styled.img`
    transition: height 0.3s ease-out 0.1s, margin-top 0.3s ease-in-out;
    width: auto;
    height: 12rem;
    margin-top: 0;
`;

function Logo() {
    const { isDarkMode } = useDarkMode();

    return (
        <StyledLogo>
            <Img
                src={
                    isDarkMode
                        ? "/logo_darkmode_transparent.png"
                        : "/logo_transparent.png"
                }
                alt="Logo"
            />
        </StyledLogo>
    );
}

export default Logo;
