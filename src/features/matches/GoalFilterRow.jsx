import styled from "styled-components";
import Filter from "../../ui/Filter";
import { HiArrowsUpDown } from "react-icons/hi2";

const StyledFilterRow = styled.div`
    display: flex;
    align-items: center;
    margin: 0 0 1rem 0;
`;

function GoalsFilterRow() {
    const options = [
        { text: "Ascending", value: "asc" },
        { text: "Descending", value: "desc" },
    ];
    const field = "sort";

    return (
        <StyledFilterRow>
            <Filter
                name="goals"
                options={options}
                field={field}
                icon={<HiArrowsUpDown />}
            />
        </StyledFilterRow>
    );
}

export default GoalsFilterRow;
