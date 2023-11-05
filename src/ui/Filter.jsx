import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { HiOutlineChevronDown } from "react-icons/hi2";

const RotateIcon = styled(HiOutlineChevronDown)`
    transform: rotate(${(props) => (props.$isOpen ? "-90deg" : "0deg")});
    transition: transform 0.2s ease-in-out;
`;

const StyledFilter = styled.div`
    position: relative;
`;

const Toggle = styled.div`
    position: relative;
    width: 100%;
    --color-input-field: #fddf335f;
    --color-input-field-hover: #ffffff9a;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid black;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
    background-color: cyan;
    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-sm);
    gap: 1.4rem;
    min-width: 16rem;

    background-color: ${(props) =>
        props.$isOpen
            ? "var(--color-input-field-hover)"
            : "var(--color-input-field)"};

    box-shadow: ${(props) =>
        props.$isOpen && "2px 2px 2px 2px rgba(0, 0, 0, 0.4)"};

    &:hover:not(:disabled) {
        background-color: var(--color-input-field-hover);
        box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.4);
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

const List = styled.ul`
    position: absolute; // Die Liste wird über anderen Elementen angezeigt
    top: 5%; // Beginnt direkt unter dem Toggle-Button
    left: 100%; // Ausgerichtet am linken Rand des Containers
    width: 100%; // Nimmt die volle Breite des Containers ein
    z-index: 10;

    align-items: flex-start;
    flex-direction: column;
    border-radius: var(--border-radius-sm);
    background-color: grey;

    box-shadow: 1px 1px 1px black, -1px -1px 1px black;

    max-height: ${(props) => (props.$isOpen ? "300px" : "0")};
    max-width: ${(props) => (props.$isOpen ? "100%" : "0")};
    overflow: hidden;
    display: ${(props) => (props.$isOpen ? "flex" : "hidden")};
    transition: max-height 0.2s ease-in-out, max-width 0.2s ease-in-out;
`;

const Element = styled.div`
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

function Filter({ options, field, name, icon }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFilter = searchParams.get(field) || options[0].value;
    const [isOpen, setIsOpen] = useState(false);

    const close = () => setIsOpen(false);
    const ref = useOutsideClick(close, false);

    function handleToggle(e) {
        e.stopPropagation();
        setIsOpen((open) => {
            return !open;
        });
    }

    function handleSelect(option) {
        searchParams.set(field, option.value);
        setSearchParams(searchParams);
        close();
    }

    return (
        <StyledFilter>
            <Toggle onClick={handleToggle} $isOpen={isOpen}>
                {icon && icon}
                {name && <span>{name}</span>}
                <span>{currentFilter}</span>
                <RotateIcon $isOpen={isOpen} />
            </Toggle>
            <List ref={ref} $isOpen={isOpen}>
                {options.map((option) => (
                    <Element
                        onClick={() => handleSelect(option)}
                        key={option.value}
                    >
                        {name && (
                            <>
                                <span>{name}</span>
                                &nbsp;
                            </>
                        )}
                        <span>{option.value}</span>
                    </Element>
                ))}
            </List>
        </StyledFilter>
    );
}

export default Filter;
