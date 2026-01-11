import { forwardRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useScrollMemory } from "../contexts/ScrollMemoryContext";

const ScrollAwareNavLink = forwardRef(function ScrollAwareNavLink(
    { to, onClick, children, ...props },
    ref
) {
    const location = useLocation();
    const { resetScrollPosition } = useScrollMemory();

    const handleClick = (e) => {
        // Get target path
        const targetPath = typeof to === "string" ? to : to.pathname;

        // Detect same-route click: exact match OR current path starts with target
        // This handles cases like clicking "/rankings" while on "/rankings/players"
        const isExactMatch = location.pathname === targetPath;
        const isSubRoute = location.pathname.startsWith(targetPath + "/");

        if (isExactMatch || isSubRoute) {
            // Reset scroll for current pathname
            resetScrollPosition(location.pathname);
        }

        // Call original onClick (e.g., close sidebar on mobile)
        onClick?.(e);
    };

    return (
        <NavLink ref={ref} to={to} onClick={handleClick} {...props}>
            {children}
        </NavLink>
    );
});

export default ScrollAwareNavLink;
