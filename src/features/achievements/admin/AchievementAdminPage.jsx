import styled from "styled-components";
import { useState } from "react";
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
} from "react-icons/hi2";
import Heading from "../../../ui/Heading";
import Button from "../../../ui/Button";
import Spinner from "../../../ui/Spinner";
import { useAchievementDefinitions } from "../useAchievementDefinitions";
import { useAchievementCategories } from "../useAchievementCategories";
import { useDeleteAchievement } from "../useAchievementMutations";
import { useDeleteCategory } from "../useCategoryMutations";
import { useKickerInfo } from "../../../hooks/useKickerInfo";
import { useUser } from "../../authentication/useUser";
import AchievementForm from "./AchievementForm";
import CategoryForm from "./CategoryForm";

const StyledAdmin = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const Section = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    padding: 2.4rem;
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.6rem;
`;

const SectionTitle = styled.h2`
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
`;

const Th = styled.th`
    text-align: left;
    padding: 1.2rem;
    border-bottom: 2px solid var(--color-grey-200);
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--secondary-text-color);
`;

const Td = styled.td`
    padding: 1.2rem;
    border-bottom: 1px solid var(--color-grey-100);
    font-size: 1.4rem;
`;

const Actions = styled.div`
    display: flex;
    gap: 0.8rem;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    color: var(--secondary-text-color);
    transition: color 0.2s;

    &:hover {
        color: var(--primary-text-color);
    }

    &:hover.delete {
        color: var(--color-red-700);
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

const NoData = styled.div`
    text-align: center;
    padding: 2rem;
    color: var(--tertiary-text-color);
`;

const AccessDenied = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: var(--tertiary-text-color);

    h2 {
        margin-bottom: 1rem;
    }
`;

const Badge = styled.span`
    display: inline-block;
    padding: 0.2rem 0.6rem;
    font-size: 1rem;
    border-radius: var(--border-radius-sm);
    background-color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-100)"
            : props.$variant === "warning"
            ? "var(--color-yellow-100)"
            : "var(--color-grey-100)"};
    color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-700)"
            : props.$variant === "warning"
            ? "var(--color-yellow-700)"
            : "var(--color-grey-700)"};
`;

function AchievementAdminPage() {
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { user, isLoading: isLoadingUser } = useUser();
    const { definitions, isLoading: isLoadingDefinitions } =
        useAchievementDefinitions();
    const { categories, isLoading: isLoadingCategories } =
        useAchievementCategories();
    const { deleteAchievement, isLoading: isDeletingAchievement } =
        useDeleteAchievement();
    const { deleteCategory, isLoading: isDeletingCategory } =
        useDeleteCategory();

    const [showAchievementForm, setShowAchievementForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    const isLoading =
        isLoadingKicker ||
        isLoadingUser ||
        isLoadingDefinitions ||
        isLoadingCategories;
    const isAdmin = kickerData?.admin === user?.id;

    if (isLoading) {
        return <Spinner />;
    }

    if (!isAdmin) {
        return (
            <AccessDenied>
                <h2>Access Denied</h2>
                <p>You must be a kicker admin to manage achievements.</p>
            </AccessDenied>
        );
    }

    const handleEditAchievement = (achievement) => {
        setEditingAchievement(achievement);
        setShowAchievementForm(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowCategoryForm(true);
    };

    const handleDeleteAchievement = (id) => {
        if (
            window.confirm("Are you sure you want to delete this achievement?")
        ) {
            deleteAchievement(id);
        }
    };

    const handleDeleteCategory = (id) => {
        if (
            window.confirm(
                "Are you sure you want to delete this category? All achievements in this category will also be deleted."
            )
        ) {
            deleteCategory(id);
        }
    };

    const handleCloseAchievementForm = () => {
        setShowAchievementForm(false);
        setEditingAchievement(null);
    };

    const handleCloseCategoryForm = () => {
        setShowCategoryForm(false);
        setEditingCategory(null);
    };

    return (
        <StyledAdmin>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Achievement Admin
            </Heading>

            {/* Categories Section */}
            <Section>
                <SectionHeader>
                    <SectionTitle>Categories</SectionTitle>
                    <Button
                        $size="small"
                        onClick={() => setShowCategoryForm(true)}
                    >
                        <HiOutlinePlus /> Add Category
                    </Button>
                </SectionHeader>

                {categories && categories.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Icon</Th>
                                <Th>Key</Th>
                                <Th>Name</Th>
                                <Th>Order</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <Td>{category.icon || "📋"}</Td>
                                    <Td>
                                        <code>{category.key}</code>
                                    </Td>
                                    <Td>{category.name}</Td>
                                    <Td>{category.sort_order}</Td>
                                    <Td>
                                        <Actions>
                                            <IconButton
                                                onClick={() =>
                                                    handleEditCategory(category)
                                                }
                                            >
                                                <HiOutlinePencil />
                                            </IconButton>
                                            <IconButton
                                                className="delete"
                                                onClick={() =>
                                                    handleDeleteCategory(
                                                        category.id
                                                    )
                                                }
                                                disabled={isDeletingCategory}
                                            >
                                                <HiOutlineTrash />
                                            </IconButton>
                                        </Actions>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <NoData>
                        No categories yet. Create one to get started!
                    </NoData>
                )}
            </Section>

            {/* Achievements Section */}
            <Section>
                <SectionHeader>
                    <SectionTitle>Achievements</SectionTitle>
                    <Button
                        $size="small"
                        onClick={() => setShowAchievementForm(true)}
                        disabled={!categories || categories.length === 0}
                    >
                        <HiOutlinePlus /> Add Achievement
                    </Button>
                </SectionHeader>

                {!categories || categories.length === 0 ? (
                    <NoData>
                        Create a category first before adding achievements.
                    </NoData>
                ) : definitions && definitions.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Icon</Th>
                                <Th>Key</Th>
                                <Th>Name</Th>
                                <Th>Category</Th>
                                <Th>Trigger</Th>
                                <Th>Points</Th>
                                <Th>Progress</Th>
                                <Th>Flags</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {definitions.map((achievement) => (
                                <tr key={achievement.id}>
                                    <Td>{achievement.icon || "🏆"}</Td>
                                    <Td>
                                        <code>{achievement.key}</code>
                                    </Td>
                                    <Td>{achievement.name}</Td>
                                    <Td>{achievement.category?.name}</Td>
                                    <Td>
                                        <Badge>
                                            {achievement.trigger_event}
                                        </Badge>
                                    </Td>
                                    <Td>{achievement.points}</Td>
                                    <Td>{achievement.max_progress}</Td>
                                    <Td>
                                        {achievement.is_hidden && (
                                            <Badge $variant="warning">
                                                Secret
                                            </Badge>
                                        )}{" "}
                                        {achievement.is_repeatable && (
                                            <Badge $variant="success">
                                                Repeatable
                                            </Badge>
                                        )}
                                    </Td>
                                    <Td>
                                        <Actions>
                                            <IconButton
                                                onClick={() =>
                                                    handleEditAchievement(
                                                        achievement
                                                    )
                                                }
                                            >
                                                <HiOutlinePencil />
                                            </IconButton>
                                            <IconButton
                                                className="delete"
                                                onClick={() =>
                                                    handleDeleteAchievement(
                                                        achievement.id
                                                    )
                                                }
                                                disabled={isDeletingAchievement}
                                            >
                                                <HiOutlineTrash />
                                            </IconButton>
                                        </Actions>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <NoData>
                        No achievements yet. Create one to get started!
                    </NoData>
                )}
            </Section>

            {/* Forms/Modals */}
            {showCategoryForm && (
                <CategoryForm
                    category={editingCategory}
                    onClose={handleCloseCategoryForm}
                />
            )}

            {showAchievementForm && (
                <AchievementForm
                    achievement={editingAchievement}
                    categories={categories}
                    achievements={definitions}
                    onClose={handleCloseAchievementForm}
                />
            )}
        </StyledAdmin>
    );
}

export default AchievementAdminPage;
