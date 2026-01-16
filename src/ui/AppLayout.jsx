import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import styled from "styled-components";
import { media } from "../utils/constants";
import Footer from "./Footer";
import NewSeasonModal from "./NewSeasonModal";
import { useNewSeasonAnnouncement } from "../features/seasons/useNewSeasonAnnouncement";
import useAchievementNotifications from "../features/achievements/useAchievementNotifications";
import AchievementToast from "../features/achievements/AchievementToast";
import PlayerActivitySidebar from "../features/activity/PlayerActivitySidebar";
import useWindowWidth from "../hooks/useWindowWidth";
import MobileBottomNav from "./MobileBottomNav";
import { KeyboardProvider, useKeyboard } from "../contexts/KeyboardContext";

const StyledAppLayout = styled.div`
    @media (min-width: 850px) {
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto 1fr auto;
    }

    min-height: 100dvh;
    background-color: var(--secondary-background-color);
    overflow-x: clip;
    width: 100%;

    ${media.tablet} {
        grid-template-columns: 1fr;
        ${(props) =>
            props.$isChatPage &&
            `
            overflow: hidden;
            height: 100vh;
            height: 100dvh;
        `}
    }
`;

const Main = styled.main`
    background-color: var(--secondary-background-color);
    padding: 3.2rem 4.8rem 0rem;
    /* overflow: auto; */

    grid-column: 2;
    min-height: 100dvh;

    /* Enable container queries for child components */
    container-type: inline-size;
    container-name: main-content;

    /* Space for fixed header */
    margin-top: 66px;

    /* Desktop chat page: fixed height for proper scroll container */
    ${(props) =>
        props.$isChatPage &&
        `
        height: calc(100dvh - 66px);
        min-height: auto;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding-bottom: 0;
    `}

    /* Removing scrollbars for webkit, firefox, and ms, respectively */
    /* &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none; */

    ${media.tablet} {
        padding: 1.6rem 0rem;
        /* Space for mobile bottom nav - ensure content isn't hidden */
        padding-bottom: calc(3rem + env(safe-area-inset-bottom, 0px));
        min-height: calc(100dvh - 66px);
        ${(props) =>
            props.$isChatPage &&
            `
            padding: 0;
            padding-bottom: ${
                props.$keyboardOpen
                    ? "0"
                    : "calc(8rem + env(safe-area-inset-bottom, 0px))"
            };
            min-height: auto;
            height: calc(100vh - 66px);
            height: calc(100dvh - 66px);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `}
    }
`;

const RightSidebarWrapper = styled.div`
    grid-column: 3;
    grid-row: 1 / -1;
    height: 100dvh;
    position: sticky;
    top: 0;
    flex-shrink: 0;

    ${media.tablet} {
        display: none;
    }
`;

function AppLayoutInner() {
    const { showAnnouncement, seasonName, acknowledgeNewSeason } =
        useNewSeasonAnnouncement();
    const { currentToast, handleDismiss } = useAchievementNotifications();
    const { isDesktop } = useWindowWidth();
    const location = useLocation();
    const { isKeyboardOpen } = useKeyboard();

    // Check if we're on the chat page (for mobile-specific styling)
    const isChatPage = location.pathname === "/chat";

    return (
        <StyledAppLayout $isChatPage={isChatPage}>
            {showAnnouncement && (
                <NewSeasonModal
                    seasonName={seasonName}
                    onClose={acknowledgeNewSeason}
                />
            )}
            {currentToast && (
                <AchievementToast
                    achievement={currentToast}
                    onClose={handleDismiss}
                />
            )}
            <Header />
            <Sidebar />
            <Main $isChatPage={isChatPage} $keyboardOpen={isKeyboardOpen}>
                <Outlet />
            </Main>
            {isDesktop && (
                <RightSidebarWrapper>
                    <PlayerActivitySidebar />
                </RightSidebarWrapper>
            )}
            {!isDesktop && <MobileBottomNav />}
            {/* Hide footer on mobile chat page */}
            {!(isChatPage && !isDesktop) && <Footer />}
        </StyledAppLayout>
    );
}

function AppLayout() {
    return (
        <KeyboardProvider>
            <AppLayoutInner />
        </KeyboardProvider>
    );
}

export default AppLayout;
