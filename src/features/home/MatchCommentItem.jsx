import styled from "styled-components";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import Comment from "../matches/Comment";

const CommentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
    border-radius: var(--border-radius-md);
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    &.highlight {
        animation: highlightPulse 2s ease-out;
    }

    @keyframes highlightPulse {
        0% {
            background-color: var(--primary-button-color-light);
        }
        100% {
            background-color: transparent;
        }
    }
`;

const MatchLabel = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 1rem;
    padding-left: 4.8rem;
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: var(--primary-button-color);
        text-decoration: underline;
    }
`;

const MatchInfo = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;
`;

const TeamNames = styled.span`
    font-weight: 500;
`;

const Score = styled.span`
    color: var(--secondary-text-color);
`;

const MatchDate = styled.span`
    &::before {
        content: "–";
        margin-right: 0.4rem;
    }
`;

/**
 * Helper to format team names from match data
 * Match uses player1, player2 (team 1) and player3, player4 (team 2)
 */
function formatTeamNames(match) {
    if (!match) return { team1: "Unknown", team2: "Unknown" };

    const team1 = [match.player1?.name, match.player3?.name]
        .filter(Boolean)
        .join(" & ");

    const team2 = [match.player2?.name, match.player4?.name]
        .filter(Boolean)
        .join(" & ");

    return { team1: team1 || "Team 1", team2: team2 || "Team 2" };
}

function MatchCommentItem({
    comment,
    currentPlayerId,
    commentReactions,
    onToggleReaction,
    isTogglingReaction,
    isGrouped = false,
    showMatchLabel = true,
}) {
    const { team1, team2 } = formatTeamNames(comment.match);
    const matchDate = comment.match?.created_at
        ? format(new Date(comment.match.created_at), "dd.MM.yyyy")
        : "";

    // Build the link to the match with comment anchor
    const matchLink = `/matches/${comment.match_id}#comment-${comment.id}`;

    return (
        <CommentWrapper data-comment-id={comment.id}>
            {/* Match label - show when not grouped or when match changes */}
            {showMatchLabel && !isGrouped && (
                <MatchLabel to={matchLink}>
                    <MatchInfo>
                        <TeamNames>
                            {team1} vs {team2}
                        </TeamNames>
                        {comment.match?.scoreTeam1 !== undefined && (
                            <Score>
                                ({comment.match.scoreTeam1}:
                                {comment.match.scoreTeam2})
                            </Score>
                        )}
                        <MatchDate>{matchDate}</MatchDate>
                    </MatchInfo>
                </MatchLabel>
            )}

            {/* The comment itself - read-only (no edit/delete) */}
            <Comment
                comment={comment}
                currentPlayerId={currentPlayerId}
                isAdmin={false} // Disable delete in this view
                onUpdate={() => {}} // No-op
                onDelete={() => {}} // No-op
                isUpdating={false}
                isDeleting={false}
                commentReactions={commentReactions}
                onToggleReaction={onToggleReaction}
                isTogglingReaction={isTogglingReaction}
                isGrouped={isGrouped}
                disableHover={true}
            />
        </CommentWrapper>
    );
}

export default MatchCommentItem;
