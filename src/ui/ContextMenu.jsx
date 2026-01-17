import styled from "styled-components";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const MenuContainer = styled.div`
    position: fixed;
    z-index: 9999;
    min-width: 18rem;
    max-width: calc(100vw - 2rem);
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    padding: 0.4rem;
    animation: fadeIn 0.1s ease-out;
    /* Start invisible until positioned */
    opacity: ${(props) => (props.$isPositioned ? 1 : 0)};

    /* Prevent text selection in context menu */
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    user-select: none;

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

function ContextMenu({
    items,
    position,
    onClose,
    anchorRef,
    isMobile = false,
}) {
    const menuRef = useRef(null);
    const [isPositioned, setIsPositioned] = useState(false);

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
    // Both desktop and mobile: position at touch/click point, clamped to viewport
    // Mobile has additional offset to avoid finger covering the menu
    const getAdjustedPosition = useCallback(() => {
        if (!menuRef.current) return safePosition;

        const menu = menuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const padding = 12;

        // Use visualViewport for accurate viewport size (especially on iOS with keyboard)
        const viewport = window.visualViewport || {
            width: window.innerWidth,
            height: window.innerHeight,
            offsetTop: 0,
            offsetLeft: 0,
        };
        const viewportHeight = viewport.height;
        const viewportWidth = viewport.width;
        const viewportOffsetTop = viewport.offsetTop || 0;

        let { x, y } = safePosition;

        // Mobile: offset menu slightly up and left so finger doesn't cover it
        if (isMobile) {
            x = x - 20; // Slight left offset
            y = y - 30; // Offset up so menu appears above finger
        }

        // Clamp X to keep menu in viewport
        if (x + menuRect.width > viewportWidth - padding) {
            x = viewportWidth - menuRect.width - padding;
        }
        if (x < padding) {
            x = padding;
        }

        // Clamp Y to keep menu in viewport
        let finalY = y;
        if (
            finalY + menuRect.height >
            viewportOffsetTop + viewportHeight - padding
        ) {
            finalY =
                viewportOffsetTop + viewportHeight - menuRect.height - padding;
        }
        if (finalY < viewportOffsetTop + padding) {
            finalY = viewportOffsetTop + padding;
        }

        return { x, y: finalY };
    }, [safePosition, isMobile]);

    // Handle escape key and outside clicks
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        function handleClickOutside(e) {
            // Close menu if click is outside the menu
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        }

        function handleContextMenuOutside(e) {
            // Close menu if right-click is outside the menu
            // Don't prevent default - let the new context menu open
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        }

        // Use capture phase to handle events before they reach other handlers
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener(
            "contextmenu",
            handleContextMenuOutside,
            true
        );

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener(
                "contextmenu",
                handleContextMenuOutside,
                true
            );
        };
    }, [onClose]);

    // Adjust position after initial render
    useEffect(() => {
        if (menuRef.current) {
            // Use requestAnimationFrame to ensure menu is rendered first
            requestAnimationFrame(() => {
                if (!menuRef.current) return;
                const adjusted = getAdjustedPosition();
                menuRef.current.style.left = `${adjusted.x}px`;
                menuRef.current.style.top = `${adjusted.y}px`;
                setIsPositioned(true);
            });
        }
    }, [getAdjustedPosition]);

    // Close menu on touch outside (for mobile)
    useEffect(() => {
        function handleTouchStart(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        }

        document.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });
        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
        };
    }, [onClose]);

    // Filter out null/undefined items
    const visibleItems = items.filter(Boolean);

    // Don't render if invalid position or no items
    if (!isValidPosition || visibleItems.length === 0) return null;

    return createPortal(
        <MenuContainer
            ref={menuRef}
            $isPositioned={isPositioned}
            style={{ left: position.x, top: position.y }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
                // Prevent context menu on the menu itself
                e.preventDefault();
                e.stopPropagation();
            }}
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
        </MenuContainer>,
        document.body
    );
}

export default ContextMenu;
export { MenuItem, MenuDivider };
