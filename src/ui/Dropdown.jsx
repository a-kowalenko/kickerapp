import { useState } from "react";
import { HiOutlineChevronDown } from "react-icons/hi2";
import styled, { css } from "styled-components";
import { useOutsideClick } from "../hooks/useOutsideClick";
import SpinnerMini from "./SpinnerMini";
import { useEffect } from "react";

const variations = {
    default: css`
        --color-input-field: var(--primary-dropdown-background-color);
        --color-input-field-hover: var(
            --primary-dropdown-background-color-hover
        );

        color: var(--primary-dropdown-text-color);

        background-color: ${(props) =>
            props.$isOpen
                ? "var(--primary-dropdown-background-color-hover)"
                : "var(--primary-dropdown-background-color)"};

        box-shadow: ${(props) =>
            props.$isOpen && "0 1px 5px rgba(0, 0, 0, 0.727)"};

        & svg {
            width: 2rem;
            height: 2rem;
        }

        &:hover:not(:disabled) {
            background-color: var(--primary-dropdown-background-color-hover);
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.727);
        }
    `,
    disabled: css`
        background-color: var(--disabled-color);
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
    gap: 2.4rem;
    /* min-width: 25rem; */
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-sm);

    border: 1px solid var(--primary-dropdown-border-color);

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
    z-index: 10;

    align-items: flex-start;
    flex-direction: column;
    border-radius: 0 0 5px 5px;

    box-shadow: 1px 1px 1px var(--primary-dropdown-border-color),
        -1px -1px 1px var(--primary-dropdown-border-color);

    max-height: ${(props) => (props.$isOpen ? "300px" : "0")};

    display: ${(props) => (props.$isOpen ? "flex" : "hidden")};
    transition: max-height 0.2s ease-in-out;

    overflow: auto;

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
`;

const StyledElement = styled.div`
    display: flex;
    width: 100%;
    padding: 0.6rem 1.2rem;
    background-color: var(--dropdown-list-background-color);
    cursor: pointer;

    &:hover {
        background-color: var(--dropdown-list-selected-background-color);
    }

    ${(props) =>
        props.$isSelected
            ? "background-color: var(--dropdown-list-selected-background-color);"
            : ""}
`;

function Element({ text, onSelect, isSelected }) {
    return (
        <StyledElement onClick={onSelect} $isSelected={isSelected}>
            <div>{text}</div>
        </StyledElement>
    );
}

function Dropdown({
    options,
    onSelect,
    disabled = false,
    initSelected = null,
    isLoading = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(initSelected);
    const close = () => setIsOpen(false);
    const ref = useOutsideClick(close, false);

    useEffect(() => {
        setSelected(initSelected);
    }, [initSelected]);

    function handleToggle(e) {
        e.stopPropagation();
        if (disabled) {
            return;
        }
        setIsOpen((open) => !open);
    }

    function handleSelect(option) {
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
                    {isLoading ? (
                        <SpinnerMini />
                    ) : (
                        options.map((option) => (
                            <Element
                                text={option.text}
                                onSelect={() => handleSelect(option)}
                                key={option.value}
                                isSelected={option.value === selected?.value}
                            />
                        ))
                    )}
                </List>
            )}
        </StyledDropdown>
    );
}

Toggle.defaultProps = {
    $variation: "default",
};

export default Dropdown;
