import styled from "styled-components";
import DarkModeToggle from "./DarkModeToggle";
import SoundToggle from "./SoundToggle";
import { useKickerInfo } from "../hooks/useKickerInfo";
import SpinnerMini from "./SpinnerMini";
import { useUserKickers } from "../features/kicker/useUserKickers";
import Dropdown from "./Dropdown";
import { useKicker } from "../contexts/KickerContext";
import { useNavigate } from "react-router-dom";
import ButtonIcon from "./ButtonIcon";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { media } from "../utils/constants";
import ProfileMenu from "./ProfileMenu";
import useWindowWidth from "../hooks/useWindowWidth";
import { useMatchContext } from "../contexts/MatchContext";
import MiniActiveMatchInfo from "./MiniActiveMatchInfo";
import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import SeasonBadge from "../features/seasons/SeasonBadge";
import NotificationBell from "../features/notifications/NotificationBell";

const StyledHeader = styled.header`
    background-color: var(--primary-background-color);
    padding: 1.6rem 4.8rem;
    border-bottom: 1px solid var(--secondary-border-color);

    display: flex;
    align-items: center;
    justify-content: space-between;

    /* Smart header - shows on scroll up */
    position: fixed;
    top: 0;
    left: ${(props) => (props.$isSidebarOpen ? "24rem" : "6rem")};
    right: 0;
    z-index: 100;
    transform: translateY(${(props) => (props.$isVisible ? "0" : "-100%")});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.2s ease-out;

    ${media.tablet} {
        justify-content: flex-end;
        padding: 1.6rem 2.4rem;
    }

    @media (max-width: 850px) {
        left: 0;
        z-index: 1000;
        height: 66px;
    }
`;

const KickerInfoWrapper = styled.div`
    display: flex;
    align-items: center;
    /* width: 40rem; */
    gap: 2.4rem;

    @media (max-width: 850px) {
        padding-left: 2rem;
    }

    ${media.tablet} {
        display: none;
    }
`;

const ToggleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;
`;

const DesktopOnly = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;

    ${media.tablet} {
        display: none;
    }
`;

function Header() {
    const navigate = useNavigate();
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();
    const { kickers, isLoadingKickers } = useUserKickers();
    const { setCurrentKicker } = useKicker();
    const { activeMatch } = useMatchContext();
    const { windowWidth } = useWindowWidth();
    const showLeaveKicker = windowWidth <= media.maxTablet;
    const [showActiveMatch, setShowActiveMatch] = useState(!!activeMatch);

    // Smart header visibility
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Track sidebar state for header positioning
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const isOpen =
            localStorage.getItem("isOpenLeftSidebar") === null ||
            localStorage.getItem("isOpenLeftSidebar") === "true";
        return isOpen;
    });

    // Listen for sidebar state changes
    useEffect(() => {
        const handleStorageChange = () => {
            const sidebarOpen =
                localStorage.getItem("isOpenLeftSidebar") === "true";
            setIsSidebarOpen(sidebarOpen);

            // On mobile, show header when sidebar opens
            const isMobile = window.innerWidth <= 850;
            if (isMobile && sidebarOpen) {
                setIsHeaderVisible(true);
            }
        };

        // Custom event for same-tab updates
        window.addEventListener("sidebarToggle", handleStorageChange);
        // Storage event for cross-tab updates
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("sidebarToggle", handleStorageChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const handleScroll = useCallback(() => {
        const currentScrollY = window.scrollY;
        const scrollDiff = Math.abs(currentScrollY - lastScrollY.current);

        // In the first 100px, require a threshold of 30px before reacting
        const threshold = currentScrollY < 100 ? 30 : 0;

        // Always show header when at the very top
        if (currentScrollY < 50) {
            setIsHeaderVisible(true);
            lastScrollY.current = currentScrollY;
            return;
        }

        // On mobile, don't hide header when sidebar is open
        const isMobile = window.innerWidth <= 850;
        const sidebarOpen =
            localStorage.getItem("isOpenLeftSidebar") === "true";
        if (isMobile && sidebarOpen) {
            setIsHeaderVisible(true);
            lastScrollY.current = currentScrollY;
            return;
        }

        // Only react if scrolled more than threshold
        if (scrollDiff < threshold) {
            return;
        }

        // Scrolling down - hide header
        if (currentScrollY > lastScrollY.current) {
            setIsHeaderVisible(false);
        }
        // Scrolling up - show header
        else if (currentScrollY < lastScrollY.current) {
            setIsHeaderVisible(true);
        }

        lastScrollY.current = currentScrollY;
    }, []);

    // Dispatch header visibility changes for BurgerMenu sync
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("headerVisibilityChange", {
                detail: { isVisible: isHeaderVisible },
            })
        );
    }, [isHeaderVisible]);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    function handleKickerSelect(option) {
        setCurrentKicker(option);
        navigate("/home");
    }

    useEffect(() => {
        const isOpen = localStorage.getItem("isOpenLeftSidebar") === "true";
        if (activeMatch && isOpen && windowWidth > 1100) {
            setShowActiveMatch(true);
        } else if (activeMatch && !isOpen && windowWidth > 950) {
            setShowActiveMatch(true);
        } else {
            setShowActiveMatch(false);
        }
    }, [windowWidth, activeMatch]);

    return (
        <StyledHeader
            $isVisible={isHeaderVisible}
            $isSidebarOpen={isSidebarOpen}
        >
            <KickerInfoWrapper>
                {isLoadingKickerData || isLoadingKickers || !kickers ? (
                    <SpinnerMini />
                ) : (
                    <>
                        <Dropdown
                            options={kickers.map((kicker) => ({
                                text: kicker.name,
                                value: kicker.id,
                                avatar: kicker.avatar || undefined,
                            }))}
                            onSelect={handleKickerSelect}
                            initSelected={{
                                text: kickerData.name,
                                value: kickerData.id,
                                avatar: kickerData.avatar || undefined,
                            }}
                        />
                        <SeasonBadge />
                        <ButtonIcon
                            onClick={() => {
                                setCurrentKicker(null);
                                navigate("/");
                            }}
                            title="Exit kicker"
                        >
                            <HiArrowRightOnRectangle />
                        </ButtonIcon>
                    </>
                )}
            </KickerInfoWrapper>

            {showActiveMatch && <MiniActiveMatchInfo />}

            <ToggleWrapper>
                <DesktopOnly>
                    {showLeaveKicker && (
                        <ButtonIcon
                            onClick={() => {
                                setCurrentKicker(null);
                                navigate("/");
                            }}
                            title="Exit kicker"
                        >
                            <HiArrowRightOnRectangle />
                        </ButtonIcon>
                    )}
                </DesktopOnly>
                <DesktopOnly>
                    <SoundToggle />
                </DesktopOnly>
                <DesktopOnly>
                    <DarkModeToggle />
                </DesktopOnly>
                <DesktopOnly>
                    <NotificationBell />
                </DesktopOnly>
                <ProfileMenu />
            </ToggleWrapper>
        </StyledHeader>
    );
}

export default Header;
