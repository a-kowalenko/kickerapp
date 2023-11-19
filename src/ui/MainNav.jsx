import { NavLink } from "react-router-dom";
import styled from "styled-components";
import {
    HiOutlineBookOpen,
    HiOutlineCog6Tooth,
    HiOutlineHome,
    HiOutlineListBullet,
    HiOutlineTrash,
    HiPlus,
} from "react-icons/hi2";

const StyledMainNav = styled.nav`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-grow: 1;
`;

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

const NewMatchListElement = styled.li`
    border-top: 1px solid var(--primary-border-color);
    padding-top: 1rem;

    & a:active:not(:hover),
    & a.active:link:not(:hover) {
        color: unset;
        background-color: unset;
        border-radius: unset;
    }

    & a:active:not(:hover) svg,
    & a.active:link:not(:hover) svg,
    & a.active:visited:not(:hover) svg {
        color: var(--nav-link-svg-color);
    }

    & a:hover {
        color: var(--nav-link-color-active);
        background-color: var(--nav-link-background-color-active);
        border-radius: var(--border-radius-sm);
    }

    & a:hover svg {
        color: var(--nav-link-svg-color-active);
    }
`;

function MainNav() {
    return (
        <StyledMainNav>
            <NavList>
                <li>
                    <StyledNavLink to="/home" title="Home">
                        <HiOutlineHome />
                        <span>Home</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink to="/rankings" title="Rankings">
                        <HiOutlineListBullet />
                        <span>Rankings</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink to="/disgraces" title="Disgraces">
                        <HiOutlineTrash />
                        <span>Schande</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink to="/matches" title="Matches">
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
                    <StyledNavLink to="/settings" title="Settings">
                        <HiOutlineCog6Tooth />
                        <span>Settings</span>
                    </StyledNavLink>
                </li>
                <NewMatchListElement>
                    <StyledNavLink to="/matches/create" title="New match">
                        <HiPlus />
                        <span>New match</span>
                    </StyledNavLink>
                </NewMatchListElement>
            </NavList>
            <NavList></NavList>
        </StyledMainNav>
    );
}

export default MainNav;
