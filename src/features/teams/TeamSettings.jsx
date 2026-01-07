import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    HiOutlineCog6Tooth,
    HiOutlineTrash,
} from "react-icons/hi2";
import { media, TEAM_STATUS_ACTIVE } from "../../utils/constants";
import { useDissolveTeam } from "./useTeams";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";
import TeamLogoUpload from "./TeamLogoUpload";

const StyledTeamSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }

    ${media.mobile} {
        padding: 0;
        gap: 1.6rem;
    }
`;

const Card = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    ${media.tablet} {
        border-radius: var(--border-radius-sm);
    }

    ${media.mobile} {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 2rem 2.4rem;
    background-color: var(--color-grey-50);
    border-bottom: 1px solid var(--secondary-border-color);

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background-color: ${(props) =>
        props.$danger
            ? "var(--danger-button-color)"
            : "var(--primary-button-color)"};
    color: ${(props) =>
        props.$danger
            ? "var(--color-red-600)"
            : "var(--primary-button-color-text)"};

    svg {
        width: 2rem;
        height: 2rem;
    }

    ${media.mobile} {
        width: 3.2rem;
        height: 3.2rem;

        svg {
            width: 1.6rem;
            height: 1.6rem;
        }
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const CardTitle = styled.span`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-grey-800);

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const CardDescription = styled.span`
    font-size: 1.4rem;
    color: var(--color-grey-500);

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const CardBody = styled.div`
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

// Danger Zone
const DangerCard = styled(Card)`
    border-color: var(--color-red-200);
`;

const DangerZoneContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.6rem;
`;

const DangerText = styled.p`
    font-size: 1.4rem;
    color: var(--color-grey-700);
    margin: 0;
    line-height: 1.6;

    ${media.mobile} {
        font-size: 1.3rem;
    }
`;

const WarningBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.6rem;
    background-color: var(--color-red-50);
    border: 1px solid var(--color-red-200);
    border-radius: var(--border-radius-sm);
`;

const WarningText = styled.p`
    font-size: 1.4rem;
    color: var(--color-red-700);
    margin: 0;

    ${media.mobile} {
        font-size: 1.3rem;
    }
`;

const ConfirmButtons = styled.div`
    display: flex;
    gap: 1rem;

    ${media.mobile} {
        flex-direction: column-reverse;
    }
`;

const DisabledMessage = styled.div`
    padding: 2rem;
    text-align: center;
    color: var(--color-grey-500);
    font-size: 1.4rem;
`;

function TeamSettings({ teamId, team, isTeamMember }) {
    const navigate = useNavigate();
    const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);

    const { dissolveTeam, isLoading: isDissolving } = useDissolveTeam();

    const isActive = team?.status === TEAM_STATUS_ACTIVE;

    const handleDissolve = () => {
        dissolveTeam(teamId, {
            onSuccess: (data) => {
                if (data?.success) {
                    navigate("/teams");
                }
            },
        });
    };

    if (!isTeamMember) {
        return (
            <StyledTeamSettings>
                <Card>
                    <CardHeader>
                        <IconWrapper>
                            <HiOutlineCog6Tooth />
                        </IconWrapper>
                        <HeaderContent>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>
                                Team management options
                            </CardDescription>
                        </HeaderContent>
                    </CardHeader>
                    <CardBody>
                        <DisabledMessage>
                            Only team members can manage team settings.
                        </DisabledMessage>
                    </CardBody>
                </Card>
            </StyledTeamSettings>
        );
    }

    if (!isActive) {
        return (
            <StyledTeamSettings>
                <Card>
                    <CardHeader>
                        <IconWrapper>
                            <HiOutlineCog6Tooth />
                        </IconWrapper>
                        <HeaderContent>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>
                                Team management options
                            </CardDescription>
                        </HeaderContent>
                    </CardHeader>
                    <CardBody>
                        <DisabledMessage>
                            This team has been dissolved. Settings are no longer
                            available.
                        </DisabledMessage>
                    </CardBody>
                </Card>
            </StyledTeamSettings>
        );
    }

    return (
        <StyledTeamSettings>
            {/* Team Profile Settings */}
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineCog6Tooth />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Team Profile</CardTitle>
                        <CardDescription>
                            Customize logo and team name
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <TeamLogoUpload team={team} teamId={teamId} />
                </CardBody>
            </Card>

            {/* Danger Zone */}
            <DangerCard>
                <CardHeader>
                    <IconWrapper $danger>
                        <HiOutlineTrash />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Danger Zone</CardTitle>
                        <CardDescription>
                            Irreversible team actions
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <DangerZoneContent>
                        <DangerText>
                            Dissolving a team is permanent and cannot be undone.
                            The team&apos;s match history will be preserved, but
                            the team will no longer be able to play matches or
                            appear in rankings.
                        </DangerText>

                        {!showDissolveConfirm ? (
                            <Button
                                $variation="danger"
                                onClick={() => setShowDissolveConfirm(true)}
                            >
                                Dissolve Team
                            </Button>
                        ) : (
                            <WarningBox>
                                <WarningText>
                                    Are you sure you want to dissolve &ldquo;
                                    {team?.name}&rdquo;? This action cannot be
                                    undone.
                                </WarningText>
                                <ConfirmButtons>
                                    <Button
                                        $variation="secondary"
                                        onClick={() =>
                                            setShowDissolveConfirm(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        $variation="danger"
                                        onClick={handleDissolve}
                                        disabled={isDissolving}
                                    >
                                        {isDissolving ? (
                                            <SpinnerMini />
                                        ) : (
                                            "Confirm Dissolve"
                                        )}
                                    </Button>
                                </ConfirmButtons>
                            </WarningBox>
                        )}
                    </DangerZoneContent>
                </CardBody>
            </DangerCard>
        </StyledTeamSettings>
    );
}

export default TeamSettings;
