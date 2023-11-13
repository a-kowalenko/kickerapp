import { NavLink } from "react-router-dom";
import styled from "styled-components";
import {
    HiOutlineBookOpen,
    HiOutlineCog6Tooth,
    HiOutlineHome,
    HiOutlineListBullet,
    HiOutlineTrash,
} from "react-icons/hi2";

const NavList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const StyledNavLink = styled(NavLink)`
    &:link,
    &:visited {
        display: flex;
        align-items: center;
        gap: 1.2rem;

        color: var(--nav-link-color);
        font-size: 1.6rem;
        font-weight: 500;
        padding: 1.2rem 2.4rem;
        transition: all 0.3s;
    }

    &:hover,
    &:active,
    &.active:link,
    &.active:visited {
        color: var(--nav-link-color-active); // todo
        background-color: var(--nav-link-background-color-active); // todo
        border-radius: var(--border-radius-sm);
    }

    & svg {
        width: 2.4rem;
        height: 2.4rem;
        color: var(--nav-link-svg-color);
        transition: all 0.3s;
    }

    &:hover svg,
    &:active svg,
    &.active:link svg,
    &.active:visited svg {
        color: var(--nav-link-svg-color-active);
    }
`;

function MainNav() {
    return (
        <nav>
            <NavList>
                <li>
                    <StyledNavLink to="/home">
                        <HiOutlineHome />
                        <span>Home</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink to="/rankings">
                        <HiOutlineListBullet />
                        <span>Rankings</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink to="/disgraces">
                        <HiOutlineTrash />
                        <span>Schande</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink to="/matches">
                        <HiOutlineBookOpen />
                        <span>Matches</span>
                    </StyledNavLink>
                </li>
                {/* <li>
                    <StyledNavLink to="/players">
                        <HiOutlineUsers />
                        <span>Players</span>
                    </StyledNavLink>
                </li> */}
                <li>
                    <StyledNavLink to="/testwiese">
                        <HiOutlineCog6Tooth />
                        <span>Settings</span>
                    </StyledNavLink>
                </li>
            </NavList>
        </nav>
    );
}

export default MainNav;
