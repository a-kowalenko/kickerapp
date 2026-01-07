import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { HiOutlineCamera, HiOutlineTrash } from "react-icons/hi2";
import { media } from "../../utils/constants";
import { useUploadTeamLogo, useDeleteTeamLogo, useUpdateTeam } from "./useTeams";
import { compressImage } from "../../services/apiImageUpload";
import SpinnerMini from "../../ui/SpinnerMini";
import toast from "react-hot-toast";

const Container = styled.div`
    display: flex;
    gap: 3rem;
    align-items: flex-start;

    ${media.tablet} {
        gap: 2.4rem;
    }

    ${media.mobile} {
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
    }
`;

const LogoContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;
`;

const TeamInfoContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    flex: 1;
    min-width: 0;

    ${media.tablet} {
        gap: 1.2rem;
    }

    ${media.mobile} {
        width: 100%;
        align-items: center;
    }
`;

const TeamNameSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 100%;
`;

const TeamNameLabel = styled.label`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-grey-700);
`;

const TeamNameInputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
`;

const TeamNameInput = styled.input`
    width: 100%;
    padding: 1rem 1.4rem;
    font-size: 1.6rem;
    font-weight: 500;
    color: var(--color-grey-800);
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-sm);
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: var(--color-brand-500);
        box-shadow: 0 0 0 3px var(--color-brand-100);
    }

    &:disabled {
        background-color: var(--color-grey-100);
        cursor: not-allowed;
    }

    ${media.tablet} {
        font-size: 1.4rem;
        padding: 0.8rem 1.2rem;
    }

    ${media.mobile} {
        text-align: center;
    }
`;

const TeamNameButtons = styled.div`
    display: flex;
    gap: 0.8rem;

    ${media.mobile} {
        justify-content: center;
    }
`;

const TeamNameHint = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
`;

const LogoWrapper = styled.div`
    position: relative;
    cursor: pointer;

    &:hover > div {
        opacity: 1;
    }
`;

const StyledLogo = styled.img`
    width: 15rem;
    height: 15rem;
    border-radius: var(--border-radius-lg);
    object-fit: cover;
    border: 3px solid var(--secondary-border-color);
    transition: filter 0.2s ease;

    ${LogoWrapper}:hover & {
        filter: brightness(0.7);
    }

    ${media.tablet} {
        width: 9rem;
        height: 9rem;
    }

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
    transition: filter 0.2s ease;

    ${LogoWrapper}:hover & {
        filter: brightness(0.7);
    }

    ${media.tablet} {
        width: 9rem;
        height: 9rem;
        font-size: 3.5rem;
    }

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
        font-size: 3rem;
    }
`;

const LogoOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border-radius: var(--border-radius-lg);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
`;

const CameraIcon = styled(HiOutlineCamera)`
    width: 2.8rem;
    height: 2.8rem;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

const OverlayText = styled.span`
    font-size: 1.2rem;
    font-weight: 500;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const HiddenInput = styled.input`
    display: none;
`;

const LogoInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
`;

const LogoLabel = styled.span`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-grey-700);
`;

const LogoHint = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
    text-align: center;
`;

const SaveButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 0.8rem 1.6rem;
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-button-color-text);
    background-color: var(--primary-button-color);
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 10rem;

    &:hover:not(:disabled) {
        background-color: var(--primary-button-color-hover);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const CancelButton = styled.button`
    padding: 0.8rem 1.6rem;
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-grey-600);
    background-color: transparent;
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background-color: var(--color-grey-100);
    }
`;

const DeleteButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.8rem 1.6rem;
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-red-600);
    background-color: transparent;
    border: 1px solid var(--color-red-200);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background-color: var(--color-red-50);
        border-color: var(--color-red-300);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    svg {
        width: 1.6rem;
        height: 1.6rem;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 1rem;
`;

function TeamLogoUpload({ team, teamId }) {
    const fileInputRef = useRef(null);
    const { uploadLogo, isLoading: isUploading } = useUploadTeamLogo();
    const { deleteLogo, isLoading: isDeleting } = useDeleteTeamLogo();
    const { updateTeam, isLoading: isUpdatingName } = useUpdateTeam();

    const [previewLogo, setPreviewLogo] = useState(null);
    const [newLogo, setNewLogo] = useState(null);
    const [hasLogoChanges, setHasLogoChanges] = useState(false);

    // Team name state
    const [teamName, setTeamName] = useState(team?.name || "");
    const [hasNameChanges, setHasNameChanges] = useState(false);

    // Sync team name when team prop changes
    useEffect(() => {
        setTeamName(team?.name || "");
    }, [team?.name]);

    const initials =
        team?.name
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "??";

    const displayLogo = previewLogo || team?.logo_url;

    // Logo handlers
    function handleLogoClick() {
        fileInputRef.current?.click();
    }

    function handleLogoChange(e) {
        const [file] = e.target.files;
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image must be smaller than 2MB");
                return;
            }

            const objectUrl = URL.createObjectURL(file);
            setPreviewLogo(objectUrl);
            setNewLogo(file);
            setHasLogoChanges(true);
        }
    }

    async function handleLogoSave() {
        if (!newLogo || !teamId) return;

        try {
            // Compress image before upload (skips GIFs)
            const compressedFile = await compressImage(newLogo);

            uploadLogo(
                { teamId, file: compressedFile },
                {
                    onSuccess: () => {
                        setPreviewLogo(null);
                        setNewLogo(null);
                        setHasLogoChanges(false);
                        // Reset file input
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                    },
                }
            );
        } catch (error) {
            toast.error("Failed to compress image");
            console.error("Compression error:", error);
        }
    }

    function handleLogoCancel() {
        // Revoke object URL to free memory
        if (previewLogo) {
            URL.revokeObjectURL(previewLogo);
        }
        setPreviewLogo(null);
        setNewLogo(null);
        setHasLogoChanges(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function handleLogoDelete() {
        if (!teamId || !team?.logo_url) return;
        deleteLogo(teamId);
    }

    // Team name handlers
    function handleNameChange(e) {
        const newName = e.target.value;
        setTeamName(newName);
        setHasNameChanges(newName !== team?.name);
    }

    function handleNameSave() {
        if (!teamId || !teamName.trim()) return;

        if (teamName.trim().length < 2) {
            toast.error("Team name must be at least 2 characters");
            return;
        }

        if (teamName.trim().length > 50) {
            toast.error("Team name must be 50 characters or less");
            return;
        }

        updateTeam(
            { teamId, updates: { name: teamName.trim() } },
            {
                onSuccess: () => {
                    setHasNameChanges(false);
                },
            }
        );
    }

    function handleNameCancel() {
        setTeamName(team?.name || "");
        setHasNameChanges(false);
    }

    function handleNameKeyDown(e) {
        if (e.key === "Enter" && hasNameChanges) {
            handleNameSave();
        } else if (e.key === "Escape") {
            handleNameCancel();
        }
    }

    const isLogoLoading = isUploading || isDeleting;

    return (
        <Container>
            {/* Logo Section */}
            <LogoContainer>
                <LogoWrapper onClick={handleLogoClick}>
                    {displayLogo ? (
                        <StyledLogo src={displayLogo} alt={team?.name || "Team"} />
                    ) : (
                        <DefaultLogo>{initials}</DefaultLogo>
                    )}
                    <LogoOverlay>
                        <CameraIcon />
                        <OverlayText>Change</OverlayText>
                    </LogoOverlay>
                </LogoWrapper>

                <HiddenInput
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleLogoChange}
                    disabled={isLogoLoading}
                />

                <LogoInfo>
                    <LogoLabel>Team Logo</LogoLabel>
                    <LogoHint>Click to upload a new logo</LogoHint>
                </LogoInfo>

                {hasLogoChanges && (
                    <ButtonGroup>
                        <CancelButton onClick={handleLogoCancel} disabled={isLogoLoading}>
                            Cancel
                        </CancelButton>
                        <SaveButton onClick={handleLogoSave} disabled={isLogoLoading}>
                            {isUploading ? <SpinnerMini /> : "Save"}
                        </SaveButton>
                    </ButtonGroup>
                )}

                {!hasLogoChanges && team?.logo_url && (
                    <DeleteButton onClick={handleLogoDelete} disabled={isLogoLoading}>
                        {isDeleting ? (
                            <SpinnerMini />
                        ) : (
                            <>
                                <HiOutlineTrash />
                                Remove Logo
                            </>
                        )}
                    </DeleteButton>
                )}
            </LogoContainer>

            {/* Team Name Section */}
            <TeamInfoContainer>
                <TeamNameSection>
                    <TeamNameLabel htmlFor="teamName">Team Name</TeamNameLabel>
                    <TeamNameInputWrapper>
                        <TeamNameInput
                            id="teamName"
                            type="text"
                            value={teamName}
                            onChange={handleNameChange}
                            onKeyDown={handleNameKeyDown}
                            placeholder="Enter team name..."
                            disabled={isUpdatingName}
                            maxLength={50}
                        />
                        {hasNameChanges && (
                            <TeamNameButtons>
                                <CancelButton onClick={handleNameCancel} disabled={isUpdatingName}>
                                    Cancel
                                </CancelButton>
                                <SaveButton onClick={handleNameSave} disabled={isUpdatingName || !teamName.trim()}>
                                    {isUpdatingName ? <SpinnerMini /> : "Save"}
                                </SaveButton>
                            </TeamNameButtons>
                        )}
                    </TeamNameInputWrapper>
                    <TeamNameHint>
                        The team name is displayed throughout the app (2-50 characters)
                    </TeamNameHint>
                </TeamNameSection>
            </TeamInfoContainer>
        </Container>
    );
}

export default TeamLogoUpload;
