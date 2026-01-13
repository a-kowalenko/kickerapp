import styled from "styled-components";
import Heading from "../../ui/Heading";
import AchievementsFeed from "./AchievementsFeed";
import { DropdownProvider } from "../../contexts/DropdownContext";

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
            <DropdownProvider>
                <AchievementsFeed />
            </DropdownProvider>
        </StyledAchievements>
    );
}

export default AchievementsPage;
