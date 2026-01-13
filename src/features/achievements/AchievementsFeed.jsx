import styled, { css, keyframes } from "styled-components";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
    HiOutlineTrophy,
    HiChevronDoubleDown,
    HiOutlineMagnifyingGlass,
    HiOutlineSparkles,
    HiXMark,
} from "react-icons/hi2";
import { useAchievementFeed } from "../home/useAchievementFeed";
import { useAchievementFeedStats } from "./useAchievementFeedStats";
import { useAchievementCategories } from "./useAchievementCategories";
import { usePlayers } from "../../hooks/usePlayers";
import AchievementTickerItem from "../home/AchievementTickerItem";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import JumpToLatestButton from "../../ui/JumpToLatestButton";
import Avatar from "../../ui/Avatar";
import { media, DEFAULT_AVATAR } from "../../utils/constants";

// ============== ANIMATIONS ==============

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
`;

// ============== STYLED COMPONENTS ==============

const PageContainer = styled.div`
    display: grid;
    grid-template-columns: minmax(26rem, 32rem) 1fr;
    gap: 1.6rem;
    height: 100%;
    max-height: calc(100vh - 12rem);
    overflow: hidden;
    padding: 1.6rem;

    ${media.tablet} {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 1rem;
        max-height: calc(100vh - 10rem);
    }
`;

// Stats Column (left side on desktop, top on mobile)
const StatsColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    min-height: 0;
    overflow: hidden;

    ${media.tablet} {
        gap: 1rem;
    }
`;

// Stats Cards Section
const StatsSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.6rem;
    background: linear-gradient(
        135deg,
        var(--tertiary-background-color),
        var(--secondary-background-color)
    );
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--primary-border-color);

    ${media.tablet} {
        padding: 1rem;
        gap: 0.8rem;
    }
`;

const StatsSectionTitle = styled.h3`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;

    & svg {
        color: var(--color-brand-500);
        font-size: 1.8rem;
    }

    ${media.tablet} {
        font-size: 1.3rem;
    }
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;

    ${media.tablet} {
        grid-template-columns: repeat(4, 1fr);
        gap: 0.6rem;
    }

    ${media.mobile} {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const StatCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.2rem;
    background-color: var(--primary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);

    ${media.tablet} {
        padding: 0.8rem 0.6rem;
    }
`;

const StatValue = styled.span`
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--color-brand-600);

    ${media.tablet} {
        font-size: 1.8rem;
    }

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const StatLabel = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    text-align: center;

    ${media.tablet} {
        font-size: 1.1rem;
    }

    ${media.mobile} {
        font-size: 1rem;
    }
`;

// Leaderboard Section
const LeaderboardSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.6rem;
    background: linear-gradient(
        135deg,
        var(--tertiary-background-color),
        var(--secondary-background-color)
    );
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--primary-border-color);
    flex: 1;
    min-height: 0;
    overflow: hidden;

    ${media.tablet} {
        padding: 1rem;
        gap: 0.8rem;
        max-height: 20rem;
    }
`;

const LeaderboardTitle = styled.h3`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;

    & svg {
        color: var(--color-brand-500);
        font-size: 1.8rem;
    }

    ${media.tablet} {
        font-size: 1.3rem;
    }
`;

const LeaderboardList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    overflow-y: auto;
    flex: 1;
    min-height: 0;

    &::-webkit-scrollbar {
        width: 0.5rem;
    }

    &::-webkit-scrollbar-track {
        background: var(--tertiary-background-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb {
        background: var(--primary-border-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-text-color);
    }

    ${media.tablet} {
        flex-direction: row;
        overflow-x: auto;
        overflow-y: hidden;
        gap: 0.8rem;
        padding-bottom: 0.4rem;

        &::-webkit-scrollbar {
            height: 0.4rem;
        }
    }
`;

const LeaderboardItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
    background-color: var(--primary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    flex-shrink: 0;

    ${(props) =>
        props.$rank === 1 &&
        css`
            border-color: var(--color-gold);
            background: linear-gradient(
                135deg,
                var(--primary-background-color),
                rgba(255, 215, 0, 0.1)
            );
        `}

    ${(props) =>
        props.$rank === 2 &&
        css`
            border-color: var(--color-silver);
        `}

    ${(props) =>
        props.$rank === 3 &&
        css`
            border-color: var(--color-bronze);
        `}

    ${media.tablet} {
        padding: 0.6rem 1rem;
        min-width: max-content;
    }
`;

const LeaderboardRank = styled.span`
    font-size: 1.2rem;
    font-weight: 700;
    color: ${(props) => {
        if (props.$rank === 1) return "var(--color-gold)";
        if (props.$rank === 2) return "var(--color-silver)";
        if (props.$rank === 3) return "var(--color-bronze)";
        return "var(--tertiary-text-color)";
    }};
    min-width: 2rem;

    ${media.tablet} {
        font-size: 1.1rem;
        min-width: 1.6rem;
    }
`;

const LeaderboardPlayer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1;
    min-width: 0;
`;

const LeaderboardName = styled.span`
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.tablet} {
        font-size: 1.2rem;
    }
`;

const LeaderboardCount = styled.span`
    font-size: 1.2rem;
    color: var(--color-brand-600);
    font-weight: 600;
    margin-left: auto;
    white-space: nowrap;

    ${media.tablet} {
        font-size: 1.1rem;
    }
`;

// Feed Column (right side on desktop, bottom on mobile)
const FeedColumn = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--primary-border-color);

    ${media.tablet} {
        flex: 1;
    }
`;

const FilterBar = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.6rem;
    background-color: var(--primary-background-color);
    border-bottom: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    flex-wrap: wrap;

    ${media.mobile} {
        padding: 0.8rem 1.2rem;
        gap: 0.8rem;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const FilterLabel = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    white-space: nowrap;

    ${media.mobile} {
        display: none;
    }
`;

const SearchInput = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    flex: 1;
    min-width: 15rem;
    max-width: 25rem;

    & svg {
        color: var(--tertiary-text-color);
        font-size: 1.6rem;
        flex-shrink: 0;
    }

    & input {
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 1.3rem;
        width: 100%;
        outline: none;

        &::placeholder {
            color: var(--tertiary-text-color);
        }
    }

    ${media.mobile} {
        min-width: 100%;
        max-width: none;
    }
`;

const ClearButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem;
    background: transparent;
    border: none;
    color: var(--tertiary-text-color);
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
        color: var(--primary-text-color);
    }

    & svg {
        font-size: 1.4rem;
    }
`;

const LiveIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 1rem;
    background-color: var(--color-green-100);
    border-radius: var(--border-radius-pill);
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--color-green-700);
    margin-left: auto;

    ${media.mobile} {
        padding: 0.4rem 0.8rem;
        font-size: 1.1rem;
    }
`;

const LiveDot = styled.span`
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background-color: var(--color-green-600);
    animation: ${pulse} 2s infinite;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    min-height: 0;
    overflow: hidden;
`;

const FeedContainer = styled.div`
    display: flex;
    flex-direction: column-reverse;
    gap: 0.8rem;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    padding: 1rem;
    position: relative;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
        width: 0.6rem;
    }

    &::-webkit-scrollbar-track {
        background: var(--tertiary-background-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb {
        background: var(--primary-border-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-text-color);
    }
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    justify-content: center;
    padding: 0.5rem;
    color: var(--tertiary-text-color);
    font-size: 1.2rem;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 3rem;
    color: var(--tertiary-text-color);
    text-align: center;
    gap: 1rem;

    & svg {
        font-size: 4rem;
        opacity: 0.5;
    }
`;

const EmptyText = styled.p`
    font-size: 1.4rem;
`;

const NewAchievementsBadge = styled.span`
    position: absolute;
    top: -0.4rem;
    right: -0.4rem;
    background-color: var(--color-brand-500);
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: var(--border-radius-pill);
    font-size: 1rem;
    font-weight: 600;
    min-width: 1.8rem;
    text-align: center;
`;

const StyledSelect = styled.select`
    min-width: 12rem;
    font-size: 1.3rem;
    padding: 0.6rem 1rem;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    background-color: var(--secondary-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    outline: none;
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-brand-500);
    }

    &:focus {
        border-color: var(--color-brand-500);
        box-shadow: 0 0 0 2px rgba(var(--color-brand-rgb), 0.2);
    }

    ${media.mobile} {
        min-width: 10rem;
        font-size: 1.2rem;
        padding: 0.5rem 0.8rem;
    }
`;

function AchievementsFeed() {
    const feedContainerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Scroll state
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [newAchievementsCount, setNewAchievementsCount] = useState(0);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const prevGroupCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstGroupIdRef = useRef(null);

    // Get filter values from URL params
    const playerFilter = searchParams.get("player") || "all";
    const categoryFilter = searchParams.get("category") || "all";
    const timeFilter = searchParams.get("time") || "all";

    // Data hooks
    const {
        groupedAchievements,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useAchievementFeed();

    const {
        stats,
        leaderboard,
        isLoading: isLoadingStats,
    } = useAchievementFeedStats();
    const { categories } = useAchievementCategories();
    const { players } = usePlayers();

    // Filter options
    const playerOptions = [
        { value: "all", label: "All Players" },
        ...(players || []).map((p) => ({
            value: p.id.toString(),
            label: p.name,
        })),
    ];

    const categoryOptions = [
        { value: "all", label: "All Categories" },
        ...(categories || []).map((c) => ({
            value: c.id.toString(),
            label: c.name,
        })),
    ];

    const timeOptions = [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
    ];

    // Update filter params
    const handleFilterChange = useCallback(
        (field, value) => {
            const newParams = new URLSearchParams(searchParams);
            if (value === "all") {
                newParams.delete(field);
            } else {
                newParams.set(field, value);
            }
            setSearchParams(newParams);
        },
        [searchParams, setSearchParams]
    );

    // Clear search
    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    // Filter achievements based on current filters
    const filteredAchievements = useMemo(() => {
        if (!groupedAchievements?.length) return [];

        return groupedAchievements
            .map((group) => {
                // Filter players within each group
                const filteredPlayers = group.players
                    .map((playerGroup) => {
                        // Filter achievements within each player
                        const filteredPlayerAchievements =
                            playerGroup.achievements.filter((a) => {
                                // Category filter
                                if (
                                    categoryFilter !== "all" &&
                                    a.achievement?.category?.id?.toString() !==
                                        categoryFilter
                                ) {
                                    return false;
                                }

                                // Search filter
                                if (searchQuery) {
                                    const query = searchQuery.toLowerCase();
                                    const matchesName = a.achievement?.name
                                        ?.toLowerCase()
                                        .includes(query);
                                    const matchesDesc =
                                        a.achievement?.description
                                            ?.toLowerCase()
                                            .includes(query);
                                    if (!matchesName && !matchesDesc)
                                        return false;
                                }

                                // Time filter
                                if (timeFilter !== "all") {
                                    const unlockDate = new Date(a.unlockedAt);
                                    const now = new Date();
                                    if (timeFilter === "today") {
                                        const startOfDay = new Date(
                                            now.getFullYear(),
                                            now.getMonth(),
                                            now.getDate()
                                        );
                                        if (unlockDate < startOfDay)
                                            return false;
                                    } else if (timeFilter === "week") {
                                        const startOfWeek = new Date(now);
                                        startOfWeek.setDate(now.getDate() - 7);
                                        if (unlockDate < startOfWeek)
                                            return false;
                                    } else if (timeFilter === "month") {
                                        const startOfMonth = new Date(now);
                                        startOfMonth.setDate(
                                            now.getDate() - 30
                                        );
                                        if (unlockDate < startOfMonth)
                                            return false;
                                    }
                                }

                                return true;
                            });

                        if (filteredPlayerAchievements.length === 0)
                            return null;

                        return {
                            ...playerGroup,
                            achievements: filteredPlayerAchievements,
                        };
                    })
                    .filter(Boolean);

                // Player filter
                const finalPlayers =
                    playerFilter !== "all"
                        ? filteredPlayers.filter(
                              (p) => p.player?.id?.toString() === playerFilter
                          )
                        : filteredPlayers;

                if (finalPlayers.length === 0) return null;

                return {
                    ...group,
                    players: finalPlayers,
                };
            })
            .filter(Boolean);
    }, [
        groupedAchievements,
        playerFilter,
        categoryFilter,
        timeFilter,
        searchQuery,
    ]);

    // Track new achievements and auto-scroll
    useEffect(() => {
        if (!groupedAchievements?.length) return;

        const currentCount = groupedAchievements.length;
        const prevCount = prevGroupCountRef.current;
        const firstGroupId =
            groupedAchievements[0]?.matchId ||
            groupedAchievements[0]?.latestUnlockedAt;

        const isNewAchievement =
            prevCount > 0 &&
            currentCount > prevCount &&
            prevFirstGroupIdRef.current !== firstGroupId;

        if (isNewAchievement) {
            if (isNearBottomRef.current) {
                setTimeout(() => {
                    if (feedContainerRef.current) {
                        feedContainerRef.current.scrollTop = 0;
                    }
                }, 100);
            } else {
                setNewAchievementsCount((prev) => prev + 1);
            }
        }

        prevGroupCountRef.current = currentCount;
        prevFirstGroupIdRef.current = firstGroupId;
    }, [groupedAchievements]);

    // Handle scroll for showing/hiding jump to latest
    const handleScroll = useCallback(() => {
        if (!feedContainerRef.current) return;

        const { scrollTop } = feedContainerRef.current;
        const distanceFromBottom = Math.abs(scrollTop);
        const threshold = 200;

        isNearBottomRef.current = distanceFromBottom < threshold;

        if (distanceFromBottom > threshold) {
            setShowJumpToLatest(true);
        } else {
            setShowJumpToLatest(false);
            setNewAchievementsCount(0);
        }
    }, []);

    // Infinite scroll - load more when scrolling to top
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            {
                root: feedContainerRef.current,
                threshold: 0.1,
            }
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Initial scroll
    useEffect(() => {
        if (
            !isLoading &&
            groupedAchievements?.length &&
            !hasInitiallyScrolled
        ) {
            setHasInitiallyScrolled(true);
            if (feedContainerRef.current) {
                feedContainerRef.current.scrollTop = 0;
            }
        }
    }, [isLoading, groupedAchievements?.length, hasInitiallyScrolled]);

    function handleJumpToLatest() {
        if (feedContainerRef.current) {
            feedContainerRef.current.scrollTop = 0;
        }
        setShowJumpToLatest(false);
        setNewAchievementsCount(0);
    }

    // Mark groups with isNew flag
    const groupsWithNewFlag = useMemo(() => {
        return filteredAchievements.map((group) => ({
            ...group,
            isNew: group.players.some((p) =>
                p.achievements.some((a) => a.isNew)
            ),
        }));
    }, [filteredAchievements]);

    // Loading state
    if (isLoading) {
        return (
            <PageContainer>
                <LoadingSpinner />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            {/* Stats Column (Left on desktop, Top on mobile) */}
            <StatsColumn>
                {/* Statistics Section */}
                <StatsSection>
                    <StatsSectionTitle>
                        <HiOutlineTrophy />
                        Season Statistics
                    </StatsSectionTitle>
                    <StatsGrid>
                        <StatCard>
                            <StatValue>
                                {isLoadingStats
                                    ? "..."
                                    : stats?.todayCount || 0}
                            </StatValue>
                            <StatLabel>Today</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatValue>
                                {isLoadingStats ? "..." : stats?.weekCount || 0}
                            </StatValue>
                            <StatLabel>This Week</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatValue>
                                {isLoadingStats
                                    ? "..."
                                    : stats?.monthCount || 0}
                            </StatValue>
                            <StatLabel>This Month</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatValue>
                                {isLoadingStats
                                    ? "..."
                                    : stats?.totalCount || 0}
                            </StatValue>
                            <StatLabel>Season Total</StatLabel>
                        </StatCard>
                    </StatsGrid>
                </StatsSection>

                {/* Leaderboard Section */}
                {leaderboard?.length > 0 && (
                    <LeaderboardSection>
                        <LeaderboardTitle>
                            <HiOutlineSparkles />
                            Top Achievement Hunters
                        </LeaderboardTitle>
                        <LeaderboardList>
                            {leaderboard.map((entry, index) => (
                                <LeaderboardItem
                                    key={entry.playerId}
                                    $rank={index + 1}
                                >
                                    <LeaderboardRank $rank={index + 1}>
                                        #{index + 1}
                                    </LeaderboardRank>
                                    <LeaderboardPlayer>
                                        <Avatar
                                            src={entry.avatar || DEFAULT_AVATAR}
                                            $size="xs"
                                        />
                                        <LeaderboardName>
                                            {entry.playerName}
                                        </LeaderboardName>
                                    </LeaderboardPlayer>
                                    <LeaderboardCount>
                                        {entry.totalPoints} pts
                                    </LeaderboardCount>
                                </LeaderboardItem>
                            ))}
                        </LeaderboardList>
                    </LeaderboardSection>
                )}
            </StatsColumn>

            {/* Feed Column (Right on desktop, Bottom on mobile) */}
            <FeedColumn>
                {/* Filter Bar */}
                <FilterBar>
                    <FilterGroup>
                        <FilterLabel>Player:</FilterLabel>
                        <StyledSelect
                            value={playerFilter}
                            onChange={(e) =>
                                handleFilterChange("player", e.target.value)
                            }
                        >
                            {playerOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterLabel>Category:</FilterLabel>
                        <StyledSelect
                            value={categoryFilter}
                            onChange={(e) =>
                                handleFilterChange("category", e.target.value)
                            }
                        >
                            {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </StyledSelect>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterLabel>Time:</FilterLabel>
                        <StyledSelect
                            value={timeFilter}
                            onChange={(e) =>
                                handleFilterChange("time", e.target.value)
                            }
                        >
                            {timeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </StyledSelect>
                    </FilterGroup>

                    <SearchInput>
                        <HiOutlineMagnifyingGlass />
                        <input
                            type="text"
                            placeholder="Search achievements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <ClearButton onClick={handleClearSearch}>
                                <HiXMark />
                            </ClearButton>
                        )}
                    </SearchInput>

                    <LiveIndicator>
                        <LiveDot />
                        Live
                    </LiveIndicator>
                </FilterBar>

                {/* Feed Content */}
                <ContentWrapper>
                    {!filteredAchievements?.length ? (
                        <EmptyState>
                            <HiOutlineTrophy />
                            <EmptyText>
                                {searchQuery ||
                                playerFilter !== "all" ||
                                categoryFilter !== "all" ||
                                timeFilter !== "all"
                                    ? "No achievements match your filters."
                                    : "No achievements unlocked in this season yet."}
                            </EmptyText>
                        </EmptyState>
                    ) : (
                        <FeedContainer
                            ref={feedContainerRef}
                            onScroll={handleScroll}
                        >
                            <LoadMoreTrigger ref={loadMoreRef}>
                                {isFetchingNextPage && <SpinnerMini />}
                                {!isFetchingNextPage &&
                                    hasNextPage &&
                                    "Scroll for more..."}
                            </LoadMoreTrigger>

                            {groupsWithNewFlag.map((group) => (
                                <AchievementTickerItem
                                    key={
                                        group.matchId || group.latestUnlockedAt
                                    }
                                    group={group}
                                    isNew={group.isNew}
                                />
                            ))}
                        </FeedContainer>
                    )}

                    {showJumpToLatest && (
                        <JumpToLatestButton onClick={handleJumpToLatest}>
                            <HiChevronDoubleDown />
                            {newAchievementsCount > 0 && (
                                <NewAchievementsBadge>
                                    {newAchievementsCount}
                                </NewAchievementsBadge>
                            )}
                        </JumpToLatestButton>
                    )}
                </ContentWrapper>
            </FeedColumn>
        </PageContainer>
    );
}

export default AchievementsFeed;
