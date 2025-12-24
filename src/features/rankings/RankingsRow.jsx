import styled, { css } from "styled-components";
import Table from "../../ui/Table";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR } from "../../utils/constants";
import PlayerName from "../../ui/PlayerName";
import { usePlayerStatusForAvatar } from "../players/usePlayerStatus";
import useWindowWidth from "../../hooks/useWindowWidth";

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
                <span>{mmr}</span>
            </Stat>
        </StyledRow>
    );
}

export default RankingsRow;
