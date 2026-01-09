import styled from "styled-components";
import { HiXMark, HiOutlinePaperAirplane } from "react-icons/hi2";
import Avatar from "../../ui/Avatar";
import SpinnerMini from "../../ui/SpinnerMini";
import { DEFAULT_AVATAR, media } from "../../utils/constants";
import { useTeamInvitations } from "./useTeamInvitations";

const BannerContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 80rem;
`;

const BannerHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding-bottom: 0.8rem;
`;

const HeaderIcon = styled.div`
    width: 2.4rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-yellow-600);

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

const BannerTitle = styled.h3`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const CountBadge = styled.span`
    background-color: var(--color-yellow-600);
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 1.1rem;
    font-weight: 600;
`;

const InvitationsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const InvitationCard = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem 1.4rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    transition: background-color 0.15s ease;

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    ${media.mobile} {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
`;

const InvitedPlayerInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
`;

const InvitedDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
`;

const TeamNameText = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const InvitedPlayerName = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 0.6rem;
    flex-shrink: 0;

    ${media.mobile} {
        width: 100%;
        justify-content: flex-end;
    }
`;

const CancelButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.6rem 1.2rem;
    font-size: 1.3rem;
    font-weight: 500;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--secondary-button-color-text);
    background-color: var(--secondary-button-color);
    border: 1px solid var(--secondary-button-color);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.3);

    &:hover:not(:disabled) {
        background-color: var(--secondary-button-color-active);
        border-color: var(--secondary-button-color-active);
        box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.5);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    & svg {
        width: 1.4rem;
        height: 1.4rem;
    }
`;

function SentInvitationsBanner() {
    const { sentInvitations, isLoadingSent, cancelInvitation, isCancelling } =
        useTeamInvitations();

    if (isLoadingSent || sentInvitations.length === 0) return null;

    return (
        <BannerContainer>
            <BannerHeader>
                <HeaderIcon>
                    <HiOutlinePaperAirplane />
                </HeaderIcon>
                <BannerTitle>
                    Sent Invitations
                    <CountBadge>{sentInvitations.length}</CountBadge>
                </BannerTitle>
            </BannerHeader>

            <InvitationsList>
                {sentInvitations.map((invitation) => (
                    <InvitationCard key={invitation.id}>
                        <InvitedPlayerInfo>
                            <Avatar
                                $size="small"
                                src={
                                    invitation.invited_player?.avatar ||
                                    DEFAULT_AVATAR
                                }
                            />
                            <InvitedDetails>
                                <TeamNameText>
                                    {invitation.team?.name}
                                </TeamNameText>
                                <InvitedPlayerName>
                                    Invited {invitation.invited_player?.name}
                                </InvitedPlayerName>
                            </InvitedDetails>
                        </InvitedPlayerInfo>

                        <ButtonGroup>
                            <CancelButton
                                onClick={() => cancelInvitation(invitation.id)}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <SpinnerMini />
                                ) : (
                                    <>
                                        <HiXMark /> Cancel
                                    </>
                                )}
                            </CancelButton>
                        </ButtonGroup>
                    </InvitationCard>
                ))}
            </InvitationsList>
        </BannerContainer>
    );
}

export default SentInvitationsBanner;
