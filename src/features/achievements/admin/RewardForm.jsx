import styled from "styled-components";
import { useState } from "react";
import Button from "../../../ui/Button";
import { useCreateReward, useUpdateReward } from "../useRewardMutations";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
`;

const Modal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    padding: 2.4rem;
    z-index: 1001;
    width: 90%;
    max-width: 60rem;
    max-height: 90vh;
    overflow-y: auto;
`;

const Title = styled.h2`
    font-size: 2rem;
    margin-bottom: 2rem;
    color: var(--primary-text-color);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.6rem;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const FormRow = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const Label = styled.label`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--secondary-text-color);
`;

const Input = styled.input`
    padding: 1rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);

    &:hover {
        background-color: var(--primary-input-background-color-hover);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-input-border-color-active);
    }

    &::placeholder {
        color: var(--secondary-text-color);
    }
`;

const Select = styled.select`
    padding: 1rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);

    &:hover {
        background-color: var(--primary-input-background-color-hover);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-input-border-color-active);
    }

    option {
        background-color: var(--dropdown-list-background-color);
        color: var(--primary-text-color);
    }
`;

const TextArea = styled.textarea`
    padding: 1rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    resize: vertical;
    min-height: 6rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);

    &:hover {
        background-color: var(--primary-input-background-color-hover);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-input-border-color-active);
    }

    &::placeholder {
        color: var(--secondary-text-color);
    }
`;

const ButtonRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    margin-top: 1rem;
`;

const HelpText = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    margin-top: 0.2rem;
`;

const PreviewSection = styled.div`
    padding: 1.6rem;
    background-color: var(--color-grey-100);
    border-radius: var(--border-radius-sm);
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const PreviewTitle = styled.span`
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    text-transform: uppercase;
`;

const PreviewContent = styled.div`
    font-size: 1.6rem;
    color: var(--primary-text-color);
`;

const REWARD_TYPES = [
    { value: "title", label: "Title" },
    { value: "frame", label: "Avatar Frame" },
];

const DISPLAY_POSITIONS = [
    { value: "prefix", label: "Prefix (Title Name)" },
    { value: "suffix", label: "Suffix (Name, Title)" },
];

function RewardForm({ reward, achievements, onClose }) {
    const { createReward, isLoading: isCreating } = useCreateReward();
    const { updateReward, isLoading: isUpdating } = useUpdateReward();

    const [formData, setFormData] = useState({
        key: reward?.key || "",
        name: reward?.name || "",
        description: reward?.description || "",
        type: reward?.type || "title",
        displayPosition: reward?.display_position || "prefix",
        displayValue: reward?.display_value || "",
        achievementKey: reward?.achievement_key || "",
        icon: reward?.icon || "",
        sortOrder: reward?.sort_order || 0,
    });

    const isEditing = !!reward;
    const isLoading = isCreating || isUpdating;

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = {
            ...formData,
            achievementKey: formData.achievementKey || null,
        };

        if (isEditing) {
            updateReward({ id: reward.id, ...data }, { onSuccess: onClose });
        } else {
            createReward(data, { onSuccess: onClose });
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    // Generate preview for titles
    const renderTitlePreview = () => {
        if (formData.type !== "title" || !formData.displayValue) return null;

        const exampleName = "PlayerName";
        const title = formData.displayValue;
        const preview =
            formData.displayPosition === "prefix"
                ? `${title} ${exampleName}`
                : `${exampleName}, ${title}`;

        return (
            <PreviewSection>
                <PreviewTitle>Preview</PreviewTitle>
                <PreviewContent>{preview}</PreviewContent>
            </PreviewSection>
        );
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <Modal>
                <Title>{isEditing ? "Edit Reward" : "New Reward"}</Title>
                <Form onSubmit={handleSubmit}>
                    <FormGrid>
                        <FormRow>
                            <Label htmlFor="key">Key (unique identifier)</Label>
                            <Input
                                id="key"
                                name="key"
                                value={formData.key}
                                onChange={handleChange}
                                placeholder="e.g., title_champion"
                                required
                            />
                        </FormRow>

                        <FormRow>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Champion Title"
                                required
                            />
                        </FormRow>
                    </FormGrid>

                    <FormRow>
                        <Label htmlFor="description">Description</Label>
                        <TextArea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="A prestigious title awarded to champions..."
                        />
                    </FormRow>

                    <FormGrid>
                        <FormRow>
                            <Label htmlFor="type">Type</Label>
                            <Select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                {REWARD_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </Select>
                        </FormRow>

                        {formData.type === "title" && (
                            <FormRow>
                                <Label htmlFor="displayPosition">
                                    Display Position
                                </Label>
                                <Select
                                    id="displayPosition"
                                    name="displayPosition"
                                    value={formData.displayPosition}
                                    onChange={handleChange}
                                >
                                    {DISPLAY_POSITIONS.map((pos) => (
                                        <option
                                            key={pos.value}
                                            value={pos.value}
                                        >
                                            {pos.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormRow>
                        )}
                    </FormGrid>

                    <FormRow>
                        <Label htmlFor="displayValue">
                            {formData.type === "title"
                                ? "Title Text"
                                : "Frame URL"}
                        </Label>
                        <Input
                            id="displayValue"
                            name="displayValue"
                            value={formData.displayValue}
                            onChange={handleChange}
                            placeholder={
                                formData.type === "title"
                                    ? "e.g., Champion"
                                    : "https://example.com/frame.png"
                            }
                            required
                        />
                        <HelpText>
                            {formData.type === "title"
                                ? "The actual title text that will be displayed with the player name"
                                : "URL to the frame image that will wrap around the avatar"}
                        </HelpText>
                    </FormRow>

                    {renderTitlePreview()}

                    <FormGrid>
                        <FormRow>
                            <Label htmlFor="achievementKey">
                                Linked Achievement
                            </Label>
                            <Select
                                id="achievementKey"
                                name="achievementKey"
                                value={formData.achievementKey}
                                onChange={handleChange}
                            >
                                <option value="">
                                    -- No Achievement (Always Available) --
                                </option>
                                {achievements?.map((ach) => (
                                    <option key={ach.key} value={ach.key}>
                                        {ach.icon} {ach.name} ({ach.key})
                                    </option>
                                ))}
                            </Select>
                            <HelpText>
                                Select an achievement that unlocks this reward.
                                Leave empty for rewards available to everyone.
                            </HelpText>
                        </FormRow>

                        <FormRow>
                            <Label htmlFor="sortOrder">Sort Order</Label>
                            <Input
                                id="sortOrder"
                                name="sortOrder"
                                type="number"
                                value={formData.sortOrder}
                                onChange={handleChange}
                            />
                        </FormRow>
                    </FormGrid>

                    <FormRow>
                        <Label htmlFor="icon">Icon (emoji or URL)</Label>
                        <Input
                            id="icon"
                            name="icon"
                            value={formData.icon}
                            onChange={handleChange}
                            placeholder="e.g., 👑 or https://..."
                        />
                    </FormRow>

                    <ButtonRow>
                        <Button
                            type="button"
                            $variation="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? "Saving..."
                                : isEditing
                                ? "Update Reward"
                                : "Create Reward"}
                        </Button>
                    </ButtonRow>
                </Form>
            </Modal>
        </>
    );
}

export default RewardForm;
