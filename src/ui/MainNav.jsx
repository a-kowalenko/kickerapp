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

        color: var(--color-grey-600);
        font-size: 1.6rem;
        font-weight: 500;
        padding: 1.2rem 2.4rem;
        transition: all 0.3s;
    }

    &:hover,
    &:active,
    &.active:link,
    &.active:visited {
        color: var(--color-grey-800); // todo
        background-color: var(--color-amber-200); // todo
        border-radius: var(--border-radius-sm);
    }

    & svg {
        width: 2.4rem;
        height: 2.4rem;
        color: var(--color-grey-400);
        transition: all 0.3s;
    }

    &:hover svg,
    &:active svg,
    &.active:link svg,
    &.active:visited svg {
        color: var(--color-brand-600);
    }
`;

function MainNav() {
    return (
        <nav>
            <NavList>
                <li>
                    <StyledNavLink to="/">
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
                    <StyledNavLink to="/shame">
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
                <li>
                    <StyledNavLink to="/settings">
                        <HiOutlineCog6Tooth />
                        <span>Settings</span>
                    </StyledNavLink>
                </li>
            </NavList>
        </nav>
    );
}

export default MainNav;
