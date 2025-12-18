import styled from "styled-components";
import { useState } from "react";
import Button from "../../../ui/Button";
import { useCreateCategory, useUpdateCategory } from "../useCategoryMutations";

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
    max-width: 50rem;
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

const ButtonRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    margin-top: 1rem;
`;

function CategoryForm({ category, onClose }) {
    const { createCategory, isLoading: isCreating } = useCreateCategory();
    const { updateCategory, isLoading: isUpdating } = useUpdateCategory();

    const [formData, setFormData] = useState({
        key: category?.key || "",
        name: category?.name || "",
        description: category?.description || "",
        icon: category?.icon || "",
        sortOrder: category?.sort_order || 0,
    });

    const isEditing = !!category;
    const isLoading = isCreating || isUpdating;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEditing) {
            updateCategory(
                { id: category.id, ...formData },
                { onSuccess: onClose }
            );
        } else {
            createCategory(formData, { onSuccess: onClose });
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    return (
        <>
            <Overlay onClick={onClose} />
            <Modal>
                <Title>{isEditing ? "Edit Category" : "New Category"}</Title>
                <Form onSubmit={handleSubmit}>
                    <FormRow>
                        <Label htmlFor="key">Key (unique identifier)</Label>
                        <Input
                            id="key"
                            name="key"
                            value={formData.key}
                            onChange={handleChange}
                            placeholder="e.g., matches, goals, special"
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
                            placeholder="e.g., Match Achievements"
                            required
                        />
                    </FormRow>

                    <FormRow>
                        <Label htmlFor="description">Description</Label>
                        <TextArea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Optional description"
                        />
                    </FormRow>

                    <FormRow>
                        <Label htmlFor="icon">Icon (emoji)</Label>
                        <Input
                            id="icon"
                            name="icon"
                            value={formData.icon}
                            onChange={handleChange}
                            placeholder="e.g., ⚽, 🏆, 🎯"
                        />
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

export default CategoryForm;
