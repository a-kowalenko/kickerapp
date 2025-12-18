import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import Filter from "../../ui/Filter";
import { HiOutlineFunnel, HiOutlineCheckCircle } from "react-icons/hi2";
import { useAchievementCategories } from "./useAchievementCategories";

const FilterRowContainer = styled.div`
    display: flex;
    gap: 1.6rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
`;

const statusOptions = [
    { text: "All", value: "all" },
    { text: "Completed", value: "completed" },
    { text: "In Progress", value: "in-progress" },
    { text: "Locked", value: "locked" },
];

function AchievementsFilterRow() {
    const { categories } = useAchievementCategories();

    const categoryOptions = [
        { text: "All Categories", value: "all" },
        ...(categories || []).map((cat) => ({
            text: cat.name,
            value: cat.id.toString(),
        })),
    ];

    return (
        <FilterRowContainer>
            <Filter
                name="achievements"
                options={categoryOptions}
                field="category"
                icon={<HiOutlineFunnel />}
            />
            <Filter
                name="achievements"
                options={statusOptions}
                field="status"
                icon={<HiOutlineCheckCircle />}
            />
        </FilterRowContainer>
    );
}

export default AchievementsFilterRow;
