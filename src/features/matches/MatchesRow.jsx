import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import {
    DEFAULT_AVATAR,
    GAMEMODE_TEAM,
    MATCH_ACTIVE,
    MATCH_ENDED,
    media,
} from "../../utils/constants";
import PlayerName from "../../ui/PlayerName";
import { useNavigate } from "react-router-dom";
import useWindowWidth from "../../hooks/useWindowWidth";

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);

    ${media.mobile} {
        font-weight: 600;
        font-size: 1.4rem;
        min-width: 1.6rem;
    }
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
    text-align: center;
`;

const ScoreContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.2rem;

    ${media.tablet} {
        gap: 0.6rem;
    }
`;

const Score = styled.div`
    display: flex;
    font-weight: 600;
    min-width: 2rem;
    align-items: center;
    justify-content: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};

    ${media.tablet} {
        font-weight: 600;
        font-size: 1.4rem;
        min-width: 1.6rem;
    }
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};

    & a {
        color: ${(props) =>
            props.$won === null
                ? "var(--primary-text-color)"
                : props.$won === true
                  ? "var(--winner-name-color)"
                  : "var(--loser-name-color)"};
    }
`;

const BountyBadge = styled.span`
    color: var(--color-yellow-600);
    font-size: 1.2rem;
`;

const GameModeContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const StartTimeContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const DurationContainer = styled.div`
    display: flex;
`;

const TeamName = styled.span`
    display: flex;
    flex-direction: row;
    font-weight: 600;
    font-size: 1.6rem;

    color: ${(props) =>
        props.$won === null
            ? "var(--primary-text-color)"
            : props.$won === true
              ? "var(--winner-name-color)"
              : "var(--loser-name-color)"};
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }

    ${media.mobile} {
        flex-direction: column;
        font-size: 1.4rem;
    }
`;

const Name = styled.span`
    display: flex;
    padding: 0 0.4rem 0 0;

    ${media.mobile} {
        flex-wrap: nowrap;
    }
`;
const MMRValues = styled.span`
    display: flex;
    align-items: center;
    justify-content: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};
`;

const TeamLogoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-direction: ${(props) => (props.$team === "1" ? "row-reverse" : "row")};
`;

const TeamLogo = styled.img`
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--border-radius-sm);
    object-fit: cover;
    border: 1px solid var(--color-grey-300);
`;

const DefaultTeamLogo = styled.div`
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--border-radius-sm);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-brand-700);
    border: 1px solid var(--color-grey-300);
`;

const MmrChange = styled.span`
    font-size: 1.6rem;
    color: ${(props) =>
        props.$positive
            ? "var(--winner-name-color)"
            : "var(--loser-name-color)"};

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

function MatchesRow({ match }) {
    const navigate = useNavigate();
    const { player1, player2, player3, player4, team1, team2 } = match;
    const { isDesktop } = useWindowWidth();
    const isTeamMatch = match.gamemode === GAMEMODE_TEAM && team1 && team2;

    const gameMode =
        !player3 && !player4
            ? "1 on 1"
            : !player3
              ? "1 on 2"
              : !player4
                ? "2 on 1"
                : "2 on 2";

    const team1Won =
        match.status !== MATCH_ENDED
            ? null
            : match.scoreTeam1 > match.scoreTeam2;

    function handleClickRow(e) {
        e.stopPropagation();
        navigate(`/matches/${match.id}`);
    }

    function handleTeamClick(e, teamId) {
        e.stopPropagation();
        navigate(`/team/${teamId}`);
    }

    // Render team match display
    if (isTeamMatch) {
        // Calculate pre-match MMR for teams (current MMR - change = pre-match MMR)
        const team1PreMatchMmr =
            team1.mmr && match.mmrChangeTeam1
                ? Math.round(team1.mmr - match.mmrChangeTeam1)
                : null;
        const team2PreMatchMmr =
            team2.mmr && match.mmrChangeTeam2
                ? Math.round(team2.mmr - match.mmrChangeTeam2)
                : null;

        return (
            <Table.Row onClick={handleClickRow}>
                <Rank>{match.nr}</Rank>

                <TeamContainer $won={team1Won} $team="1">
                    <TeamLogoContainer $team="1">
                        {isDesktop &&
                            (team1.logo_url ? (
                                <TeamLogo
                                    src={team1.logo_url}
                                    alt={team1.name}
                                />
                            ) : (
                                <DefaultTeamLogo>
                                    {team1.name?.charAt(0)?.toUpperCase()}
                                </DefaultTeamLogo>
                            ))}
                        <TeamName
                            $won={team1Won}
                            onClick={(e) => handleTeamClick(e, team1.id)}
                        >
                            <Name>{team1.name}</Name>
                            <MMRValues $team="1">
                                {match.mmrChangeTeam1 && team1PreMatchMmr && (
                                    <>
                                        ({team1PreMatchMmr})
                                        <MmrChange $positive={team1Won}>
                                            {team1Won ? "+" : ""}
                                            {match.mmrChangeTeam1}
                                        </MmrChange>
                                    </>
                                )}
                                {team1Won && match.bounty_team1_team > 0 && (
                                    <BountyBadge>
                                        +{match.bounty_team1_team}💰
                                    </BountyBadge>
                                )}
                            </MMRValues>
                        </TeamName>
                    </TeamLogoContainer>
                </TeamContainer>

                <ScoreContainer>
                    <Score $team="1">{match.scoreTeam1}</Score>
                    &mdash;
                    <Score $team="2">{match.scoreTeam2}</Score>
                </ScoreContainer>

                <TeamContainer
                    $won={team1Won === null ? null : !team1Won}
                    $team="2"
                >
                    <TeamLogoContainer $team="2">
                        {isDesktop &&
                            (team2.logo_url ? (
                                <TeamLogo
                                    src={team2.logo_url}
                                    alt={team2.name}
                                />
                            ) : (
                                <DefaultTeamLogo>
                                    {team2.name?.charAt(0)?.toUpperCase()}
                                </DefaultTeamLogo>
                            ))}
                        <TeamName
                            $won={team1Won === null ? null : !team1Won}
                            onClick={(e) => handleTeamClick(e, team2.id)}
                        >
                            <Name>{team2.name}</Name>
                            <MMRValues $team="2">
                                {match.mmrChangeTeam2 && team2PreMatchMmr && (
                                    <>
                                        ({team2PreMatchMmr})
                                        <MmrChange $positive={!team1Won}>
                                            {!team1Won ? "+" : ""}
                                            {match.mmrChangeTeam2}
                                        </MmrChange>
                                    </>
                                )}
                                {!team1Won && match.bounty_team2_team > 0 && (
                                    <BountyBadge>
                                        +{match.bounty_team2_team}💰
                                    </BountyBadge>
                                )}
                            </MMRValues>
                        </TeamName>
                    </TeamLogoContainer>
                </TeamContainer>

                {isDesktop && (
                    <GameModeContainer>
                        <span>Team</span>
                    </GameModeContainer>
                )}

                {isDesktop && (
                    <StartTimeContainer>
                        <span>
                            {format(
                                new Date(match.start_time),
                                "dd.MM.yyyy - HH:mm"
                            )}
                        </span>
                    </StartTimeContainer>
                )}

                {isDesktop && (
                    <DurationContainer>
                        {match.end_time && (
                            <span>
                                {format(
                                    new Date(match.end_time) -
                                        new Date(match.start_time),
                                    "mm:ss"
                                )}
                            </span>
                        )}
                        {match.status === MATCH_ACTIVE && (
                            <span>IS ACTIVE</span>
                        )}
                    </DurationContainer>
                )}
            </Table.Row>
        );
    }

    return (
        <Table.Row onClick={handleClickRow}>
            <Rank>{match.nr}</Rank>

            <TeamContainer $won={team1Won} $team="1">
                <PlayerName
                    to={`/user/${player1.name}/profile`}
                    onClick={handleClickRow}
                >
                    <span>{player1.name}</span>
                    {match.mmrChangeTeam1 && match.mmrPlayer1 && (
                        <span>
                            ({match.mmrPlayer1}){team1Won ? "+" : ""}
                            {match.mmrChangeTeam1}
                            {team1Won && match.bounty_team1 > 0 && (
                                <BountyBadge>
                                    +
                                    {player3
                                        ? Math.floor(match.bounty_team1 / 2)
                                        : match.bounty_team1}
                                    💰
                                </BountyBadge>
                            )}
                        </span>
                    )}
                    {isDesktop && (
                        <Avatar
                            $size="small"
                            src={player1.avatar || DEFAULT_AVATAR}
                        />
                    )}
                </PlayerName>
                {player3 && (
                    <PlayerName
                        to={`/user/${player3.name}/profile`}
                        onClick={handleClickRow}
                    >
                        <span>{player3?.name}</span>
                        {match.mmrChangeTeam1 && match.mmrPlayer3 && (
                            <span>
                                ({match.mmrPlayer3}){team1Won ? "+" : ""}
                                {match.mmrChangeTeam1}
                                {team1Won && match.bounty_team1 > 0 && (
                                    <BountyBadge>
                                        +{Math.floor(match.bounty_team1 / 2)}💰
                                    </BountyBadge>
                                )}
                            </span>
                        )}
                        {isDesktop && (
                            <Avatar
                                $size="small"
                                src={player3.avatar || DEFAULT_AVATAR}
                            />
                        )}
                    </PlayerName>
                )}
            </TeamContainer>

            <ScoreContainer>
                <Score $team="1">{match.scoreTeam1}</Score>
                &mdash;
                <Score $team="2">{match.scoreTeam2}</Score>
            </ScoreContainer>

            <TeamContainer
                $won={team1Won === null ? null : !team1Won}
                $team="2"
            >
                <PlayerName
                    to={`/user/${player2.name}/profile`}
                    onClick={handleClickRow}
                >
                    {isDesktop && (
                        <Avatar
                            $size="small"
                            src={player2.avatar || DEFAULT_AVATAR}
                        />
                    )}
                    <span>{player2.name}</span>
                    {match.mmrChangeTeam2 && match.mmrPlayer2 && (
                        <span>
                            ({match.mmrPlayer2}){team1Won ? "" : "+"}
                            {match.mmrChangeTeam2}
                            {!team1Won && match.bounty_team2 > 0 && (
                                <BountyBadge>
                                    +
                                    {player4
                                        ? Math.floor(match.bounty_team2 / 2)
                                        : match.bounty_team2}
                                    💰
                                </BountyBadge>
                            )}
                        </span>
                    )}
                </PlayerName>
                {player4 && (
                    <PlayerName
                        to={`/user/${player4.name}/profile`}
                        onClick={handleClickRow}
                    >
                        {isDesktop && (
                            <Avatar
                                $size="small"
                                src={player4?.avatar || DEFAULT_AVATAR}
                            />
                        )}
                        <span>{player4.name}</span>
                        {match.mmrChangeTeam2 && match.mmrPlayer4 && (
                            <span>
                                ({match.mmrPlayer4}){team1Won ? "" : "+"}
                                {match.mmrChangeTeam2}
                                {!team1Won && match.bounty_team2 > 0 && (
                                    <BountyBadge>
                                        +{Math.floor(match.bounty_team2 / 2)}💰
                                    </BountyBadge>
                                )}
                            </span>
                        )}
                    </PlayerName>
                )}
            </TeamContainer>

            {isDesktop && (
                <GameModeContainer>
                    <span>{gameMode}</span>
                </GameModeContainer>
            )}

            {isDesktop && (
                <StartTimeContainer>
                    <span>
                        {format(
                            new Date(match.start_time),
                            "dd.MM.yyyy - HH:mm"
                        )}
                    </span>
                </StartTimeContainer>
            )}

            {isDesktop && (
                <DurationContainer>
                    {match.end_time && (
                        <span>
                            {format(
                                new Date(match.end_time) -
                                    new Date(match.start_time),
                                "mm:ss"
                            )}
                        </span>
                    )}
                    {match.status === MATCH_ACTIVE && <span>IS ACTIVE</span>}
                </DurationContainer>
            )}
        </Table.Row>
    );
}

export default MatchesRow;
