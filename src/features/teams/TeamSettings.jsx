import styled from "styled-components";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    HiOutlineCog6Tooth,
    HiOutlinePhoto,
    HiOutlineTrash,
} from "react-icons/hi2";
import { media, TEAM_STATUS_ACTIVE } from "../../utils/constants";
import {
    useDissolveTeam,
    useUploadTeamLogo,
    useDeleteTeamLogo,
} from "./useTeams";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";

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
        props.$danger ? "var(--color-red-100)" : "var(--primary-button-color)"};
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

// Logo Section
const LogoSection = styled.div`
    display: flex;
    align-items: center;
    gap: 2rem;

    ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
    }
`;

const CurrentLogo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    ${media.mobile} {
        align-items: center;
    }
`;

const LogoPreview = styled.img`
    width: 10rem;
    height: 10rem;
    border-radius: var(--border-radius-lg);
    object-fit: cover;
    border: 3px solid var(--secondary-border-color);

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
    }
`;

const DefaultLogo = styled.div`
    width: 10rem;
    height: 10rem;
    border-radius: var(--border-radius-lg);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    font-weight: 700;
    color: var(--color-brand-600);
    border: 3px solid var(--secondary-border-color);

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
        font-size: 3rem;
    }
`;

const LogoActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    flex: 1;

    ${media.mobile} {
        gap: 1rem;
    }
`;

const LogoHelpText = styled.p`
    font-size: 1.3rem;
    color: var(--color-grey-500);
    margin: 0;
    line-height: 1.5;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 1rem;

    ${media.mobile} {
        flex-direction: column;
    }
`;

// Danger Zone
const DangerCard = styled(Card)`
    border-color: var(--color-red-200);
`;

const DangerZoneContent = styled.div`
    display: flex;
    flex-direction: column;
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

const HiddenFileInput = styled.input`
    display: none;
`;

const UploadButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 1.6rem;
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-brand-600);
    background-color: var(--color-brand-50);
    border: 1px dashed var(--color-brand-300);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background-color: var(--color-brand-100);
        border-color: var(--color-brand-400);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    ${media.mobile} {
        font-size: 1.3rem;
        padding: 0.8rem 1.2rem;
    }
`;

function TeamSettings({ teamId, team, isTeamMember }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const { dissolveTeam, isLoading: isDissolving } = useDissolveTeam();
    const { uploadLogo, isLoading: isUploading } = useUploadTeamLogo();
    const { deleteLogo, isLoading: isDeleting } = useDeleteTeamLogo();

    const isActive = team?.status === TEAM_STATUS_ACTIVE;

    const initials =
        team?.name
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "??";

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUploadLogo = () => {
        if (!selectedFile || !teamId) return;

        uploadLogo(
            { teamId, file: selectedFile },
            {
                onSuccess: () => {
                    setSelectedFile(null);
                },
            }
        );
    };

    const handleDeleteLogo = () => {
        if (!teamId || !team?.logo_url) return;
        deleteLogo(teamId);
    };

    const handleDissolve = () => {
        dissolveTeam(teamId, {
            onSuccess: () => {
                navigate("/teams");
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
            {/* Logo Settings */}
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlinePhoto />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Team Logo</CardTitle>
                        <CardDescription>
                            Upload or change your team logo
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <LogoSection>
                        <CurrentLogo>
                            {team?.logo_url ? (
                                <LogoPreview
                                    src={team.logo_url}
                                    alt={team.name}
                                />
                            ) : (
                                <DefaultLogo>{initials}</DefaultLogo>
                            )}
                        </CurrentLogo>
                        <LogoActions>
                            <LogoHelpText>
                                Upload a square image (recommended 512x512px).
                                Supported formats: JPG, PNG, WebP, GIF. Max
                                size: 2MB.
                            </LogoHelpText>
                            <HiddenFileInput
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            <UploadButton
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <HiOutlinePhoto />
                                Choose File
                            </UploadButton>
                            {selectedFile && (
                                <LogoHelpText>
                                    Selected: {selectedFile.name}
                                </LogoHelpText>
                            )}
                            <ButtonGroup>
                                <Button
                                    $variation="primary"
                                    $size="small"
                                    onClick={handleUploadLogo}
                                    disabled={!selectedFile || isUploading}
                                >
                                    {isUploading ? (
                                        <SpinnerMini />
                                    ) : (
                                        "Upload Logo"
                                    )}
                                </Button>
                                {team?.logo_url && (
                                    <Button
                                        $variation="danger"
                                        $size="small"
                                        onClick={handleDeleteLogo}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <SpinnerMini />
                                        ) : (
                                            "Remove Logo"
                                        )}
                                    </Button>
                                )}
                            </ButtonGroup>
                        </LogoActions>
                    </LogoSection>
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
