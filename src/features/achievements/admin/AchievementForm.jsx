import styled from "styled-components";
import { useState } from "react";
import Button from "../../../ui/Button";
import {
    useCreateAchievement,
    useUpdateAchievement,
} from "../useAchievementMutations";
import ConditionBuilder from "./ConditionBuilder";
import ConditionJsonEditor from "./ConditionJsonEditor";

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
    max-width: 70rem;
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
    min-height: 8rem;
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

const CheckboxRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const Checkbox = styled.input`
    width: 1.8rem;
    height: 1.8rem;
    accent-color: var(--primary-button-color);
`;

const ButtonRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    margin-top: 1rem;
`;

const ConditionSection = styled.div`
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    padding: 1.6rem;
`;

const ConditionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.2rem;
`;

const ConditionTitle = styled.h3`
    font-size: 1.6rem;
    margin: 0;
    color: var(--primary-text-color);
`;

const ToggleButton = styled.button`
    padding: 0.4rem 1rem;
    background-color: ${(props) =>
        props.$active
            ? "var(--primary-button-color)"
            : "var(--secondary-button-color)"};
    color: ${(props) =>
        props.$active
            ? "var(--primary-button-color-text)"
            : "var(--secondary-button-color-text)"};
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 1.2rem;

    &:hover {
        background-color: ${(props) =>
            props.$active
                ? "var(--primary-button-color-hover)"
                : "var(--secondary-button-color-active)"};
    }

    &:first-of-type {
        border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);
    }

    &:last-of-type {
        border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
    }
`;

const TRIGGER_EVENTS = [
    { value: "MATCH_ENDED", label: "Match Ended" },
    { value: "GOAL_SCORED", label: "Goal Scored" },
    { value: "SEASON_ENDED", label: "Season Ended" },
];

function AchievementForm({ achievement, categories, achievements, onClose }) {
    const { createAchievement, isLoading: isCreating } = useCreateAchievement();
    const { updateAchievement, isLoading: isUpdating } = useUpdateAchievement();

    const [conditionMode, setConditionMode] = useState("builder"); // 'builder' or 'json'

    const [formData, setFormData] = useState({
        key: achievement?.key || "",
        name: achievement?.name || "",
        description: achievement?.description || "",
        categoryId: achievement?.category_id || categories[0]?.id || "",
        triggerEvent: achievement?.trigger_event || "MATCH_ENDED",
        condition: achievement?.condition || {
            type: "counter",
            metric: "wins",
        },
        points: achievement?.points || 10,
        icon: achievement?.icon || "",
        isHidden: achievement?.is_hidden || false,
        isRepeatable: achievement?.is_repeatable || false,
        maxProgress: achievement?.max_progress || 1,
        parentId: achievement?.parent_id || "",
        sortOrder: achievement?.sort_order || 0,
    });

    const isEditing = !!achievement;
    const isLoading = isCreating || isUpdating;

    // Filter out current achievement from parent options (can't be its own parent)
    const parentOptions = (achievements || []).filter(
        (a) => a.id !== achievement?.id
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = {
            ...formData,
            parentId: formData.parentId || null,
        };

        if (isEditing) {
            updateAchievement(
                { id: achievement.id, ...data },
                { onSuccess: onClose }
            );
        } else {
            createAchievement(data, { onSuccess: onClose });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                    ? Number(value)
                    : value,
        }));
    };

    const handleConditionChange = (newCondition) => {
        setFormData((prev) => ({
            ...prev,
            condition: newCondition,
        }));
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <Modal>
                <Title>
                    {isEditing ? "Edit Achievement" : "New Achievement"}
                </Title>
                <Form onSubmit={handleSubmit}>
                    <FormGrid>
                        <FormRow>
                            <Label htmlFor="key">Key (unique identifier)</Label>
                            <Input
                                id="key"
                                name="key"
                                value={formData.key}
                                onChange={handleChange}
                                placeholder="e.g., first_win, centurion"
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
                                placeholder="e.g., First Blood"
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
                            placeholder="Win your first match"
                            required
                        />
                    </FormRow>

                    <FormGrid>
                        <FormRow>
                            <Label htmlFor="categoryId">Category</Label>
                            <Select
                                id="categoryId"
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </Select>
                        </FormRow>

                        <FormRow>
                            <Label htmlFor="triggerEvent">Trigger Event</Label>
                            <Select
                                id="triggerEvent"
                                name="triggerEvent"
                                value={formData.triggerEvent}
                                onChange={handleChange}
                                required
                            >
                                {TRIGGER_EVENTS.map((event) => (
                                    <option
                                        key={event.value}
                                        value={event.value}
                                    >
                                        {event.label}
                                    </option>
                                ))}
                            </Select>
                        </FormRow>
                    </FormGrid>

                    <FormGrid>
                        <FormRow>
                            <Label htmlFor="points">Points</Label>
                            <Input
                                id="points"
                                name="points"
                                type="number"
                                min="1"
                                value={formData.points}
                                onChange={handleChange}
                            />
                        </FormRow>

                        <FormRow>
                            <Label htmlFor="maxProgress">
                                Max Progress (target)
                            </Label>
                            <Input
                                id="maxProgress"
                                name="maxProgress"
                                type="number"
                                min="1"
                                value={formData.maxProgress}
                                onChange={handleChange}
                            />
                        </FormRow>
                    </FormGrid>

                    <FormGrid>
                        <FormRow>
                            <Label htmlFor="icon">Icon (emoji)</Label>
                            <Input
                                id="icon"
                                name="icon"
                                value={formData.icon}
                                onChange={handleChange}
                                placeholder="e.g., 🏆, ⚽, 🔥"
                            />
                        </FormRow>

                        <FormRow>
                            <Label htmlFor="parentId">
                                Parent Achievement (for chains)
                            </Label>
                            <Select
                                id="parentId"
                                name="parentId"
                                value={formData.parentId}
                                onChange={handleChange}
                            >
                                <option value="">None</option>
                                {parentOptions.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.icon} {a.name}
                                    </option>
                                ))}
                            </Select>
                        </FormRow>
                    </FormGrid>

                    <FormGrid>
                        <CheckboxRow>
                            <Checkbox
                                id="isHidden"
                                name="isHidden"
                                type="checkbox"
                                checked={formData.isHidden}
                                onChange={handleChange}
                            />
                            <Label htmlFor="isHidden">
                                Hidden (only visible after unlock)
                            </Label>
                        </CheckboxRow>

                        <CheckboxRow>
                            <Checkbox
                                id="isRepeatable"
                                name="isRepeatable"
                                type="checkbox"
                                checked={formData.isRepeatable}
                                onChange={handleChange}
                            />
                            <Label htmlFor="isRepeatable">
                                Repeatable (can be earned multiple times)
                            </Label>
                        </CheckboxRow>
                    </FormGrid>

                    <ConditionSection>
                        <ConditionHeader>
                            <ConditionTitle>Condition</ConditionTitle>
                            <div>
                                <ToggleButton
                                    type="button"
                                    $active={conditionMode === "builder"}
                                    onClick={() => setConditionMode("builder")}
                                >
                                    Builder
                                </ToggleButton>
                                <ToggleButton
                                    type="button"
                                    $active={conditionMode === "json"}
                                    onClick={() => setConditionMode("json")}
                                >
                                    JSON
                                </ToggleButton>
                            </div>
                        </ConditionHeader>

                        {conditionMode === "builder" ? (
                            <ConditionBuilder
                                condition={formData.condition}
                                onChange={handleConditionChange}
                            />
                        ) : (
                            <ConditionJsonEditor
                                condition={formData.condition}
                                onChange={handleConditionChange}
                            />
                        )}
                    </ConditionSection>

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
                                ? "Update"
                                : "Create"}
                        </Button>
                    </ButtonRow>
                </Form>
            </Modal>
        </>
    );
}

export default AchievementForm;
