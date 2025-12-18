import styled from "styled-components";
import AchievementCard from "./AchievementCard";
import { media } from "../../utils/constants";

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(35rem, 1fr));
    gap: 1.6rem;

    ${media.tablet} {
        grid-template-columns: 1fr;
    }
`;

const CategorySection = styled.div`
    margin-bottom: 3.2rem;
`;

const CategoryHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-bottom: 1.6rem;
    padding-bottom: 0.8rem;
    border-bottom: 2px solid var(--color-brand-200);
`;

const CategoryIcon = styled.span`
    font-size: 2rem;
`;

const CategoryName = styled.h2`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
`;

const CategoryCount = styled.span`
    font-size: 1.4rem;
    color: var(--tertiary-text-color);
    margin-left: auto;
`;

const NoAchievements = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: var(--tertiary-text-color);
    font-size: 1.6rem;
`;

function AchievementsList({ achievements, groupByCategory = true }) {
    if (!achievements || achievements.length === 0) {
        return (
            <NoAchievements>
                No achievements available yet. Check back later!
            </NoAchievements>
        );
    }

    if (!groupByCategory) {
        return (
            <Grid>
                {achievements.map((achievement) => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                    />
                ))}
            </Grid>
        );
    }

    // Group achievements by category
    const groupedAchievements = achievements.reduce((acc, achievement) => {
        const categoryId = achievement.category?.id || "uncategorized";
        if (!acc[categoryId]) {
            acc[categoryId] = {
                category: achievement.category || {
                    id: "uncategorized",
                    name: "Uncategorized",
                    icon: "📋",
                },
                achievements: [],
            };
        }
        acc[categoryId].achievements.push(achievement);
        return acc;
    }, {});

    // Sort by category sort_order
    const sortedGroups = Object.values(groupedAchievements).sort(
        (a, b) => (a.category.sort_order || 0) - (b.category.sort_order || 0)
    );

    return (
        <div>
            {sortedGroups.map(
                ({ category, achievements: categoryAchievements }) => {
                    const unlockedCount = categoryAchievements.filter(
                        (a) => a.isUnlocked
                    ).length;

                    return (
                        <CategorySection key={category.id}>
                            <CategoryHeader>
                                <CategoryIcon>
                                    {category.icon || "🏆"}
                                </CategoryIcon>
                                <CategoryName>{category.name}</CategoryName>
                                <CategoryCount>
                                    {unlockedCount} /{" "}
                                    {categoryAchievements.length}
                                </CategoryCount>
                            </CategoryHeader>
                            <Grid>
                                {categoryAchievements.map((achievement) => (
                                    <AchievementCard
                                        key={achievement.id}
                                        achievement={achievement}
                                    />
                                ))}
                            </Grid>
                        </CategorySection>
                    );
                }
            )}
        </div>
    );
}

export default AchievementsList;
