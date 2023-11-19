import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import styled from "styled-components";
import RightSidebar from "./RightSidebar";
import { media } from "../utils/constants";

const StyledAppLayout = styled.div`
    @media (min-width: 850px) {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
    }

    height: 100dvh;
    background-color: var(--secondary-background-color);

    ${media.tablet} {
        grid-template-columns: 1fr;
    }
`;

const Main = styled.main`
    background-color: var(--secondary-background-color);
    padding: 3.2rem 4.8rem 0rem;
    overflow: auto;

    grid-column: 2;

    /* Removing scrollbars for webkit, firefox, and ms, respectively */
    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
`;

function AppLayout() {
    return (
        <StyledAppLayout>
            <Header />
            <Sidebar />
            <Main>
                <Outlet />
            </Main>
            {/* <RightSidebar /> */}
        </StyledAppLayout>
    );
}

export default AppLayout;
