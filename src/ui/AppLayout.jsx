import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import styled from "styled-components";
import { media } from "../utils/constants";
import Footer from "./Footer";

const StyledAppLayout = styled.div`
    @media (min-width: 850px) {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr auto;
    }

    min-height: 100dvh;
    background-color: var(--secondary-background-color);

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

    /* Removing scrollbars for webkit, firefox, and ms, respectively */
    /* &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none; */

    @media (max-width: 850px) {
        margin-top: 66px;
    }

    ${media.tablet} {
        padding: 1.6rem 0rem;
    }
`;

function AppLayout() {
    return (
        <StyledAppLayout>
            <Header />
            <Sidebar />
            <Main>
                <Outlet />
            </Main>
            <Footer />
        </StyledAppLayout>
    );
}

export default AppLayout;
