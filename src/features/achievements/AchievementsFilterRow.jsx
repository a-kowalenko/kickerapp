import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import Filter from "../../ui/Filter";
import { HiOutlineFunnel, HiOutlineCheckCircle } from "react-icons/hi2";
import { useAchievementCategories } from "./useAchievementCategories";

const FilterRowContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    margin-bottom: 2rem;
`;

const FiltersRow = styled.div`
    display: flex;
    gap: 1.6rem;
    flex-wrap: wrap;
`;

const ScopeTabsContainer = styled.div`
    display: flex;
    gap: 0.4rem;
    background-color: var(--color-grey-100);
    padding: 0.4rem;
    border-radius: var(--border-radius-sm);
    width: fit-content;
`;

const ScopeTab = styled.button`
    padding: 0.8rem 1.6rem;
    border: none;
    border-radius: var(--border-radius-sm);
    font-weight: 500;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.2s;

    background-color: ${(props) =>
        props.$active ? "var(--color-brand-600)" : "transparent"};
    color: ${(props) =>
        props.$active ? "var(--color-brand-50)" : "var(--color-grey-600)"};

    &:hover {
        background-color: ${(props) =>
            props.$active ? "var(--color-brand-700)" : "var(--color-grey-200)"};
    }
`;

const statusOptions = [
    { text: "All", value: "all" },
    { text: "Completed", value: "completed" },
    { text: "In Progress", value: "in-progress" },
    { text: "Locked", value: "locked" },
];

const scopeOptions = [
    { value: "season", label: "Current Season" },
    { value: "alltime", label: "All Time" },
];

function AchievementsFilterRow() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { categories } = useAchievementCategories();

    const currentScope = searchParams.get("scope") || "season";

    const categoryOptions = [
        { text: "All Categories", value: "all" },
        ...(categories || []).map((cat) => ({
            text: cat.name,
            value: cat.id.toString(),
        })),
    ];

    const handleScopeChange = (scope) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("scope", scope);
        setSearchParams(newParams);
    };

    return (
        <FilterRowContainer>
            <ScopeTabsContainer>
                {scopeOptions.map((option) => (
                    <ScopeTab
                        key={option.value}
                        $active={currentScope === option.value}
                        onClick={() => handleScopeChange(option.value)}
                    >
                        {option.label}
                    </ScopeTab>
                ))}
            </ScopeTabsContainer>
            <FiltersRow>
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
            </FiltersRow>
        </FilterRowContainer>
    );
}

export default AchievementsFilterRow;
