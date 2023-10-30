import styled from "styled-components";
import RecentMatches from "./RecentMatches";
import NewMatchButton from "./NewMatchButton";
import MonthlyDisgraces from "./MonthlyDisgraces";

const StyledHomeLayout = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.4rem;
`;

function HomeLayout() {
    return (
        <StyledHomeLayout>
            <MonthlyDisgraces />
            <RecentMatches />
            <NewMatchButton />
        </StyledHomeLayout>
    );
}

export default HomeLayout;
