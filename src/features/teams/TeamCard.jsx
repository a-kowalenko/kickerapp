import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import {
    DEFAULT_AVATAR,
    media,
    TEAM_STATUS_DISSOLVED,
} from "../../utils/constants";

/* ----------------------------------------
   MMR Color Helpers (same as RankingsRow)
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

const CardContainer = styled(Link)`
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 1.6rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    transition: all 0.2s ease;
    text-decoration: none;
    color: inherit;

    &:hover {
        background-color: var(--tertiary-background-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    ${(props) =>
        props.$dissolved &&
        css`
            opacity: 0.6;
            background-color: var(--tertiary-background-color);

            &:hover {
                opacity: 0.8;
            }
        `}

    ${media.mobile} {
        padding: 1.2rem;
        gap: 1.2rem;
    }
`;

const TeamLogoContainer = styled.div`
    position: relative;
    flex-shrink: 0;
`;

const TeamLogo = styled.img`
    width: 6rem;
    height: 6rem;
    border-radius: var(--border-radius-md);
    object-fit: cover;
    border: 2px solid var(--primary-border-color);

    ${media.mobile} {
        width: 5rem;
        height: 5rem;
    }
`;

const DefaultLogo = styled.div`
    width: 6rem;
    height: 6rem;
    border-radius: var(--border-radius-md);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--color-brand-600);
    border: 2px solid var(--primary-border-color);

    ${media.mobile} {
        width: 5rem;
        height: 5rem;
        font-size: 2rem;
    }
`;

const TeamInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
    min-width: 0;
`;

const TeamName = styled.h3`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const PlayersRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const PlayerAvatars = styled.div`
    display: flex;
    align-items: center;

    & > *:not(:first-child) {
        margin-left: -0.8rem;
    }
`;

const PlayerNames = styled.span`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const StatsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
    flex-shrink: 0;
`;

const MmrValue = styled.span`
    font-family: "Sono";
    font-size: 1.8rem;
    font-weight: 600;
    color: ${(props) => props.$color};

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const WinLoss = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const DissolvedBadge = styled.span`
    font-size: 1rem;
    padding: 0.2rem 0.6rem;
    background-color: var(--tertiary-background-color);
    color: var(--secondary-text-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    text-transform: uppercase;
    font-weight: 600;
`;

const RankBadge = styled.span`
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--secondary-text-color);
    min-width: 3rem;
    text-align: center;

    ${media.mobile} {
        font-size: 1.2rem;
        min-width: 2.4rem;
    }
`;

function TeamCard({ team, rank, showRank = false }) {
    const {
        id,
        name,
        logo_url,
        player1_name,
        player1_avatar,
        player2_name,
        player2_avatar,
        status,
        mmr,
        wins,
        losses,
    } = team;

    const isDissolved = status === TEAM_STATUS_DISSOLVED;
    const mmrColor = getMmrColor(mmr);
    const initials = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <CardContainer to={`/team/${id}`} $dissolved={isDissolved}>
            {showRank && <RankBadge>#{rank}</RankBadge>}

            <TeamLogoContainer>
                {logo_url ? (
                    <TeamLogo src={logo_url} alt={name} />
                ) : (
                    <DefaultLogo>{initials}</DefaultLogo>
                )}
            </TeamLogoContainer>

            <TeamInfo>
                <TeamName>{name}</TeamName>
                <PlayersRow>
                    <PlayerAvatars>
                        <Avatar
                            $size="xs"
                            src={player1_avatar || DEFAULT_AVATAR}
                        />
                        <Avatar
                            $size="xs"
                            src={player2_avatar || DEFAULT_AVATAR}
                        />
                    </PlayerAvatars>
                    <PlayerNames>
                        {player1_name} & {player2_name}
                    </PlayerNames>
                </PlayersRow>
            </TeamInfo>

            <StatsContainer>
                {isDissolved ? (
                    <DissolvedBadge>Dissolved</DissolvedBadge>
                ) : (
                    <>
                        <MmrValue $color={mmrColor}>{mmr}</MmrValue>
                        <WinLoss>
                            {wins}W - {losses}L
                        </WinLoss>
                    </>
                )}
            </StatsContainer>
        </CardContainer>
    );
}

export default TeamCard;
