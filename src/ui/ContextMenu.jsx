import styled from "styled-components";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9998;
`;

const MenuContainer = styled.div`
    position: fixed;
    z-index: 9999;
    min-width: 18rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    padding: 0.4rem;
    animation: fadeIn 0.1s ease-out;

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;

const MenuItem = styled.button`
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.8rem 1rem;
    border: none;
    background-color: transparent;
    color: ${(props) =>
        props.$danger ? "var(--color-red-700)" : "var(--primary-text-color)"};
    font-size: 1.3rem;
    text-align: left;
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: background-color 0.15s;

    &:hover:not(:disabled) {
        background-color: var(--tertiary-background-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.6rem;
        flex-shrink: 0;
    }
`;

const MenuDivider = styled.div`
    height: 1px;
    background-color: var(--primary-border-color);
    margin: 0.4rem 0;
`;

const MenuLabel = styled.span`
    flex: 1;
`;

function ContextMenu({ items, position, onClose }) {
    const menuRef = useRef(null);

    // Safe position with fallback
    const safePosition = useMemo(() => {
        if (
            position &&
            typeof position.x === "number" &&
            typeof position.y === "number"
        ) {
            return position;
        }
        return { x: 0, y: 0 };
    }, [position]);

    const isValidPosition =
        position &&
        typeof position.x === "number" &&
        typeof position.y === "number";

    // Calculate position to keep menu within viewport
    const getAdjustedPosition = useCallback(() => {
        if (!menuRef.current) return safePosition;

        const menu = menuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const padding = 8;

        let { x, y } = safePosition;

        // Adjust horizontal position if menu goes off-screen
        if (x + menuRect.width > window.innerWidth - padding) {
            x = window.innerWidth - menuRect.width - padding;
        }
        if (x < padding) {
            x = padding;
        }

        // Adjust vertical position if menu goes off-screen
        if (y + menuRect.height > window.innerHeight - padding) {
            y = window.innerHeight - menuRect.height - padding;
        }
        if (y < padding) {
            y = padding;
        }

        return { x, y };
    }, [safePosition]);

    // Handle escape key
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Adjust position after initial render
    useEffect(() => {
        if (menuRef.current) {
            const adjusted = getAdjustedPosition();
            menuRef.current.style.left = `${adjusted.x}px`;
            menuRef.current.style.top = `${adjusted.y}px`;
        }
    }, [getAdjustedPosition]);

    // Filter out null/undefined items
    const visibleItems = items.filter(Boolean);

    // Don't render if invalid position or no items
    if (!isValidPosition || visibleItems.length === 0) return null;

    return createPortal(
        <>
            <Overlay
                onClick={onClose}
                onContextMenu={(e) => e.preventDefault()}
            />
            <MenuContainer
                ref={menuRef}
                style={{ left: position.x, top: position.y }}
                onClick={(e) => e.stopPropagation()}
            >
                {visibleItems.map((item, index) => {
                    if (item.type === "divider") {
                        return <MenuDivider key={`divider-${index}`} />;
                    }

                    return (
                        <MenuItem
                            key={item.label}
                            onClick={() => {
                                item.onClick?.();
                                if (!item.keepOpen) {
                                    onClose();
                                }
                            }}
                            disabled={item.disabled}
                            $danger={item.danger}
                        >
                            {item.icon}
                            <MenuLabel>{item.label}</MenuLabel>
                        </MenuItem>
                    );
                })}
            </MenuContainer>
        </>,
        document.body
    );
}

export default ContextMenu;
export { MenuItem, MenuDivider };
