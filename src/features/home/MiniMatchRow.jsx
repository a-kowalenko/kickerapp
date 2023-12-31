import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import PlayerName from "../../ui/PlayerName";
import useWindowWidth from "../../hooks/useWindowWidth";
import { MATCH_ACTIVE, MATCH_ENDED, media } from "../../utils/constants";

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

function MiniMatchRow({ match }) {
    const { player1, player2, player3, player4 } = match;
    const navigate = useNavigate();
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
