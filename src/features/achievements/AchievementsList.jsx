import styled from "styled-components";
import AchievementCard from "./AchievementCard";
import AchievementChainCard from "./AchievementChainCard";
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

// Helper function to build achievement chains
function buildChains(achievements) {
    const chains = [];
    const processedIds = new Set();
    const childrenMap = new Map(); // parent_id -> children

    // Build a map of parent_id to children
    achievements.forEach((a) => {
        if (a.parent_id) {
            if (!childrenMap.has(a.parent_id)) {
                childrenMap.set(a.parent_id, []);
            }
            childrenMap.get(a.parent_id).push(a);
        }
    });

    // Find root achievements (no parent OR parent doesn't exist in current achievements)
    const roots = achievements.filter((a) => {
        if (!a.parent_id) return true;
        // Check if parent exists in our achievement list
        return !achievements.find((p) => p.id === a.parent_id);
    });

    // Build chains starting from roots
    roots.forEach((root) => {
        if (processedIds.has(root.id)) return;

        const chain = [];
        let current = root;

        while (current && !processedIds.has(current.id)) {
            chain.push(current);
            processedIds.add(current.id);

            // Find the child of current
            const children = childrenMap.get(current.id);
            current = children?.[0] || null;
        }

        chains.push(chain);
    });

    return chains;
}

// Helper to determine which achievement in chain is "current" (first non-unlocked, or last if all unlocked)
function getCurrentInChain(chain) {
    const firstNonUnlocked = chain.find((a) => !a.isUnlocked);
    return firstNonUnlocked?.id || chain[chain.length - 1]?.id;
}

// Helper to check if an achievement should be visible (for non-chain achievements)
function isAchievementVisible(achievement) {
    // Always show unlocked achievements
    if (achievement.isUnlocked) return true;
    // Hide hidden achievements that aren't unlocked
    if (achievement.is_hidden) return false;
    // Show all non-hidden achievements
    return true;
}

// Helper to check if a chain should be visible (visible if any member is visible)
function isChainVisible(chain) {
    // Chain is visible if any achievement in it is visible
    return chain.some((a) => isAchievementVisible(a));
}

function AchievementsList({ achievements, groupByCategory = true }) {
    if (!achievements || achievements.length === 0) {
        return (
            <NoAchievements>
                No achievements available yet. Check back later!
            </NoAchievements>
        );
    }

    // Build chains from ALL achievements first (to keep chains complete)
    // Then filter out chains that shouldn't be visible

    if (!groupByCategory) {
        // Build chains from all achievements
        const allChains = buildChains(achievements);

        // Filter to only visible chains
        const chains = allChains.filter((chain) => isChainVisible(chain));

        return (
            <Grid>
                {chains.map((chain) => {
                    if (chain.length === 1) {
                        // Single achievement, no chain
                        return (
                            <AchievementCard
                                key={chain[0].id}
                                achievement={chain[0]}
                            />
                        );
                    }

                    // Multi-achievement chain - use expandable card
                    const currentId = getCurrentInChain(chain);
                    return (
                        <AchievementChainCard
                            key={`chain-${chain[0].id}`}
                            chain={chain}
                            currentAchievementId={currentId}
                        />
                    );
                })}
            </Grid>
        );
    }

    // Group achievements by category (use all achievements to keep chains complete)
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
                    // Build chains within this category (from all achievements)
                    const allChains = buildChains(categoryAchievements);

                    // Filter to only visible chains
                    const chains = allChains.filter((chain) =>
                        isChainVisible(chain)
                    );
                    // Count visible achievements
                    const visibleAchievements = chains.flat();
                    const unlockedCount = visibleAchievements.filter(
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
                                    {visibleAchievements.length}
                                </CategoryCount>
                            </CategoryHeader>
                            <Grid>
                                {chains.map((chain) => {
                                    if (chain.length === 1) {
                                        // Single achievement, no chain
                                        return (
                                            <AchievementCard
                                                key={chain[0].id}
                                                achievement={chain[0]}
                                            />
                                        );
                                    }

                                    // Multi-achievement chain - use expandable card
                                    const currentId = getCurrentInChain(chain);
                                    return (
                                        <AchievementChainCard
                                            key={`chain-${chain[0].id}`}
                                            chain={chain}
                                            currentAchievementId={currentId}
                                        />
                                    );
                                })}
                            </Grid>
                        </CategorySection>
                    );
                }
            )}
        </div>
    );
}

export default AchievementsList;
