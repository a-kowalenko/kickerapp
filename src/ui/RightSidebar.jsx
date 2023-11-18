import styled from "styled-components";
import ProfileMenu from "./ProfileMenu";
import RightNav from "./RightNav";
import { media } from "../utils/constants";

const StyledSidebar = styled.aside`
    display: flex;
    align-items: end;
    flex-direction: column;
    padding: 1.2rem 2.4rem;
    background-color: var(--primary-background-color);
    grid-row: 1 / -1;
    grid-column: 3;
    border-left: 1px solid var(--secondary-border-color);
    gap: 3.2rem;

    justify-content: space-between;

    ${media.tablet} {
        display: none;
    }
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
