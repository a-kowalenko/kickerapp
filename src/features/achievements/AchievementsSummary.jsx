import styled from "styled-components";
import { HiOutlineTrophy } from "react-icons/hi2";
import { media } from "../../utils/constants";

const Container = styled.div`
    display: flex;
    /* justify-content: space-between; */
    align-items: center;
    padding: 2rem 2.4rem;
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    margin-bottom: 2rem;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
    gap: 4rem;

    ${media.mobile} {
        flex-direction: column;
        gap: 1.6rem;
        padding: 1.6rem;
        text-align: center;
    }
`;

const StatsGroup = styled.div`
    display: flex;
    gap: 3.2rem;

    ${media.mobile} {
        gap: 2rem;
    }
`;

const Stat = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StatValue = styled.span`
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--primary-text-color);

    ${media.mobile} {
        font-size: 2rem;
    }
`;

const StatLabel = styled.span`
    font-size: 1.2rem;
    color: var(--primary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const PointsDisplay = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.2rem 2rem;
    background-color: var(--primary-button-color);
    border-radius: var(--border-radius-md);
    color: var(--primary-button-color-text);

    & svg {
        width: 2.4rem;
        height: 2.4rem;
    }
`;

const PointsValue = styled.span`
    font-size: 2rem;
    font-weight: 700;
`;

const PointsLabel = styled.span`
    font-size: 1.2rem;
    opacity: 0.9;
`;

function AchievementsSummary({
    totalPoints,
    totalUnlocked,
    totalAchievements,
}) {
    const completionPercent =
        totalAchievements > 0
            ? Math.round((totalUnlocked / totalAchievements) * 100)
            : 0;

    return (
        <Container>
            <PointsDisplay>
                <HiOutlineTrophy />
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                    }}
                >
                    <PointsValue>{totalPoints}</PointsValue>
                    <PointsLabel>Achievement Points</PointsLabel>
                </div>
            </PointsDisplay>
            <StatsGroup>
                <Stat>
                    <StatValue>
                        {totalUnlocked} / {totalAchievements}
                    </StatValue>
                    <StatLabel>Unlocked</StatLabel>
                </Stat>
                <Stat>
                    <StatValue>{completionPercent}%</StatValue>
                    <StatLabel>Complete</StatLabel>
                </Stat>
            </StatsGroup>
        </Container>
    );
}

export default AchievementsSummary;
