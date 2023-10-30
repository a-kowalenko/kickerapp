import styled from "styled-components";
import RecentMatches from "./RecentMatches";
import NewMatchButton from "./NewMatchButton";
import MonthlyDisgraces from "./MonthlyDisgraces";
import MostPlayed from "./MostPlayed";

const StyledHomeLayout = styled.div`
    display: grid;
    grid-template-columns: 0.6fr 1fr 0.6fr;
    gap: 2.4rem;
`;

function HomeLayout() {
    return (
        <StyledHomeLayout>
            <MonthlyDisgraces />
            <RecentMatches />
            <MostPlayed />
            <NewMatchButton />
        </StyledHomeLayout>
    );
}

export default HomeLayout;
