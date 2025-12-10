import styled from "styled-components";
import { useState, useEffect, useRef } from "react";
import { HiOutlineCamera } from "react-icons/hi2";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR, media } from "../../utils/constants";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useUpdateUser } from "./useUpdateUser";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import toast from "react-hot-toast";

const AvatarContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;
`;

const AvatarWrapper = styled.div`
    position: relative;
    cursor: pointer;

    &:hover > div {
        opacity: 1;
    }
`;

const StyledAvatar = styled(Avatar)`
    width: 16rem;
    height: 16rem;
    transition: filter 0.2s ease;

    ${AvatarWrapper}:hover & {
        filter: brightness(0.7);
    }

    ${media.tablet} {
        width: 14rem;
        height: 14rem;
    }

    ${media.mobile} {
        width: 12rem;
        height: 12rem;
    }
`;

const AvatarOverlay = styled.div`
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
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
`;

const CameraIcon = styled(HiOutlineCamera)`
    width: 3.2rem;
    height: 3.2rem;
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

const AvatarInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
`;

const AvatarLabel = styled.span`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-grey-700);
`;

const AvatarHint = styled.span`
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
    min-width: 12rem;

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

const ButtonGroup = styled.div`
    display: flex;
    gap: 1rem;
`;

function AvatarUpload() {
    const fileInputRef = useRef(null);
    const { data: player, isLoading } = useOwnPlayer();
    const { updateUser, isUpdating } = useUpdateUser();

    const [avatarSrc, setAvatarSrc] = useState("");
    const [newAvatar, setNewAvatar] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    const avatar = player?.avatar;

    useEffect(() => {
        setAvatarSrc(avatar || DEFAULT_AVATAR);
    }, [avatar]);

    function handleAvatarClick() {
        fileInputRef.current?.click();
    }

    function handleAvatarChange(e) {
        const [file] = e.target.files;
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be smaller than 5MB");
                return;
            }

            const objectUrl = URL.createObjectURL(file);
            setAvatarSrc(objectUrl);
            setNewAvatar(file);
            setHasChanges(true);
        }
    }

    function handleSave() {
        if (!newAvatar) return;

        updateUser(
            { avatar: newAvatar },
            {
                onSuccess: () => {
                    setNewAvatar(null);
                    setHasChanges(false);
                },
            }
        );
    }

    function handleCancel() {
        setAvatarSrc(avatar || DEFAULT_AVATAR);
        setNewAvatar(null);
        setHasChanges(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <AvatarContainer>
            <AvatarWrapper onClick={handleAvatarClick}>
                <StyledAvatar src={avatarSrc || DEFAULT_AVATAR} />
                <AvatarOverlay>
                    <CameraIcon />
                    <OverlayText>Change</OverlayText>
                </AvatarOverlay>
            </AvatarWrapper>

            <HiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUpdating}
            />

            <AvatarInfo>
                <AvatarLabel>Profile Picture</AvatarLabel>
                <AvatarHint>Click to upload a new avatar</AvatarHint>
            </AvatarInfo>

            {hasChanges && (
                <ButtonGroup>
                    <CancelButton onClick={handleCancel} disabled={isUpdating}>
                        Cancel
                    </CancelButton>
                    <SaveButton onClick={handleSave} disabled={isUpdating}>
                        {isUpdating ? <SpinnerMini /> : "Save Avatar"}
                    </SaveButton>
                </ButtonGroup>
            )}
        </AvatarContainer>
    );
}

export default AvatarUpload;
