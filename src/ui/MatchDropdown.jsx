import styled from "styled-components";
import { useMemo } from "react";
import { HiTrophy } from "react-icons/hi2";
import { useQuery } from "react-query";
import { searchMatches, formatMatchDisplay } from "../services/apiMatches";
import { useKicker } from "../contexts/KickerContext";
import SpinnerMini from "./SpinnerMini";

const Dropdown = styled.div`
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    max-height: 20rem;
    overflow-y: auto;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
`;

const MatchItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover,
    &.active {
        background-color: var(--tertiary-background-color);
    }
`;

const MatchIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.8rem;
    height: 2.8rem;
    background-color: rgba(249, 115, 22, 0.1);
    color: var(--color-orange-500, #f97316);
    border-radius: var(--border-radius-sm);

    & svg {
        font-size: 1.4rem;
    }
`;

const MatchInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
`;

const MatchNumber = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const MatchPlayers = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const MatchScore = styled.span`
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--tertiary-text-color);
    white-space: nowrap;
`;

const LoadingItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: var(--tertiary-text-color);
`;

const EmptyItem = styled.div`
    padding: 1rem;
    text-align: center;
    color: var(--tertiary-text-color);
    font-size: 1.3rem;
`;

const HintText = styled.div`
    padding: 0.6rem 1rem;
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    border-bottom: 1px solid var(--primary-border-color);
`;

function MatchDropdown({ search, selectedIndex, onSelect }) {
    const { currentKicker: kicker } = useKicker();

    // Query for matches based on search
    const {
        data: matches = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["searchMatches", kicker, search],
        queryFn: () =>
            searchMatches({ query: search || "", kicker, limit: 10 }),
        enabled: !!kicker, // Only run query when kicker is available
        staleTime: 1000 * 30, // 30 seconds
        retry: 1,
    });

    // Format matches for display
    const formattedMatches = useMemo(() => {
        return matches.map((match) => ({
            ...match,
            display: formatMatchDisplay(match),
            team1: match.player3
                ? `${match.player1?.name} & ${match.player3?.name}`
                : match.player1?.name,
            team2: match.player4
                ? `${match.player2?.name} & ${match.player4?.name}`
                : match.player2?.name,
        }));
    }, [matches]);

    if (isLoading) {
        return (
            <Dropdown>
                <LoadingItem>
                    <SpinnerMini />
                </LoadingItem>
            </Dropdown>
        );
    }

    if (error) {
        return (
            <Dropdown>
                <EmptyItem>Error loading matches</EmptyItem>
            </Dropdown>
        );
    }

    return (
        <Dropdown>
            <HintText>Type match number or player name to search</HintText>
            {formattedMatches.length > 0 ? (
                formattedMatches.map((match, index) => (
                    <MatchItem
                        key={match.id}
                        className={index === selectedIndex ? "active" : ""}
                        onClick={() => onSelect(match, match.display)}
                    >
                        <MatchIcon>
                            <HiTrophy />
                        </MatchIcon>
                        <MatchInfo>
                            <MatchNumber>Match {match.nr}</MatchNumber>
                            <MatchPlayers>
                                {match.team1} vs {match.team2}
                            </MatchPlayers>
                        </MatchInfo>
                        <MatchScore>
                            {match.scoreTeam1} : {match.scoreTeam2}
                        </MatchScore>
                    </MatchItem>
                ))
            ) : (
                <EmptyItem>
                    {search ? "No matches found" : "No recent matches"}
                </EmptyItem>
            )}
        </Dropdown>
    );
}

export default MatchDropdown;
