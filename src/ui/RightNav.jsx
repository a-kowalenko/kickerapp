import styled from "styled-components";
import NewMatchButton from "../features/home/NewMatchButton";

const NavList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

function RightNav() {
    return (
        <nav>
            <NavList>
                <li>
                    <NewMatchButton />
                </li>
            </NavList>
        </nav>
    );
}

export default RightNav;
