import styled from "styled-components";
import CurrentDisgraces from "./CurrentDisgraces";
import RecentMatches from "./RecentMatches";
import NewMatchButton from "./NewMatchButton";

const StyledHomeLayout = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.4rem;
`;

function HomeLayout() {
    return (
        <StyledHomeLayout>
            <CurrentDisgraces />
            <RecentMatches />
            <NewMatchButton />
        </StyledHomeLayout>
    );
}

export default HomeLayout;
