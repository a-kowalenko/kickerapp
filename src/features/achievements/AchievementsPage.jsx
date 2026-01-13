import styled from "styled-components";
import Heading from "../../ui/Heading";
import AchievementsFeed from "./AchievementsFeed";

const StyledAchievements = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

function AchievementsPage() {
    return (
        <StyledAchievements>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Achievements
            </Heading>
            <AchievementsFeed />
        </StyledAchievements>
    );
}

export default AchievementsPage;
