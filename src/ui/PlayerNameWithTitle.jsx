import styled from "styled-components";
import PlayerName from "./PlayerName";
import { usePlayerWithRewards } from "../features/achievements/usePlayerRewards";

const NameContainer = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
`;

const Title = styled.span`
    font-size: inherit;
    font-weight: 500;
    color: var(--color-brand-600);
`;

/**
 * PlayerNameWithTitle - Displays a player name with their selected title
 *
 * Automatically fetches the player's selected title and displays it if available.
 * Title display can be disabled via showTitle prop.
 *
 * @param {Object} props
 * @param {string} props.to - Link destination (usually /user/username/profile)
 * @param {string} props.name - Player name to display
 * @param {number} props.playerId - Player ID to fetch rewards for
 * @param {boolean} props.showTitle - Whether to show the title (default: true)
 * @param {React.ReactNode} props.children - Children (used if no name prop)
 */
function PlayerNameWithTitle({
    to,
    name,
    playerId,
    showTitle = true,
    asText = false,
    children,
    ...props
}) {
    // Fetch player's selected rewards
    const { title } = usePlayerWithRewards(showTitle ? playerId : null);

    const displayName = name || children;

    // If no title, showTitle is false, or title not selected, render simple PlayerName
    if (!showTitle || !title?.displayValue) {
        // asText mode: render just the name without any Link wrapper
        if (asText) {
            return <span {...props}>{displayName}</span>;
        }
        return (
            <PlayerName to={to} {...props}>
                {displayName}
            </PlayerName>
        );
    }

    const { displayValue, displayPosition } = title;

    // asText mode: render name and title without any Link wrapper
    if (asText) {
        if (displayPosition === "prefix") {
            return (
                <span {...props}>
                    {displayValue} {displayName}
                </span>
            );
        }
        return (
            <span {...props}>
                {displayName}, {displayValue}
            </span>
        );
    }

    // Render with title based on position
    if (displayPosition === "prefix") {
        // "Title Name" format (e.g., "Carry John")
        return (
            <NameContainer>
                <Title>{displayValue}</Title>
                <PlayerName to={to} {...props}>
                    {displayName}
                </PlayerName>
            </NameContainer>
        );
    }

    // "Name, Title" format (e.g., "John, the Giant Slayer")
    return (
        <NameContainer>
            <PlayerName to={to} {...props}>
                {displayName}
            </PlayerName>
            <Title>, {displayValue}</Title>
        </NameContainer>
    );
}

export default PlayerNameWithTitle;
