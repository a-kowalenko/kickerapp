import styled, { keyframes, css } from "styled-components";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { HiOutlineTrophy, HiChevronDown } from "react-icons/hi2";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR } from "../../utils/constants";

// ============== ANIMATIONS ==============

const slideIn = keyframes`
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
`;

const shimmer = keyframes`
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
`;

const glow = keyframes`
    0%, 100% {
        box-shadow: 0 0 0 0 var(--color-brand-500);
    }
    50% {
        box-shadow: 0 0 12px 4px var(--color-brand-500);
    }
`;

// ============== STYLED COMPONENTS ==============

const ItemContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.2rem;
    border-radius: var(--border-radius-md);
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    position: relative;
    overflow: hidden;
    transition: background-color 0.2s;
    flex-shrink: 0;

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    ${(props) =>
        props.$isNew &&
        css`
            animation: ${slideIn} 0.5s ease-out;

            &::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(var(--color-brand-rgb), 0.15),
                    transparent
                );
                background-size: 200% 100%;
                animation: ${shimmer} 2s ease-in-out;
                pointer-events: none;
            }
        `}
`;

const MatchHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
`;

const MatchInfo = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    text-decoration: none;
    color: var(--primary-text-color);
    transition: color 0.2s;

    &:hover {
        color: var(--primary-button-color);
    }
`;

const TrophyIcon = styled(HiOutlineTrophy)`
    font-size: 2rem;
    color: var(--color-brand-500);
    flex-shrink: 0;
`;

const MatchTitle = styled.span`
    font-weight: 600;
    font-size: 1.4rem;
`;

const MatchScore = styled.span`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
`;

const TimeAgo = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    white-space: nowrap;
`;

const NoMatchHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
`;

const SeasonBadge = styled.span`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--primary-text-color);
`;

const PlayersContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-left: 0.5rem;
`;

const PlayerSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const PlayerHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const PlayerLink = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }
`;

const PlayerName = styled.span`
    font-weight: 600;
    font-size: 1.3rem;
    color: var(--primary-text-color);
`;

const PlayerPoints = styled.span`
    font-size: 1.2rem;
    color: var(--color-brand-500);
    font-weight: 600;
`;

const AchievementCount = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const AchievementsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-left: 4.2rem;
`;

const AchievementWrapper = styled.div`
    display: flex;
    flex-direction: column;
    contain: layout;
`;

const AchievementRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.4rem 0.6rem;
    border-radius: var(--border-radius-sm);
    background-color: ${(props) =>
        props.$isExpanded
            ? "var(--primary-border-color)"
            : "var(--tertiary-background-color)"};
    transition: background-color 0.15s;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &:hover {
        background-color: var(--primary-border-color);
    }

    ${(props) =>
        props.$isNew &&
        css`
            animation: ${glow} 1.5s ease-in-out;
        `}
`;

const ChevronIcon = styled(HiChevronDown)`
    font-size: 1.4rem;
    color: var(--tertiary-text-color);
    transition: transform 0.15s ease-out;
    flex-shrink: 0;
    transform: ${(props) =>
        props.$isExpanded ? "rotate(180deg)" : "rotate(0)"};
    will-change: transform;
`;

const AccordionContent = styled.div`
    display: grid;
    grid-template-rows: ${(props) => (props.$isExpanded ? "1fr" : "0fr")};
    transition: grid-template-rows 0.2s ease-out;
    will-change: grid-template-rows;
`;

const AccordionInner = styled.div`
    overflow: hidden;
    min-height: 0;
`;

const AccordionText = styled.p`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    line-height: 1.5;
    margin: 0;
    padding: 0.6rem 0.6rem 0.4rem 3rem;
`;

const AchievementIcon = styled.span`
    font-size: 1.6rem;
    line-height: 1;
`;

const AchievementName = styled.span`
    flex: 1;
    font-size: 1.3rem;
    color: var(--primary-text-color);
    font-weight: 500;
`;

const AchievementPoints = styled.span`
    font-size: 1.2rem;
    color: var(--color-brand-500);
    font-weight: 600;
`;

const CategoryBadge = styled.span`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    padding: 0.2rem 0.5rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-pill);
`;

// ============== HELPER FUNCTIONS ==============

/**
 * Format team names from match data
 */
function formatMatchTeams(match) {
    if (!match) return null;

    const team1 = [match.player1?.name, match.player3?.name]
        .filter(Boolean)
        .join(" & ");

    const team2 = [match.player2?.name, match.player4?.name]
        .filter(Boolean)
        .join(" & ");

    return { team1: team1 || "Team 1", team2: team2 || "Team 2" };
}

// ============== COMPONENT ==============

function AchievementTickerItem({ group, isNew = false }) {
    const { matchId, match, players, latestUnlockedAt } = group;
    const [expandedAchievementId, setExpandedAchievementId] = useState(null);

    const timeAgo = formatDistanceToNow(new Date(latestUnlockedAt), {
        addSuffix: true,
    });

    const handleAchievementClick = (id) => {
        setExpandedAchievementId((prev) => (prev === id ? null : id));
    };

    const teams = formatMatchTeams(match);
    const hasMatch = matchId && match;

    // Count total achievements in this group
    const totalAchievements = players.reduce(
        (sum, p) => sum + p.achievements.length,
        0
    );

    return (
        <ItemContainer $isNew={isNew}>
            {/* Header - Match Info or Season Achievement */}
            {hasMatch ? (
                <MatchHeader>
                    <MatchInfo to={`/matches/${matchId}`}>
                        <TrophyIcon />
                        <MatchTitle>Match #{match.nr}</MatchTitle>
                        {teams && (
                            <MatchScore>
                                {teams.team1} {match.scoreTeam1}:
                                {match.scoreTeam2} {teams.team2}
                            </MatchScore>
                        )}
                    </MatchInfo>
                    <TimeAgo>{timeAgo}</TimeAgo>
                </MatchHeader>
            ) : (
                <NoMatchHeader>
                    <SeasonBadge>
                        <TrophyIcon />
                        {totalAchievements > 1
                            ? `${totalAchievements} Achievements`
                            : "Achievement"}
                    </SeasonBadge>
                    <TimeAgo>{timeAgo}</TimeAgo>
                </NoMatchHeader>
            )}

            {/* Players and their achievements */}
            <PlayersContainer>
                {players.map((playerGroup) => (
                    <PlayerSection key={playerGroup.player.id}>
                        <PlayerHeader>
                            <PlayerLink
                                to={`/user/${playerGroup.player.name}/profile`}
                            >
                                <Avatar
                                    src={
                                        playerGroup.player.avatar ||
                                        DEFAULT_AVATAR
                                    }
                                    $size="small"
                                />
                                <PlayerName>
                                    {playerGroup.player.name}
                                </PlayerName>
                            </PlayerLink>
                            <PlayerPoints>
                                +
                                {playerGroup.achievements.reduce(
                                    (sum, a) =>
                                        sum + (a.achievement?.points || 0),
                                    0
                                )}{" "}
                                pts
                            </PlayerPoints>
                            {playerGroup.achievements.length > 1 && (
                                <AchievementCount>
                                    ({playerGroup.achievements.length}{" "}
                                    Achievements)
                                </AchievementCount>
                            )}
                        </PlayerHeader>

                        <AchievementsList>
                            {playerGroup.achievements.map((item) => {
                                const isExpanded =
                                    expandedAchievementId === item.id;
                                return (
                                    <AchievementWrapper key={item.id}>
                                        <AchievementRow
                                            $isNew={isNew}
                                            $isExpanded={isExpanded}
                                            onClick={() =>
                                                handleAchievementClick(item.id)
                                            }
                                        >
                                            <AchievementIcon>
                                                {item.achievement.icon || "🏆"}
                                            </AchievementIcon>
                                            <AchievementName>
                                                {item.achievement.name}
                                            </AchievementName>
                                            {item.achievement.category && (
                                                <CategoryBadge>
                                                    {
                                                        item.achievement
                                                            .category.name
                                                    }
                                                </CategoryBadge>
                                            )}
                                            <AchievementPoints>
                                                +{item.achievement?.points || 0}{" "}
                                                pts
                                            </AchievementPoints>
                                            <ChevronIcon
                                                $isExpanded={isExpanded}
                                            />
                                        </AchievementRow>
                                        <AccordionContent
                                            $isExpanded={isExpanded}
                                        >
                                            <AccordionInner>
                                                <AccordionText>
                                                    {item.achievement
                                                        .description ||
                                                        "Keine Beschreibung verfügbar."}
                                                </AccordionText>
                                            </AccordionInner>
                                        </AccordionContent>
                                    </AchievementWrapper>
                                );
                            })}
                        </AchievementsList>
                    </PlayerSection>
                ))}
            </PlayersContainer>
        </ItemContainer>
    );
}

export default AchievementTickerItem;
