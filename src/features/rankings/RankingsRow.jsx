import styled, { css, keyframes } from "styled-components";
import Table from "../../ui/Table";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR, media } from "../../utils/constants";
import PlayerName from "../../ui/PlayerName";
import { usePlayerStatusForAvatar } from "../players/usePlayerStatus";
import useWindowWidth from "../../hooks/useWindowWidth";

/* ----------------------------------------
   MMR Color Helpers (CS2-inspired)
----------------------------------------- */
const getMmrColor = (mmr) => {
    if (mmr >= 1500) return "var(--mmr-gold)";
    if (mmr >= 1400) return "var(--mmr-red)";
    if (mmr >= 1300) return "var(--mmr-pink)";
    if (mmr >= 1100) return "var(--mmr-purple)";
    if (mmr >= 900) return "var(--mmr-blue)";
    if (mmr >= 700) return "var(--mmr-cyan)";
    return "var(--mmr-grey)";
};

const getMmrGlow = (mmr) => {
    if (mmr >= 1500) return "0 0 8px rgba(255, 215, 0, 0.5)";
    if (mmr >= 1400) return "0 0 6px rgba(255, 59, 59, 0.4)";
    if (mmr >= 1300) return "0 0 5px rgba(255, 75, 199, 0.35)";
    return "none";
};

/* ----------------------------------------
   Gold Shimmer Animation
----------------------------------------- */
const goldShimmer = keyframes`
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
`;

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);

    ${(props) =>
        props.$isUnranked &&
        css`
            color: var(--color-grey-400);
            font-style: italic;
        `}
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
    text-align: center;

    ${(props) =>
        props.$isUnranked &&
        css`
            color: var(--color-grey-400);
        `}
`;

const StyledRow = styled(Table.Row)`
    ${(props) =>
        props.$isUnranked &&
        css`
            opacity: 0.7;
            background-color: var(--color-grey-50);
        `}
`;

const MmrValue = styled.span`
    color: ${(props) => props.$color};
    font-weight: 600;

    /* Glow only on desktop */
    ${(props) =>
        props.$glow !== "none" &&
        css`
            ${media.desktop} {
                text-shadow: ${props.$glow};
            }
        `}

    /* Gold Shimmer Animation - desktop only */
    ${(props) =>
        props.$isGold &&
        css`
            ${media.desktop} {
                background: linear-gradient(
                    90deg,
                    var(--mmr-gold) 0%,
                    var(--mmr-gold-light) 25%,
                    var(--mmr-gold) 50%,
                    var(--mmr-gold-light) 75%,
                    var(--mmr-gold) 100%
                );
                background-size: 200% auto;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: ${goldShimmer} 3s linear infinite;
            }
        `}
`;

function RankingsRow({ player, gamemode }) {
    const wins = gamemode === "1on1" ? player.wins : player.wins2on2;
    const losses = gamemode === "1on1" ? player.losses : player.losses2on2;
    const mmr = gamemode === "1on1" ? player.mmr : player.mmr2on2;
    const isUnranked = player.isUnranked;

    // Load bounty data - filter by selected gamemode
    const { bounty1on1, bounty2on2 } = usePlayerStatusForAvatar(player.id);
    const { isDesktop } = useWindowWidth();

    // Only show bounty for the filtered gamemode
    const bountyData = {
        bounty1on1: gamemode === "1on1" ? bounty1on1 : 0,
        bounty2on2: gamemode === "2on2" ? bounty2on2 : 0,
    };

    const totalGames = wins + losses;
    const winrate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
    return (
        <StyledRow $isUnranked={isUnranked}>
            <Rank $isUnranked={isUnranked}>
                {isUnranked ? "-" : player.rank}
            </Rank>

            <PlayerName to={`/user/${player.name}/profile`}>
                <Avatar
                    $size={isDesktop ? "small" : "xs"}
                    src={player.avatar || DEFAULT_AVATAR}
                    bountyData={bountyData}
                />
                <span>{player.name}</span>
            </PlayerName>

            <Stat $isUnranked={isUnranked}>
                <span>{wins}</span>
            </Stat>

            <Stat $isUnranked={isUnranked}>
                <span>{losses}</span>
            </Stat>

            <Stat $isUnranked={isUnranked}>
                <span>{totalGames}</span>
            </Stat>

            <Stat $isUnranked={isUnranked}>
                <span>{winrate}%</span>
            </Stat>

            <Stat $isUnranked={isUnranked}>
                <MmrValue
                    $color={
                        isUnranked ? "var(--color-grey-400)" : getMmrColor(mmr)
                    }
                    $glow={isUnranked ? "none" : getMmrGlow(mmr)}
                    $isGold={!isUnranked && mmr >= 1500}
                >
                    {mmr}
                </MmrValue>
            </Stat>
        </StyledRow>
    );
}

export default RankingsRow;
