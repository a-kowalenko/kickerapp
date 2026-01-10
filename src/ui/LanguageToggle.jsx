import styled from "styled-components";
import Flag from "react-world-flags";

const ToggleContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const FlagButton = styled.button`
    background: none;
    border: 2px solid
        ${(props) =>
            props.$active
                ? "var(--tertiary-text-color)"
                : "var(--primary-border-color)"};
    border-radius: 4px;
    padding: 0.4rem;
    cursor: pointer;
    opacity: ${(props) => (props.$active ? 1 : 0.5)};
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        opacity: 1;
        border-color: var(--tertiary-text-color);
    }
`;

const StyledFlag = styled(Flag)`
    width: 2.4rem;
    height: 1.6rem;
    object-fit: cover;
    border-radius: 2px;
`;

function LanguageToggle({ language, onLanguageChange }) {
    return (
        <ToggleContainer>
            <FlagButton
                $active={language === "en"}
                onClick={() => onLanguageChange("en")}
                title="English"
            >
                <StyledFlag code="GB" />
            </FlagButton>
            <FlagButton
                $active={language === "de"}
                onClick={() => onLanguageChange("de")}
                title="Deutsch"
            >
                <StyledFlag code="DE" />
            </FlagButton>
        </ToggleContainer>
    );
}

export default LanguageToggle;
