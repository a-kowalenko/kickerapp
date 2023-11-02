import styled from "styled-components";
import RecentMatches from "./RecentMatches";
import MonthlyDisgraces from "./MonthlyDisgraces";
import MostPlayed from "./MostPlayed";
import TodayStats from "./TodayStats";

const StyledHomeLayout = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto 34rem auto;
    grid-column-gap: 24px;
    grid-row-gap: 24px;
`;

function HomeLayout() {
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
