import {
    HiArrowDownTray,
    HiArrowUturnLeft,
    HiMinusCircle,
    HiPlusCircle,
} from "react-icons/hi2";
import styled from "styled-components";
import ContentBox from "../../ui/ContentBox";

const RulesContainer = styled(ContentBox)``;

const Title = styled.h2`
    color: var(--primary-text-color);
    text-align: center;
`;

const RuleList = styled.ul`
    list-style: none;
    padding: 0;

    @media (max-width: 768px) {
        font-size: 14px;
    }
`;

const RuleItem = styled.li`
    margin-bottom: 10px;
    color: var(--primary-text-color);
    line-height: 1.6;
    align-items: center;

    &:last-child {
        margin-bottom: 0;
    }
`;

const IconWrapper = styled.span`
    display: inline-block;
    margin: 0 5px;

    & svg {
        vertical-align: middle;
        width: 1.5rem;
        height: 1.5rem;
    }
`;

function Ruleset() {
    return (
        <RulesContainer>
            <Title>Match Rules</Title>
            <RuleList>
                <RuleItem>
                    Every match must have a winner; draws are <b>not</b>{" "}
                    permitted in this format.
                </RuleItem>
                <RuleItem>
                    To record a <b>goal</b> for a player, click on the{" "}
                    <IconWrapper>
                        <HiPlusCircle />
                    </IconWrapper>{" "}
                    in the player's row. This adds one <b>goal</b> to the
                    player's score.
                </RuleItem>
                <RuleItem>
                    The{" "}
                    <IconWrapper>
                        <HiMinusCircle />
                    </IconWrapper>{" "}
                    is used to record an <b>own goal</b>, resulting in a{" "}
                    <b>minus score</b> for the team that made the own goal. It's
                    up to you whether to use this button as part of <b>your</b>{" "}
                    game rules.
                </RuleItem>
                <RuleItem>
                    Use{" "}
                    <IconWrapper>
                        <HiArrowUturnLeft /> <i>Undo last</i>
                    </IconWrapper>{" "}
                    to <b>reverse</b> the last action taken, crucial for
                    correcting accidental goal entries or own goals.
                </RuleItem>
                <RuleItem>
                    Each match is limited to a <b>maximum of 30 minutes</b>. The
                    match will automatically stop after approximately 30
                    minutes, without a declared winner if the time limit is
                    reached.
                </RuleItem>
                <RuleItem>
                    Once your match reaches its conclusion,{" "}
                    <b>press and hold</b>{" "}
                    <IconWrapper>
                        {" "}
                        <i>End Match</i> <HiArrowDownTray />
                    </IconWrapper>{" "}
                    for 1 second to officially end the match.
                </RuleItem>
                <RuleItem>
                    Matches with a score of 0 - 0 are <b>not</b> considered
                    valid. Ensure that each game has at least one goal scored.
                </RuleItem>
            </RuleList>
        </RulesContainer>
    );
}

export default Ruleset;
