import styled from "styled-components";
import Filter from "../../ui/Filter";
import { PiGameControllerLight } from "react-icons/pi";

const StyledFilterRow = styled.div`
    display: flex;
    align-items: center;
    margin: 0 0 1rem 0;
`;

function MatchesFilterRow() {
    const options = [
        { value: "all" },
        { value: "1on1" },
        { value: "2on2" },
        { value: "2on1" },
    ];
    const field = "gamemode";

    return (
        <StyledFilterRow>
            <Filter
                options={options}
                field={field}
                icon={<PiGameControllerLight />}
            />
        </StyledFilterRow>
    );
}

export default MatchesFilterRow;
