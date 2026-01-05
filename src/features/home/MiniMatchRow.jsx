import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import PlayerName from "../../ui/PlayerName";
import useWindowWidth from "../../hooks/useWindowWidth";
import {
    GAMEMODE_TEAM,
    MATCH_ACTIVE,
    MATCH_ENDED,
    media,
} from "../../utils/constants";

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease-in-out;

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

const TeamName = styled.span`
    font-weight: 600;
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
`;

const MmrChange = styled.span`
    font-size: 1.2rem;
    margin-left: 0.4rem;
    color: ${(props) =>
        props.$positive
            ? "var(--winner-name-color)"
            : "var(--loser-name-color)"};
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

const DurationContainer = styled.div`
    display: flex;
    align-items: center;

    @media screen and (max-width: 900px) {
        justify-content: center;
    }
`;

const BountyBadge = styled.span`
    color: var(--color-yellow-600);
    font-size: 1.2rem;
    margin-left: 0.4rem;
`;

const TeamModeBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    padding: 0.2rem 0.5rem;
    background-color: var(--color-purple-100, #ede9fe);
    color: var(--color-purple-700, #6d28d9);
    border-radius: 0.4rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-left: 0.6rem;

    ${media.mobile} {
        font-size: 0.9rem;
        padding: 0.15rem 0.4rem;
    }
`;

function MiniMatchRow({ match }) {
    const { player1, player2, player3, player4, team1, team2 } = match;
    const navigate = useNavigate();
    const isTeamMatch = match.gamemode === GAMEMODE_TEAM && team1 && team2;
    const team1Won =
        match.status !== MATCH_ENDED
            ? null
            : match.scoreTeam1 > match.scoreTeam2;
    const { windowWidth } = useWindowWidth();
    const showStartTime = windowWidth > 1350;
    const showDuration = windowWidth > 768;
    const showId = windowWidth > 650;

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
        return (
            <MiniTable.Row onClick={handleClickRow} isTeamMatch={true}>
                {showId && <div>{match.nr}</div>}
                <TeamContainer $won={team1Won} $team="1">
                    <TeamName
                        $won={team1Won}
                        onClick={(e) => handleTeamClick(e, team1.id)}
                    >
                        {team1.name}
                        {match.mmrChangeTeam1 && (
                            <MmrChange $positive={team1Won}>
                                {team1Won ? "+" : ""}
                                {match.mmrChangeTeam1}
                            </MmrChange>
                        )}
                        {team1Won && match.bounty_team1_team > 0 && (
                            <BountyBadge>
                                +{match.bounty_team1_team}💰
                            </BountyBadge>
                        )}
                    </TeamName>
                </TeamContainer>

                <ScoreContainer>
                    <Score $team="1">{match.scoreTeam1}</Score>
                    &mdash;
                    <Score $team="2">{match.scoreTeam2}</Score>
                    <TeamModeBadge>Team</TeamModeBadge>
                </ScoreContainer>

                <TeamContainer
                    $won={team1Won === null ? null : !team1Won}
                    $team="2"
                >
                    <TeamName
                        $won={team1Won === null ? null : !team1Won}
                        onClick={(e) => handleTeamClick(e, team2.id)}
                    >
                        {team2.name}
                        {match.mmrChangeTeam2 && (
                            <MmrChange $positive={!team1Won}>
                                {!team1Won ? "+" : ""}
                                {match.mmrChangeTeam2}
                            </MmrChange>
                        )}
                        {!team1Won && match.bounty_team2_team > 0 && (
                            <BountyBadge>
                                +{match.bounty_team2_team}💰
                            </BountyBadge>
                        )}
                    </TeamName>
                </TeamContainer>
                {showStartTime && (
                    <div>
                        {format(
                            new Date(match.start_time),
                            "dd.MM.yyyy - HH:mm"
                        )}
                    </div>
                )}
                {showDuration && (
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
                            <span>Is active</span>
                        )}
                    </DurationContainer>
                )}
            </MiniTable.Row>
        );
    }

    // Render regular match display
    return (
        <MiniTable.Row onClick={handleClickRow}>
            {showId && <div>{match.nr}</div>}
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
            {showStartTime && (
                <div>
                    {format(new Date(match.start_time), "dd.MM.yyyy - HH:mm")}
                </div>
            )}
            {showDuration && (
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
                    {match.status === MATCH_ACTIVE && <span>Is active</span>}
                </DurationContainer>
            )}
        </MiniTable.Row>
    );
}

export default MiniMatchRow;
