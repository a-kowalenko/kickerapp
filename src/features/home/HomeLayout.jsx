import styled from "styled-components";
import RecentMatches from "./RecentMatches";
import MonthlyFatalities from "./MonthlyFatalities";
import MostPlayed from "./MostPlayed";
import TodayStats from "./TodayStats";
import { media } from "../../utils/constants";
import TimePlayedChart from "./TimePlayedChart";

const StyledHomeLayout = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    margin-bottom: 4rem;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto 34rem auto;
    grid-column-gap: 24px;
    grid-row-gap: 24px;

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
            <StatsGrid>
                <TodayStats />
                <MonthlyFatalities />
                <MostPlayed />
                <RecentMatches />
                <TimePlayedChart />
            </StatsGrid>
        </StyledHomeLayout>
    );
}

export default HomeLayout;
