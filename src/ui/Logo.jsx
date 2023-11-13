import styled from "styled-components";
import { useDarkMode } from "../contexts/DarkModeContext";

const StyledLogo = styled.div`
    text-align: center;
`;

const Img = styled.img`
    height: 12rem;
    width: auto;
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
