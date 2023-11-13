import styled, { keyframes } from "styled-components";
import { useDarkMode } from "../contexts/DarkModeContext";

// Schlüsselrahmen-Animation für den Spinner
const spin = keyframes`
    from {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
`;

const StyledSpinner = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    height: 96px;
    width: 96px;
    animation: ${spin} 1.5s linear infinite;
    background-color: #9b59b6;
    background-image: linear-gradient(#2f84f2, #0a72bd, #5434ef);

    & span {
        position: absolute;
        border-radius: 50%;
        height: 100%;
        width: 100%;
        background-color: #9b59b6;
        background-image: linear-gradient(#2f84f2, #0a72bd, #5434ef);
    }

    & span:nth-of-type(1) {
        filter: blur(5px);
    }

    & span:nth-of-type(2) {
        filter: blur(10px);
    }

    & span:nth-of-type(3) {
        filter: blur(25px);
    }

    & span:nth-of-type(4) {
        filter: blur(50px);
    }

    &::after {
        content: "";
        position: absolute;
        top: 13px;
        left: 13px;
        right: 13px;
        bottom: 13px;
        background-color: var(--secondary-background-color);
        border: solid 5px var(--secondary-background-color);
        border-radius: 50%;
    }
`;

const SpinnerContainer = styled.div`
    position: absolute;
    top: 40%;
    left: 50%;
    width: 64px;
    height: 64px;
`;

const SpinnerLogo = styled.div`
    content: "";
    position: inherit;
    top: 0;
    left: 0px;
    right: 0;
    bottom: 0;
    ${(props) =>
        props.$isDarkMode
            ? "background-image: url('/logo_darkmode_transparent.png')"
            : "background-image: url('/logo_transparent.png')"};
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
    z-index: 2;
`;

function Spinner() {
    const { isDarkMode } = useDarkMode();

    return (
        <SpinnerContainer>
            <StyledSpinner>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </StyledSpinner>
            <SpinnerLogo $isDarkMode={isDarkMode} />
        </SpinnerContainer>
    );
}

export default Spinner;
