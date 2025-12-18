import styled from "styled-components";
import { HiOutlineTrophy } from "react-icons/hi2";
import { media } from "../../utils/constants";

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2.4rem;
    background: linear-gradient(
        135deg,
        var(--color-brand-50) 0%,
        var(--color-brand-100) 100%
    );
    border: 1px solid var(--color-brand-200);
    border-radius: var(--border-radius-md);
    margin-bottom: 2rem;

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
    color: var(--color-brand-700);

    ${media.mobile} {
        font-size: 2rem;
    }
`;

const StatLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-brand-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const PointsDisplay = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.2rem 2rem;
    background-color: var(--color-brand-600);
    border-radius: var(--border-radius-md);
    color: white;

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
            <StatsGroup>
                <Stat>
                    <StatValue>{totalUnlocked}</StatValue>
                    <StatLabel>Unlocked</StatLabel>
                </Stat>
                <Stat>
                    <StatValue>{totalAchievements}</StatValue>
                    <StatLabel>Total</StatLabel>
                </Stat>
                <Stat>
                    <StatValue>{completionPercent}%</StatValue>
                    <StatLabel>Complete</StatLabel>
                </Stat>
            </StatsGroup>

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
        </Container>
    );
}

export default AchievementsSummary;
