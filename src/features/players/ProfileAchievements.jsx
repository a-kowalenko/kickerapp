import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useQuery } from "react-query";
import { HiOutlineTrophy, HiCheck } from "react-icons/hi2";
import { format } from "date-fns";
import { getPlayerAchievements } from "../../services/apiAchievements";
import { useSelectedSeason } from "../seasons/useSelectedSeason";
import { usePlayerName } from "./usePlayerName";
import { useAchievementsWithProgress } from "../achievements/useAchievementsWithProgress";
import Spinner from "../../ui/Spinner";
import AchievementsSummary from "../achievements/AchievementsSummary";
import { media } from "../../utils/constants";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const EmptyMessage = styled.p`
    text-align: center;
    font-size: 1.6rem;
    color: var(--tertiary-text-color);
    padding: 4rem 2rem;
`;

const AchievementCard = styled.div`
    display: flex;
    gap: 1.4rem;
    padding: 1.4rem;
    background-color: var(--achievement-unlocked-bg, var(--color-grey-50));
    border: 1px solid var(--achievement-unlocked-border, var(--color-brand-500));
    border-radius: var(--border-radius-md);
    transition: all 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
`;

const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 5rem;
    min-width: 5rem;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--color-brand-500),
        var(--color-brand-700)
    );
    color: white;
    font-size: 2rem;
    position: relative;
`;

const CheckBadge = styled.div`
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 50%;
    background-color: var(--color-green-700);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
    min-width: 0;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
`;

const Name = styled.h3`
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-brand-700);
    margin: 0;
`;

const Points = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--color-brand-600);
    white-space: nowrap;

    & svg {
        width: 1.4rem;
        height: 1.4rem;
    }
`;

const Description = styled.p`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    margin: 0;
    line-height: 1.4;
`;

const UnlockedDate = styled.span`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    margin-top: 0.4rem;
`;

const CategorySection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const CategoryHeader = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin: 0;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--secondary-border-color);

    & span {
        font-size: 1.8rem;
    }
`;

const CategoryAchievements = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(30rem, 1fr));
    gap: 1.2rem;

    ${media.mobile} {
        grid-template-columns: 1fr;
    }
`;

function ProfileAchievements() {
    const { userId } = useParams();
    const { seasonValue } = useSelectedSeason();
    const { player, isLoading: isLoadingPlayer } = usePlayerName(userId);

    const seasonId =
        seasonValue &&
        seasonValue !== "all-time" &&
        seasonValue !== "off-season"
            ? seasonValue
            : null;

    const { data: achievements, isLoading: isLoadingAchievements } = useQuery(
        ["profileAchievements", player?.id, seasonId],
        () => getPlayerAchievements(player.id, seasonId),
        {
            enabled: !!player?.id,
        }
    );

    // Get all achievements to calculate total count
    const {
        achievements: allAchievements,
        isLoading: isLoadingAllAchievements,
    } = useAchievementsWithProgress(player?.id, null);

    if (isLoadingPlayer || isLoadingAchievements || isLoadingAllAchievements) {
        return <Spinner />;
    }

    if (!achievements || achievements.length === 0) {
        return (
            <Container>
                <EmptyMessage>No achievements unlocked yet.</EmptyMessage>
            </Container>
        );
    }

    // Calculate summary
    const totalPoints = achievements.reduce(
        (sum, a) => sum + (a.achievement?.points || 0),
        0
    );
    const totalUnlocked = achievements.length;
    const totalAchievements = allAchievements?.length || 0;

    // Group by category
    const groupedByCategory = achievements.reduce((acc, achievement) => {
        const categoryName =
            achievement.achievement?.category?.name || "Uncategorized";
        const categoryIcon = achievement.achievement?.category?.icon || "🏆";
        const categoryKey = `${categoryIcon}-${categoryName}`;

        if (!acc[categoryKey]) {
            acc[categoryKey] = {
                name: categoryName,
                icon: categoryIcon,
                achievements: [],
            };
        }
        acc[categoryKey].achievements.push(achievement);
        return acc;
    }, {});

    return (
        <Container>
            <AchievementsSummary
                totalPoints={totalPoints}
                totalUnlocked={totalUnlocked}
                totalAchievements={totalAchievements}
            />

            {Object.entries(groupedByCategory).map(
                ([key, { name, icon, achievements: categoryAchievements }]) => (
                    <CategorySection key={key}>
                        <CategoryHeader>
                            <span>{icon}</span>
                            {name}
                        </CategoryHeader>
                        <CategoryAchievements>
                            {categoryAchievements.map((pa) => (
                                <AchievementCard key={pa.id}>
                                    <IconContainer>
                                        <span>
                                            {pa.achievement?.icon || "🏆"}
                                        </span>
                                        <CheckBadge>
                                            <HiCheck />
                                        </CheckBadge>
                                    </IconContainer>
                                    <Content>
                                        <Header>
                                            <Name>{pa.achievement?.name}</Name>
                                            <Points>
                                                <HiOutlineTrophy />
                                                {pa.achievement?.points}
                                            </Points>
                                        </Header>
                                        <Description>
                                            {pa.achievement?.description}
                                        </Description>
                                        {pa.unlocked_at && (
                                            <UnlockedDate>
                                                Unlocked:{" "}
                                                {format(
                                                    new Date(pa.unlocked_at),
                                                    "dd.MM.yyyy - HH:mm"
                                                )}
                                            </UnlockedDate>
                                        )}
                                        {pa.times_completed > 1 && (
                                            <UnlockedDate>
                                                Completed {pa.times_completed}x
                                            </UnlockedDate>
                                        )}
                                    </Content>
                                </AchievementCard>
                            ))}
                        </CategoryAchievements>
                    </CategorySection>
                )
            )}
        </Container>
    );
}

export default ProfileAchievements;
