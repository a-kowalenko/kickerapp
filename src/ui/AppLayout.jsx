import { Outlet } from "react-router-dom";
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
import { useLocalStorageState } from "../hooks/useLocalStorageState";

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
    }
`;

const Main = styled.main`
    background-color: var(--secondary-background-color);
    padding: 3.2rem 4.8rem 0rem;
    /* overflow: auto; */

    grid-column: 2;
    min-height: 100dvh;

    /* Space for fixed header */
    margin-top: 66px;

    /* Removing scrollbars for webkit, firefox, and ms, respectively */
    /* &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none; */

    ${media.tablet} {
        padding: 1.6rem 0rem;
    }
`;

const RightSidebarWrapper = styled.div`
    grid-column: 3;
    grid-row: 1 / -1;
    /* Reserve space for fixed sidebar */
    width: ${(props) => (props.$isOpen ? "280px" : "44px")};
    flex-shrink: 0;
    transition: width 0.2s ease-out;

    ${media.tablet} {
        display: none;
    }
`;

function AppLayout() {
    const { showAnnouncement, seasonName, acknowledgeNewSeason } =
        useNewSeasonAnnouncement();
    const { currentToast, handleDismiss } = useAchievementNotifications();
    const { isDesktop } = useWindowWidth();
    const [isRightSidebarOpen] = useLocalStorageState(
        true,
        "isOpenRightSidebar"
    );

    return (
        <StyledAppLayout>
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
            <Main>
                <Outlet />
            </Main>
            {isDesktop && (
                <RightSidebarWrapper $isOpen={isRightSidebarOpen}>
                    <PlayerActivitySidebar />
                </RightSidebarWrapper>
            )}
            <Footer />
        </StyledAppLayout>
    );
}

export default AppLayout;
