import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { HiOutlineCamera, HiOutlinePencil } from "react-icons/hi2";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUpdateKicker } from "../kicker/useUpdateKicker";
import { useKicker } from "../../contexts/KickerContext";
import { compressImage } from "../../services/apiImageUpload";
import supabase from "../../services/supabase";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Spinner from "../../ui/Spinner";
import SpinnerMini from "../../ui/SpinnerMini";
import { DEFAULT_AVATAR, media } from "../../utils/constants";
import toast from "react-hot-toast";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const SectionTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const Card = styled.div`
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const KickerProfileSection = styled.div`
    display: flex;
    gap: 3.2rem;
    align-items: flex-start;

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
    }
`;

const AvatarSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
`;

const AvatarWrapper = styled.div`
    position: relative;
    cursor: pointer;

    &:hover > div {
        opacity: 1;
    }
`;

const KickerAvatar = styled.img`
    width: 14rem;
    height: 14rem;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary-button-color);
    transition: filter 0.2s ease;

    ${AvatarWrapper}:hover & {
        filter: brightness(0.7);
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

const AvatarHint = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    text-align: center;
`;

const FormSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    min-width: 0;

    ${media.tablet} {
        width: 100%;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const Label = styled.label`
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const InputRow = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;

    ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
    }
`;

const StyledInput = styled(Input)`
    flex: 1;
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 4rem;
`;

const BUCKET_NAME = "chat-images";

function KickerSettings() {
    const { data: kickerData, isLoading } = useKickerInfo();
    const { currentKicker } = useKicker();
    const { updateKicker, isUpdating } = useUpdateKicker();

    const [name, setName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Initialize name when data loads
    useEffect(() => {
        if (kickerData?.name) {
            setName(kickerData.name);
        }
    }, [kickerData?.name]);

    if (isLoading) {
        return (
            <Container>
                <LoadingContainer>
                    <Spinner />
                </LoadingContainer>
            </Container>
        );
    }

    function handleAvatarClick() {
        fileInputRef.current?.click();
    }

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ];
        if (!validTypes.includes(file.type)) {
            toast.error(
                "Please select a valid image file (JPEG, PNG, WebP, or GIF)"
            );
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be smaller than 5MB");
            return;
        }

        setIsUploadingAvatar(true);

        try {
            // Compress the image (uses default compression settings from apiImageUpload)
            const compressedFile = await compressImage(file);

            // Generate unique filename
            const fileExt = file.type === "image/gif" ? "gif" : "webp";
            const fileName = `kicker_${currentKicker}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, compressedFile, {
                    contentType: compressedFile.type,
                    cacheControl: "31536000",
                    upsert: true,
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

            // Update kicker with new avatar URL
            updateKicker({
                kickerId: currentKicker,
                avatar: publicUrl,
            });
        } catch (error) {
            console.error("Avatar upload error:", error);
            toast.error(error.message || "Failed to upload avatar");
        } finally {
            setIsUploadingAvatar(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    function handleEditName() {
        setName(kickerData?.name || "");
        setIsEditingName(true);
    }

    function handleCancelEdit() {
        setName(kickerData?.name || "");
        setIsEditingName(false);
    }

    function handleSaveName() {
        if (!name.trim()) {
            toast.error("Kicker name cannot be empty");
            return;
        }

        if (name.trim() === kickerData?.name) {
            setIsEditingName(false);
            return;
        }

        updateKicker(
            { kickerId: currentKicker, name: name.trim() },
            {
                onSuccess: () => {
                    setIsEditingName(false);
                },
            }
        );
    }

    return (
        <Container>
            <Section>
                <SectionTitle>Kicker Profile</SectionTitle>
                <Card>
                    <KickerProfileSection>
                        <AvatarSection>
                            <AvatarWrapper onClick={handleAvatarClick}>
                                {isUploadingAvatar ? (
                                    <KickerAvatar
                                        src={
                                            kickerData?.avatar || DEFAULT_AVATAR
                                        }
                                        alt={kickerData?.name}
                                        style={{ filter: "brightness(0.5)" }}
                                    />
                                ) : (
                                    <KickerAvatar
                                        src={
                                            kickerData?.avatar || DEFAULT_AVATAR
                                        }
                                        alt={kickerData?.name}
                                    />
                                )}
                                <AvatarOverlay>
                                    {isUploadingAvatar ? (
                                        <SpinnerMini />
                                    ) : (
                                        <>
                                            <CameraIcon />
                                            <OverlayText>Change</OverlayText>
                                        </>
                                    )}
                                </AvatarOverlay>
                            </AvatarWrapper>
                            <HiddenInput
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleAvatarChange}
                            />
                            <AvatarHint>Click to change avatar</AvatarHint>
                        </AvatarSection>

                        <FormSection>
                            <FormGroup>
                                <Label>Kicker Name</Label>
                                {isEditingName ? (
                                    <InputRow>
                                        <StyledInput
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            placeholder="Enter kicker name"
                                            disabled={isUpdating}
                                        />
                                        <Button
                                            $variation="primary"
                                            $size="medium"
                                            onClick={handleSaveName}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <SpinnerMini />
                                            ) : (
                                                "Save"
                                            )}
                                        </Button>
                                        <Button
                                            $variation="secondary"
                                            $size="medium"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdating}
                                        >
                                            Cancel
                                        </Button>
                                    </InputRow>
                                ) : (
                                    <InputRow>
                                        <StyledInput
                                            value={kickerData?.name || ""}
                                            readOnly
                                        />
                                        <Button
                                            $variation="secondary"
                                            $size="medium"
                                            onClick={handleEditName}
                                        >
                                            <HiOutlinePencil />
                                            Edit
                                        </Button>
                                    </InputRow>
                                )}
                            </FormGroup>
                        </FormSection>
                    </KickerProfileSection>
                </Card>
            </Section>
        </Container>
    );
}

export default KickerSettings;
