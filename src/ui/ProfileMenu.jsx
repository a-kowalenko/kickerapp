import styled from "styled-components";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
    HiMiniArrowLeftOnRectangle,
    HiOutlineUserCircle,
    HiArrowRightOnRectangle,
    HiOutlineMoon,
    HiOutlineSun,
    HiOutlineSpeakerWave,
    HiOutlineSpeakerXMark,
    HiOutlineBell,
} from "react-icons/hi2";
import { useLogout } from "../features/authentication/useLogout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import { usePlayerStatusForAvatar } from "../features/players/usePlayerStatus";
import { useKicker } from "../contexts/KickerContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useSound } from "../contexts/SoundContext";
import useWindowWidth from "../hooks/useWindowWidth";
import { media } from "../utils/constants";
import SpinnerMini from "./SpinnerMini";
import { BountyCard } from "./BountyCard";
import { useUnreadMentionCount } from "../features/notifications/useNotifications";

const ProfileMenuWrapper = styled.div`
    position: relative;
`;

// Portal dropdown - positioned fixed based on active trigger
const PortalDropdown = styled.ul`
    position: fixed;
    width: max-content;
    min-width: 180px;
    background-color: var(--color-grey-0);
    box-shadow: var(--shadow-md);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    overflow: hidden;
    z-index: 10001;
`;

// Inline dropdown for mobile
const StyledList = styled.ul`
    position: absolute;
    width: max-content;
    min-width: 100%;
    background-color: var(--color-grey-0);
    box-shadow: var(--shadow-md);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    overflow: hidden;
    top: 110%;
    right: 0;
    z-index: 10;
`;

const StyledButton = styled.button`
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 1.2rem 2.4rem;
    font-size: 1.4rem;
    transition: all 0.2s;

    display: flex;
    align-items: center;
    gap: 1.6rem;

    &:hover {
        background-color: var(--color-grey-50);
    }

    & svg {
        width: 2rem;
        height: 2rem;
        transition: all 0.3s;
    }
`;

const MobileOnlyItem = styled.li`
    display: none;

    ${media.tablet} {
        display: block;
    }
`;

const Divider = styled.hr`
    border: none;
    border-top: 1px solid var(--primary-border-color);
    margin: 0.5rem 0;
    display: none;

    ${media.tablet} {
        display: block;
    }
`;

const ProfileMenuContainer = styled.div`
    position: relative;
`;

const MobileNotificationBadge = styled.span`
    position: absolute;
    top: -0.4rem;
    left: -0.4rem;
    min-width: 1.8rem;
    height: 1.8rem;
    padding: 0 0.5rem;
    background-color: var(--color-red-700);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    border-radius: var(--border-radius-pill);
    display: none;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;

    ${media.tablet} {
        display: flex;
    }
`;

const NotificationCount = styled.span`
    background-color: var(--color-red-700);
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: var(--border-radius-pill);
    margin-left: auto;
`;

// Global state for syncing ProfileMenu dropdown across Header and Sidebar
let globalProfileMenuOpen = false;
const profileMenuListeners = new Set();

const setGlobalProfileMenuOpen = (isOpen) => {
    globalProfileMenuOpen = isOpen;
    profileMenuListeners.forEach((listener) => listener(isOpen));
};

// Global trigger rect tracking for portal positioning
let activeTriggerRect = null;
const triggerRectListeners = new Set();

const setActiveTriggerRect = (rect) => {
    activeTriggerRect = rect;
    triggerRectListeners.forEach((listener) => listener(rect));
};

// Track header visibility globally
let isHeaderCurrentlyVisible = true;
const headerVisibilityListeners = new Set();

const setHeaderVisible = (visible) => {
    isHeaderCurrentlyVisible = visible;
    headerVisibilityListeners.forEach((listener) => listener(visible));
};

function ProfileMenu({ inSidebar = false }) {
    const [isOpen, setIsOpen] = useState(globalProfileMenuOpen);
    const [triggerRect, setTriggerRect] = useState(activeTriggerRect);
    const [isHeaderVisible, setIsHeaderVisible] = useState(
        isHeaderCurrentlyVisible
    );
    const triggerRef = useRef(null);
    const portalDropdownRef = useRef(null);

    const close = () => {
        setIsOpen(false);
        setGlobalProfileMenuOpen(false);
    };
    const { logout } = useLogout();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Custom outside click handling that includes the portal dropdown
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        let handleClickOutside = null;

        // Small delay to ignore the click that opened the menu
        const timeoutId = setTimeout(() => {
            handleClickOutside = (e) => {
                // Check if click is inside the wrapper OR inside the portal dropdown
                const isInsideWrapper = wrapperRef.current?.contains(e.target);
                const isInsidePortalDropdown =
                    portalDropdownRef.current?.contains(e.target);

                // Only close if click is truly outside both elements
                if (!isInsideWrapper && !isInsidePortalDropdown) {
                    close();
                }
            };

            document.addEventListener("click", handleClickOutside, false);
        }, 10);

        return () => {
            clearTimeout(timeoutId);
            if (handleClickOutside) {
                document.removeEventListener(
                    "click",
                    handleClickOutside,
                    false
                );
            }
        };
    }, [isOpen]);

    const { setCurrentKicker } = useKicker();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { isSound, toggleSound } = useSound();
    const { windowWidth } = useWindowWidth();
    const isMobile = windowWidth <= media.maxTablet;
    const isDesktop = !isMobile;
    const { unreadCount } = useUnreadMentionCount();

    // Sync with global open state
    useEffect(() => {
        const listener = (newIsOpen) => setIsOpen(newIsOpen);
        profileMenuListeners.add(listener);
        return () => profileMenuListeners.delete(listener);
    }, []);

    // Sync with global trigger rect for portal positioning
    useEffect(() => {
        const listener = (rect) => setTriggerRect(rect);
        triggerRectListeners.add(listener);
        return () => triggerRectListeners.delete(listener);
    }, []);

    // Sync with header visibility
    useEffect(() => {
        const listener = (visible) => setIsHeaderVisible(visible);
        headerVisibilityListeners.add(listener);
        return () => headerVisibilityListeners.delete(listener);
    }, []);

    // Update trigger rect when this instance should be the active trigger
    // Only update when dropdown is opened, not on visibility changes
    useLayoutEffect(() => {
        if (!triggerRef.current || !isOpen) return;

        // Header's ProfileMenu is active when header is visible
        // Sidebar's ProfileMenu is active when header is hidden
        const shouldBeActive = inSidebar ? !isHeaderVisible : isHeaderVisible;

        if (shouldBeActive) {
            const rect = triggerRef.current.getBoundingClientRect();
            setActiveTriggerRect(rect);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inSidebar, isOpen]); // Intentionally excluding isHeaderVisible to prevent position jump on header toggle

    // Handle header visibility changes
    useEffect(() => {
        const handleHeaderVisibility = (event) => {
            const headerVisible = event.detail.isVisible;
            setHeaderVisible(headerVisible);

            // On desktop, check if sidebar is open
            if (isDesktop) {
                const isSidebarOpen =
                    localStorage.getItem("isOpenRightSidebar") !== "false";

                // Only close if header is hidden AND sidebar is closed
                if (!headerVisible && !isSidebarOpen) {
                    setIsOpen(false);
                    setGlobalProfileMenuOpen(false);
                }
                // If header is hidden but sidebar is open, keep dropdown open
                // (it will appear to "transfer" to sidebar)
            } else {
                // On mobile, close when header hides
                if (!headerVisible) {
                    setIsOpen(false);
                    setGlobalProfileMenuOpen(false);
                }
            }
        };

        window.addEventListener(
            "headerVisibilityChange",
            handleHeaderVisibility
        );
        return () => {
            window.removeEventListener(
                "headerVisibilityChange",
                handleHeaderVisibility
            );
        };
    }, [isDesktop]);

    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();
    const {
        bestStreak,
        totalBounty,
        bounty1on1,
        bounty2on2,
        streak1on1,
        streak2on2,
        statuses1on1,
        statuses2on2,
        primaryStatusAsset,
    } = usePlayerStatusForAvatar(player?.id);

    function handleToggle() {
        const newState = !isOpen;
        setIsOpen(newState);
        setGlobalProfileMenuOpen(newState);
    }

    function goToProfile(e) {
        e.stopPropagation();
        close();
        const seasonParam = searchParams.get("season");
        const queryString = seasonParam ? `?season=${seasonParam}` : "";
        navigate(`/user/${player.name}/profile${queryString}`);
    }

    function handleLogout() {
        close();
        logout();
    }

    function handleExitKicker(e) {
        e.stopPropagation();
        close();
        setCurrentKicker(null);
        navigate("/");
    }

    function handleToggleDarkMode(e) {
        e.stopPropagation();
        toggleDarkMode();
        // Don't close menu after toggle so user can see the change
    }

    function handleToggleSound(e) {
        e.stopPropagation();
        toggleSound();
        // Don't close menu after toggle so user can hear the change
    }

    if (isLoadingPlayer) {
        return <SpinnerMini />;
    }

    // Format badge count (max 99+)
    const badgeCount = unreadCount > 99 ? "99+" : unreadCount;

    function handleGoToNotifications(e) {
        e.stopPropagation();
        close();
        navigate("/notifications");
    }

    // Determine if this instance should render the dropdown
    // On desktop: only ONE instance renders it (via portal), based on which trigger is active
    // On mobile: each instance renders its own inline dropdown
    const shouldRenderDropdown =
        isMobile || (inSidebar ? !isHeaderVisible : isHeaderVisible);

    // Calculate dropdown position from trigger rect
    const dropdownStyle = triggerRect
        ? {
              top: triggerRect.bottom + 8,
              right: window.innerWidth - triggerRect.right,
          }
        : {};

    // Dropdown content (shared between portal and inline)
    const dropdownContent = (
        <>
            <li>
                <StyledButton onClick={goToProfile}>
                    <HiOutlineUserCircle />
                    Profile
                </StyledButton>
            </li>

            {/* Mobile-only items */}
            <Divider />
            <MobileOnlyItem>
                <StyledButton onClick={handleGoToNotifications}>
                    <HiOutlineBell />
                    Notifications
                    {unreadCount > 0 && (
                        <NotificationCount>{badgeCount}</NotificationCount>
                    )}
                </StyledButton>
            </MobileOnlyItem>
            <MobileOnlyItem>
                <StyledButton onClick={handleToggleDarkMode}>
                    {isDarkMode ? <HiOutlineSun /> : <HiOutlineMoon />}
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                </StyledButton>
            </MobileOnlyItem>
            <MobileOnlyItem>
                <StyledButton onClick={handleToggleSound}>
                    {isSound ? (
                        <HiOutlineSpeakerWave />
                    ) : (
                        <HiOutlineSpeakerXMark />
                    )}
                    {isSound ? "Sound Off" : "Sound On"}
                </StyledButton>
            </MobileOnlyItem>
            <MobileOnlyItem>
                <StyledButton onClick={handleExitKicker}>
                    <HiArrowRightOnRectangle />
                    Exit Kicker
                </StyledButton>
            </MobileOnlyItem>
            <Divider />

            <li>
                <StyledButton onClick={handleLogout}>
                    <HiMiniArrowLeftOnRectangle />
                    Logout
                </StyledButton>
            </li>
        </>
    );

    return (
        <ProfileMenuWrapper ref={wrapperRef}>
            <ProfileMenuContainer ref={triggerRef}>
                {isMobile && unreadCount > 0 && (
                    <MobileNotificationBadge>
                        {badgeCount}
                    </MobileNotificationBadge>
                )}
                <BountyCard
                    player={player}
                    bounty={totalBounty}
                    bounty1on1={bounty1on1}
                    bounty2on2={bounty2on2}
                    streak={bestStreak}
                    streak1on1={streak1on1}
                    streak2on2={streak2on2}
                    statuses1on1={statuses1on1}
                    statuses2on2={statuses2on2}
                    status={primaryStatusAsset}
                    size="small"
                    onClick={handleToggle}
                    showGamemode={false}
                    showStatusBadge={true}
                    showTargetIcon={false}
                    showLabel={true}
                    showStatusTooltip={true}
                />
            </ProfileMenuContainer>

            {isOpen &&
                shouldRenderDropdown &&
                (isDesktop ? (
                    // Portal dropdown for desktop - positioned fixed
                    createPortal(
                        <PortalDropdown
                            ref={portalDropdownRef}
                            style={dropdownStyle}
                        >
                            {dropdownContent}
                        </PortalDropdown>,
                        document.body
                    )
                ) : (
                    // Inline dropdown for mobile
                    <StyledList>{dropdownContent}</StyledList>
                ))}
        </ProfileMenuWrapper>
    );
}

export default ProfileMenu;
