import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { HiOutlineCamera, HiOutlineTrash } from "react-icons/hi2";
import { media } from "../../utils/constants";
import {
    useUploadTeamLogo,
    useDeleteTeamLogo,
    useUpdateTeam,
} from "./useTeams";
import { compressImage } from "../../services/apiImageUpload";
import SpinnerMini from "../../ui/SpinnerMini";
import toast from "react-hot-toast";

const FormContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 14rem 1fr;
    gap: 2.4rem;
    align-items: start;

    ${media.tablet} {
        grid-template-columns: 10rem 1fr;
        gap: 2rem;
    }

    ${media.mobile} {
        grid-template-columns: 1fr;
        gap: 1.6rem;
    }
`;

const FormLabel = styled.label`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--color-grey-700);
    padding-top: 0.8rem;

    ${media.mobile} {
        padding-top: 0;
    }
`;

const FormField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const FormHint = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
    line-height: 1.4;
`;

// Logo specific styles
const LogoFieldContent = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;

    ${media.mobile} {
        flex-direction: column;
        align-items: center;
    }
`;

const LogoWrapper = styled.div`
    position: relative;
    cursor: pointer;
    flex-shrink: 0;

    &:hover > div {
        opacity: 1;
    }
`;

const StyledLogo = styled.img`
    width: 10rem;
    height: 10rem;
    border-radius: var(--border-radius-lg);
    object-fit: cover;
    border: 2px solid var(--secondary-border-color);
    transition: filter 0.2s ease;

    ${LogoWrapper}:hover & {
        filter: brightness(0.7);
    }

    ${media.tablet} {
        width: 8rem;
        height: 8rem;
    }

    ${media.mobile} {
        width: 10rem;
        height: 10rem;
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
    font-size: 3.2rem;
    font-weight: 700;
    color: var(--color-brand-600);
    border: 2px solid var(--secondary-border-color);
    transition: filter 0.2s ease;

    ${LogoWrapper}:hover & {
        filter: brightness(0.7);
    }

    ${media.tablet} {
        width: 8rem;
        height: 8rem;
        font-size: 2.8rem;
    }

    ${media.mobile} {
        width: 10rem;
        height: 10rem;
        font-size: 3.2rem;
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
    gap: 0.2rem;
    border-radius: var(--border-radius-lg);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
`;

const CameraIcon = styled(HiOutlineCamera)`
    width: 2.4rem;
    height: 2.4rem;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

const OverlayText = styled.span`
    font-size: 1.1rem;
    font-weight: 500;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const LogoActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;

    ${media.mobile} {
        align-items: center;
    }
`;

const LogoActionButtons = styled.div`
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;

    ${media.mobile} {
        justify-content: center;
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

// Team name specific styles
const TeamNameInput = styled.input`
    width: 100%;
    padding: 1rem 1.4rem;
    font-size: 1.5rem;
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
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 0.8rem;
    margin-top: 0.4rem;

    ${media.mobile} {
        justify-content: center;
    }
`;

// Shared button styles
const Button = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    font-size: 1.3rem;
    font-weight: 500;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    svg {
        width: 1.4rem;
        height: 1.4rem;
    }
`;

const SaveButton = styled(Button)`
    color: var(--primary-button-color-text);
    background-color: var(--primary-button-color);
    border: none;
    min-width: 7rem;

    &:hover:not(:disabled) {
        background-color: var(--primary-button-color-hover);
    }
`;

const CancelButton = styled(Button)`
    color: var(--color-grey-600);
    background-color: transparent;
    border: 1px solid var(--secondary-border-color);

    &:hover:not(:disabled) {
        background-color: var(--color-grey-100);
    }
`;

const DeleteButton = styled(Button)`
    color: var(--color-red-600);
    background-color: transparent;
    border: 1px solid var(--color-red-200);

    &:hover:not(:disabled) {
        background-color: var(--color-red-50);
        border-color: var(--color-red-300);
    }
`;

const ConfirmDeleteButton = styled(Button)`
    color: white;
    background-color: var(--color-red-600);
    border: none;

    &:hover:not(:disabled) {
        background-color: var(--color-red-700);
    }
`;

function TeamLogoUpload({ team, teamId }) {
    const fileInputRef = useRef(null);
    const { uploadLogo, isLoading: isUploading } = useUploadTeamLogo();
    const { deleteLogo, isLoading: isDeleting } = useDeleteTeamLogo();
    const { updateTeam, isLoading: isUpdatingName } = useUpdateTeam();

    const [previewLogo, setPreviewLogo] = useState(null);
    const [newLogo, setNewLogo] = useState(null);
    const [hasLogoChanges, setHasLogoChanges] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        deleteLogo(
            { teamId, logoUrl: team.logo_url },
            {
                onSuccess: () => {
                    setShowDeleteConfirm(false);
                },
            }
        );
    }

    function handleDeleteClick() {
        setShowDeleteConfirm(true);
    }

    function handleDeleteCancel() {
        setShowDeleteConfirm(false);
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
        <FormContainer>
            {/* Logo Row */}
            <FormRow>
                <FormLabel>Logo</FormLabel>
                <FormField>
                    <LogoFieldContent>
                        <LogoWrapper onClick={handleLogoClick}>
                            {displayLogo ? (
                                <StyledLogo
                                    src={displayLogo}
                                    alt={team?.name || "Team"}
                                />
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

                        <LogoActions>
                            <FormHint>
                                Click on the logo to upload a new image.
                                <br />
                                Recommended: 512×512px, max 2MB.
                            </FormHint>

                            <LogoActionButtons>
                                {hasLogoChanges && (
                                    <>
                                        <CancelButton
                                            onClick={handleLogoCancel}
                                            disabled={isLogoLoading}
                                        >
                                            Cancel
                                        </CancelButton>
                                        <SaveButton
                                            onClick={handleLogoSave}
                                            disabled={isLogoLoading}
                                        >
                                            {isUploading ? (
                                                <SpinnerMini />
                                            ) : (
                                                "Save"
                                            )}
                                        </SaveButton>
                                    </>
                                )}

                                {!hasLogoChanges &&
                                    team?.logo_url &&
                                    !showDeleteConfirm && (
                                        <DeleteButton
                                            onClick={handleDeleteClick}
                                            disabled={isLogoLoading}
                                        >
                                            <HiOutlineTrash />
                                            Remove
                                        </DeleteButton>
                                    )}

                                {showDeleteConfirm && (
                                    <>
                                        <CancelButton
                                            onClick={handleDeleteCancel}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </CancelButton>
                                        <ConfirmDeleteButton
                                            onClick={handleLogoDelete}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <SpinnerMini />
                                            ) : (
                                                "Confirm"
                                            )}
                                        </ConfirmDeleteButton>
                                    </>
                                )}
                            </LogoActionButtons>
                        </LogoActions>
                    </LogoFieldContent>
                </FormField>
            </FormRow>

            {/* Team Name Row */}
            <FormRow>
                <FormLabel htmlFor="teamName">Team Name</FormLabel>
                <FormField>
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
                    <FormHint>
                        Displayed throughout the app. 2-50 characters.
                    </FormHint>
                    {hasNameChanges && (
                        <ActionButtons>
                            <CancelButton
                                onClick={handleNameCancel}
                                disabled={isUpdatingName}
                            >
                                Cancel
                            </CancelButton>
                            <SaveButton
                                onClick={handleNameSave}
                                disabled={isUpdatingName || !teamName.trim()}
                            >
                                {isUpdatingName ? <SpinnerMini /> : "Save"}
                            </SaveButton>
                        </ActionButtons>
                    )}
                </FormField>
            </FormRow>
        </FormContainer>
    );
}

export default TeamLogoUpload;
