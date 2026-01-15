import { useState, useEffect, useCallback } from "react";
import { HiOutlineChevronDown } from "react-icons/hi2";
import styled, { css } from "styled-components";
import { useOutsideClick } from "../hooks/useOutsideClick";
import SpinnerMini from "./SpinnerMini";
import { useDropdownContext } from "../contexts/DropdownContext";

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
    ${(props) => (props.$minWidth ? `min-width: ${props.$minWidth};` : "")}
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
    ${(props) => props.$autoWidth && `display: inline-block;`}
`;

// Hidden list that renders all options to establish minimum width
const HiddenSizer = styled.div`
    visibility: hidden;
    height: 0;
    overflow: hidden;
    pointer-events: none;
`;

const SizerToggle = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;
    padding: 1.2rem 2.4rem;
    white-space: nowrap;
`;

const SizerContent = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const List = styled.ul`
    position: absolute; // Die Liste wird über anderen Elementen angezeigt
    top: 100%; // Beginnt direkt unter dem Toggle-Button
    left: 0; // Ausgerichtet am linken Rand des Containers
    width: 100%; // Nimmt die volle Breite des Containers ein
    z-index: 11;

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
    align-items: center;
    gap: 0.8rem;
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

const DropdownAvatar = styled.img`
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
`;

const AvatarPlaceholder = styled.div`
    width: 2.4rem;
    height: 2.4rem;
    flex-shrink: 0;
`;

const ToggleContent = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

function Element({
    text,
    avatar,
    showAvatarPlaceholder,
    onSelect,
    isSelected,
}) {
    return (
        <StyledElement onClick={onSelect} $isSelected={isSelected}>
            {avatar ? (
                <DropdownAvatar src={avatar} alt="" />
            ) : showAvatarPlaceholder ? (
                <AvatarPlaceholder />
            ) : null}
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
    minWidth = null,
    showAvatars = false,
    autoWidth = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(initSelected);
    const dropdownContext = useDropdownContext();

    // Check if any option has an avatar
    const hasAnyAvatar = showAvatars || options.some((opt) => opt.avatar);

    const close = useCallback(() => setIsOpen(false), []);
    const ref = useOutsideClick(close, false);

    // Register this dropdown's close function with the context (if available)
    useEffect(() => {
        if (dropdownContext) {
            const unregister = dropdownContext.registerDropdown(close);
            return unregister;
        }
    }, [dropdownContext, close]);

    useEffect(() => {
        setSelected(initSelected);
    }, [initSelected, onSelect]);

    function handleToggle(e) {
        e.stopPropagation();
        if (disabled) {
            return;
        }
        // Close all other dropdowns before opening this one
        if (!isOpen && dropdownContext) {
            dropdownContext.closeAllExcept(close);
        }
        setIsOpen((open) => !open);
    }

    function handleSelect(option) {
        setSelected(option);
        onSelect?.(option.value);
        close();
    }

    return (
        <StyledDropdown $autoWidth={autoWidth}>
            {/* Hidden sizer that renders all options to establish minimum width */}
            {autoWidth && (
                <HiddenSizer>
                    {/* Include initSelected in width calculation if it exists */}
                    {initSelected && (
                        <SizerToggle>
                            <SizerContent>
                                {hasAnyAvatar && <AvatarPlaceholder />}
                                {initSelected.text}
                            </SizerContent>
                            <RotateIcon />
                        </SizerToggle>
                    )}
                    {options.map((opt) => (
                        <SizerToggle key={opt.value}>
                            <SizerContent>
                                {hasAnyAvatar && <AvatarPlaceholder />}
                                {opt.text}
                            </SizerContent>
                            <RotateIcon />
                        </SizerToggle>
                    ))}
                </HiddenSizer>
            )}
            <Toggle
                $isOpen={isOpen}
                onClick={handleToggle}
                $variation={disabled ? "disabled" : "default"}
                $minWidth={minWidth}
            >
                <ToggleContent>
                    {selected?.avatar ? (
                        <DropdownAvatar src={selected.avatar} alt="" />
                    ) : hasAnyAvatar ? (
                        <AvatarPlaceholder />
                    ) : null}
                    {selected?.text || "Select an option"}
                </ToggleContent>
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
                                avatar={option.avatar}
                                showAvatarPlaceholder={hasAnyAvatar}
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
