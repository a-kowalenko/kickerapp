import { useState } from "react";
import { HiOutlineChevronDown } from "react-icons/hi2";
import styled, { css } from "styled-components";
import { useOutsideClick } from "../hooks/useOutsideClick";

const variations = {
    default: css`
        --color-input-field: #fddf335f;
        --color-input-field-hover: #ffffff9a;

        color: black;

        background-color: ${(props) =>
            props.$isOpen
                ? "var(--color-input-field-hover)"
                : "var(--color-input-field)"};

        box-shadow: ${(props) =>
            props.$isOpen && "0 1px 5px rgba(0, 0, 0, 0.727)"};

        & svg {
            width: 2rem;
            height: 2rem;
        }

        &:hover:not(:disabled) {
            background-color: var(--color-input-field-hover);
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.727);
        }
    `,
    disabled: css`
        background-color: var(--color-grey-300);
        cursor: not-allowed;
    `,
};

const RotateIcon = styled(HiOutlineChevronDown)`
    transform: rotate(${(props) => (props.$isOpen ? "180deg" : "0deg")});
    transition: transform 0.2s ease-in-out;
`;

const Toggle = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.361);
    cursor: pointer;

    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-sm);

    border: 1px solid black;

    ${(props) => variations[props.$variation]}
`;

const StyledDropdown = styled.div`
    position: relative;
`;

const List = styled.ul`
    position: absolute; // Die Liste wird über anderen Elementen angezeigt
    top: 100%; // Beginnt direkt unter dem Toggle-Button
    left: 0; // Ausgerichtet am linken Rand des Containers
    width: 100%; // Nimmt die volle Breite des Containers ein

    align-items: flex-start;
    flex-direction: column;
    border-radius: 0 0 5px 5px;
    background-color: grey;

    box-shadow: 1px 1px 1px black, -1px -1px 1px black;

    max-height: ${(props) => (props.$isOpen ? "300px" : "0")};
    overflow: hidden;
    display: ${(props) => (props.$isOpen ? "flex" : "hidden")};
    transition: max-height 0.2s ease-in-out;
`;

const StyledElement = styled.div`
    --color-input-field: var(--color-amber-100);

    display: flex;
    width: 100%;
    padding: 0.6rem 1.2rem;
    background-color: var(--color-input-field);
    cursor: pointer;

    &:hover {
        background-color: var(--color-amber-200);
    }

    ${(props) =>
        props.$isSelected ? "background-color: var(--color-amber-200);" : ""}
`;

function Element({ text, onSelect, isSelected }) {
    return (
        <StyledElement onClick={onSelect} $isSelected={isSelected}>
            <div>{text}</div>
        </StyledElement>
    );
}

function Dropdown({ options, onSelect, disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const close = () => setIsOpen(false);
    const ref = useOutsideClick(close, false);

    function handleToggle(e) {
        e.stopPropagation();
        if (disabled) {
            return;
        }
        setIsOpen((open) => !open);
    }

    function handleSelect(option) {
        console.log("handleSelect called", option);
        setSelected(option);
        onSelect?.(option.value);
        close();
    }

    return (
        <StyledDropdown>
            <Toggle
                $isOpen={isOpen}
                onClick={handleToggle}
                $variation={disabled ? "disabled" : "default"}
            >
                {selected?.text || "Select an option"}
                <RotateIcon $isOpen={isOpen} />
            </Toggle>
            {!disabled && (
                <List $isOpen={isOpen} ref={ref}>
                    {options.map((option) => (
                        <Element
                            text={option.text}
                            onSelect={() => handleSelect(option)}
                            key={option.value}
                            isSelected={option.value === selected?.value}
                        />
                    ))}
                </List>
            )}
        </StyledDropdown>
    );
}

Toggle.defaultProps = {
    $variation: "default",
};

export default Dropdown;
