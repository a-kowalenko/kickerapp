import styled from "styled-components";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { useState } from "react";

const DropdownContainer = styled.div`
    position: relative;
    width: 180px;
`;

const DropdownHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1.2rem;
    border: 1px solid var(--color-grey-100);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    background-color: var(--color-grey-0);
`;

const DropdownList = styled.ul`
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    border: 1px solid var(--color-grey-100);
    border-radius: var(--border-radius-md);
    background-color: var(--color-grey-0);
    z-index: 10;
    max-height: 150px;
    overflow-y: auto;
`;

const DropdownListItem = styled.li`
    padding: 0.8rem 1.2rem;
    cursor: pointer;
    &:hover {
        background-color: var(--color-grey-200);
    }
`;

function PlayerDropdown({ id, options, selectedPlayer, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const close = () => setIsOpen(false);
    const dropdownRef = useOutsideClick(close);

    function handleToggle() {
        setIsOpen(!isOpen);
    }

    function handleSelect(player) {
        onSelect(player);
        setIsOpen(false);
    }

    return (
        <DropdownContainer ref={dropdownRef}>
            <DropdownHeader onClick={handleToggle}>
                {selectedPlayer ? selectedPlayer.name : `Wähle ${id}`}
                {isOpen ? <HiChevronUp /> : <HiChevronDown />}
            </DropdownHeader>
            {isOpen && (
                <DropdownList>
                    <DropdownListItem onClick={() => handleSelect(null)}>
                        <i>No player</i>
                    </DropdownListItem>
                    {options.map((player) => (
                        <DropdownListItem
                            key={player.id}
                            onClick={() => handleSelect(player)}
                        >
                            {player.name}
                        </DropdownListItem>
                    ))}
                </DropdownList>
            )}
        </DropdownContainer>
    );
}

export default PlayerDropdown;
