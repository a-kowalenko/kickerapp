import styled from "styled-components";
import MainNav from "./MainNav";
import Logo from "./Logo";
import BurgerMenu from "./BurgerMenu";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import useWindowWidth from "../hooks/useWindowWidth";
import { useState, useEffect, useCallback, useRef } from "react";

const StyledSidebar = styled.aside`
    display: flex;
    flex-direction: column;
    padding: 1.2rem 2.4rem;
    background-color: var(--primary-background-color);
    grid-row: 1 / -2;
    border-right: 1px solid var(--secondary-border-color);
    transition: width 0.2s ease-out; // Hinzufügen von Transitions
    width: 24rem;
    overflow: auto;
    overflow-x: hidden;
    position: sticky;
    top: 0;
    height: 100dvh;
    align-self: start;

    @media (max-width: 850px) {
        &.active {
            left: 0;
        }
    }

    @media (min-width: 851px) {
        ${(props) =>
            props.$isOpen
                ? `
                & img {
                    transition: height 0.3s ease-out, margin-top 0.3s ease-out;
                }
            `
                : `
                width: 6rem; 
                padding: 0px;
                
                & img {
                    height: 6rem;
                    margin-top: 6rem;
                }

                & span {
                    display: none;
                }
                & a {
                    justify-content: center;
                }
                & a:link, & a:visited {
                    padding: 1.2rem 1.2rem;
                }
        `}
    }

    @media (max-width: 850px) {
        position: fixed;
        top: 0;
        bottom: 0;
        left: -100%;
        width: 25rem;
        z-index: 100;
        transition: left 0.3s ease-in-out;
        margin-top: 66px;
    }
`;

const MobileBackdrop = styled.div`
    display: none;

    @media (max-width: 850px) {
        display: block;
        position: fixed;
        inset: 0;
        top: 66px;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 99;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;

        &.active {
            opacity: 1;
            visibility: visible;
        }
    }
`;

function Sidebar() {
    const { isDesktop } = useWindowWidth();
    const [isOpen, setIsOpen] = useLocalStorageState(
        isDesktop,
        "isOpenLeftSidebar"
    );
    const sidebarRef = useRef(null);

    // Track header visibility for BurgerMenu sync on mobile
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    useEffect(() => {
        const handleHeaderVisibility = (e) => {
            setIsHeaderVisible(e.detail.isVisible);
        };

        window.addEventListener(
            "headerVisibilityChange",
            handleHeaderVisibility
        );
        return () =>
            window.removeEventListener(
                "headerVisibilityChange",
                handleHeaderVisibility
            );
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => window.dispatchEvent(new Event("sidebarToggle")), 0);
    }, [setIsOpen]);

    // Close sidebar on any click outside nav items (mobile only)
    useEffect(() => {
        if (!isOpen || isDesktop) return;

        function handleClick(e) {
            // Check if click was on a nav link (these have their own onClick handlers)
            if (e.target.closest("a[href]")) return;
            // Check if click was on the burger menu
            if (e.target.closest("[data-burger-menu]")) return;
            // Close sidebar for any other click
            close();
        }

        // Use setTimeout to avoid closing immediately when opening
        const timeoutId = setTimeout(() => {
            document.addEventListener("click", handleClick);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("click", handleClick);
        };
    }, [isOpen, isDesktop, close]);

    const toggleSidebar = (e) => {
        e.stopPropagation();
        setIsOpen((open) => !open);
        // Dispatch event so Header can update its position (after localStorage updates)
        setTimeout(() => window.dispatchEvent(new Event("sidebarToggle")), 0);
    };

    return (
        <>
            <BurgerMenu
                onClick={toggleSidebar}
                isHeaderVisible={isHeaderVisible}
            />
            <MobileBackdrop
                className={isOpen ? "active" : ""}
                onClick={close}
            />
            <StyledSidebar
                ref={sidebarRef}
                className={isOpen ? "active" : ""}
                $isOpen={isOpen}
            >
                <Logo />
                <MainNav close={close} />
            </StyledSidebar>
        </>
    );
}

export default Sidebar;
