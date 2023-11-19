import styled from "styled-components";
import RecentMatches from "./RecentMatches";
import MonthlyDisgraces from "./MonthlyDisgraces";
import MostPlayed from "./MostPlayed";
import TodayStats from "./TodayStats";
import { media } from "../../utils/constants";
import useWindowWidth from "../../hooks/useWindowWidth";
import NewMatchButton from "./NewMatchButton";

const StyledHomeLayout = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto 34rem auto;
    grid-column-gap: 24px;
    grid-row-gap: 24px;

    @media (max-width: 1350px) {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: auto auto 34rem auto;
    }

    /* ${media.tablet} {
        display: none;
    } */
`;

function HomeLayout() {
    const windowWidth = useWindowWidth();

    // if (windowWidth <= media.maxTablet) {
    //     return <NewMatchButton />;
    // }

    return (
        <StyledHomeLayout>
            <TodayStats />
            <MonthlyDisgraces />
            <MostPlayed />
            <RecentMatches />
        </StyledHomeLayout>
    );
}

export default HomeLayout;
