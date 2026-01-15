import styled from "styled-components";
import { NavLink, useLocation } from "react-router-dom";
import {
    HiOutlineHome,
    HiHome,
    HiChatBubbleLeftRight,
    HiOutlineChatBubbleLeftRight,
    HiPlus,
} from "react-icons/hi2";
import { media } from "../utils/constants";
import { useUnreadChatCount } from "../features/chat/useUnreadChatCount";
import { useKeyboard } from "../contexts/KeyboardContext";

// Check if device is a real mobile device (phone/tablet, not laptop with touchscreen)
const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    // Check user agent for mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
    // Also check screen width as fallback (most phones are < 768px wide)
    const isSmallScreen = window.innerWidth <= 768;
    return mobileRegex.test(userAgent) || isSmallScreen;
};

const NavContainer = styled.nav`
    display: none;

    ${media.tablet} {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--primary-background-color);
        border-top: 1px solid var(--secondary-border-color);
        padding: 0.8rem 1.6rem;
        padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0px));
        z-index: 100;
        justify-content: space-around;
        align-items: center;
        transform: translateY(${(props) => (props.$hidden ? "100%" : "0")});
        transition: transform 0.2s ease-out;
    }
`;

const NavItem = styled(NavLink)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.8rem 1.6rem;
    text-decoration: none;
    color: var(--secondary-text-color);
    font-size: 1.1rem;
    font-weight: 500;
    transition: color 0.2s;
    position: relative;

    &.active {
        color: var(--color-brand-500);
    }

    & svg {
        width: 2.4rem;
        height: 2.4rem;
        transition: color 0.2s;
    }

    &:hover {
        color: var(--color-brand-500);
    }
`;

const CreateButton = styled(NavLink)`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background-color: var(--color-brand-500);
    color: white;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;

    & svg {
        width: 2.4rem;
        height: 2.4rem;
    }

    &:hover {
        background-color: var(--color-brand-600);
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const IconWrapper = styled.span`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const NotificationBadge = styled.span`
    position: absolute;
    top: -0.4rem;
    right: -0.6rem;
    min-width: 1.6rem;
    height: 1.6rem;
    padding: 0 0.4rem;
    background-color: var(--color-red-700);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    border-radius: var(--border-radius-pill);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
`;

const Label = styled.span`
    font-size: 1.1rem;
`;

function MobileBottomNav() {
    const { unreadCount } = useUnreadChatCount();
    const { isKeyboardOpen } = useKeyboard();
    const location = useLocation();

    // Only hide navbar when keyboard is open on actual mobile devices AND on chat page
    const isChatPage = location.pathname === "/chat";
    const shouldHide = isKeyboardOpen && isMobileDevice() && isChatPage;

    return (
        <NavContainer $hidden={shouldHide}>
            <NavItem to="/home">
                {({ isActive }) => (
                    <>
                        <IconWrapper>
                            {isActive ? <HiHome /> : <HiOutlineHome />}
                        </IconWrapper>
                        <Label>Home</Label>
                    </>
                )}
            </NavItem>

            <CreateButton to="/matches/create" title="Create Match">
                <HiPlus />
            </CreateButton>

            <NavItem to="/chat">
                {({ isActive }) => (
                    <>
                        <IconWrapper>
                            {isActive ? (
                                <HiChatBubbleLeftRight />
                            ) : (
                                <HiOutlineChatBubbleLeftRight />
                            )}
                            {unreadCount > 0 && (
                                <NotificationBadge>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </NotificationBadge>
                            )}
                        </IconWrapper>
                        <Label>Chat</Label>
                    </>
                )}
            </NavItem>
        </NavContainer>
    );
}

export default MobileBottomNav;
