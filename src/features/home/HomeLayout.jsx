import styled from "styled-components";
import RecentMatches from "./RecentMatches";
import MonthlyDisgraces from "./MonthlyDisgraces";
import MostPlayed from "./MostPlayed";
import TodayStats from "./TodayStats";
import { media } from "../../utils/constants";
import TimePlayedChart from "./TimePlayedChart";

const StyledHomeLayout = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto 34rem auto;
    grid-column-gap: 24px;
    grid-row-gap: 24px;
    margin-bottom: 4rem;

    @media (max-width: 1350px) {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: auto auto 34rem auto;
    }

    ${media.tablet} {
        grid-column-gap: 1rem;
        grid-row-gap: 1rem;
    }
`;

function HomeLayout() {
    return (
        <StyledHomeLayout>
            <TodayStats />
            <MonthlyDisgraces />
            <MostPlayed />
            <RecentMatches />
            <TimePlayedChart />
        </StyledHomeLayout>
    );
}

export default HomeLayout;
