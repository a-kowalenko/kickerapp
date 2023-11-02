import styled from "styled-components";
import ProfileMenu from "./ProfileMenu";
import RightNav from "./RightNav";

const StyledSidebar = styled.aside`
    display: flex;
    align-items: end;
    flex-direction: column;
    padding: 1.2rem 2.4rem;
    background-color: var(--color-amber-75);
    grid-row: 1 / -1;
    grid-column: 3;
    border-right: 1px solid var(--color-amber-100);
    gap: 3.2rem;

    justify-content: space-between;
`;

function RightSidebar() {
    return (
        <StyledSidebar>
            <ProfileMenu />
            <RightNav />
        </StyledSidebar>
    );
}

export default RightSidebar;
