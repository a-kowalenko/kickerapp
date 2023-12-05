import { useState } from "react";
import styled from "styled-components";

const StyledSwitchButton = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;

    & label {
        cursor: pointer;
    }

    & div {
        ${(props) =>
            !props.$disabled
                ? `
                    &:hover {
                        box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.4);
                    }

                    &:active {
                        box-shadow: 2px 2px 2px 3px rgba(0, 0, 0, 0.5);
                    }`
                : ""}
    }

    &,
    & div,
    & label {
        ${(props) => (props.$disabled ? "cursor: not-allowed" : "")}
    }
`;

const SwitchContainer = styled.div`
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
    width: 60px;
    height: 30px;
    border-radius: 15px;
    position: relative;
    background-color: ${(props) =>
        props.$isToggled
            ? "var(--primary-switch-color)"
            : "var(--primary-switch-color-off)"};
    cursor: pointer;
`;

const SwitchLabel = styled.label`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
`;

const SwitchIndicator = styled.span`
    position: absolute;
    top: 4px;
    left: ${(props) => (props.$isToggled ? "35px" : "4px")};
    width: 22px;
    height: 22px;
    border-radius: 11px;
    background-color: white;
    transition: left 0.2s;
`;

function SwitchButton({
    label,
    value,
    onChange,
    disabled = false,
    ownState = false,
}) {
    const [isToggled, setIsToggled] = useState(value);

    function handleToggle() {
        if (disabled) {
            return;
        }
        if (ownState) {
            onChange?.(!value);
        } else {
            setIsToggled((prev) => {
                onChange?.(!prev);
                return !prev;
            });
        }
    }

    return (
        <StyledSwitchButton $disabled={disabled}>
            <SwitchContainer
                $isToggled={ownState ? value : isToggled}
                onClick={handleToggle}
            >
                <SwitchLabel />
                <SwitchIndicator
                    $isToggled={ownState ? value : isToggled}
                ></SwitchIndicator>
            </SwitchContainer>
            <label onClick={handleToggle}>{label}</label>
        </StyledSwitchButton>
    );
}

export default SwitchButton;
