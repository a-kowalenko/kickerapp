import { NavLink } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
    HiOutlineBookOpen,
    HiOutlineCog6Tooth,
    HiOutlineHome,
    HiOutlineListBullet,
    HiOutlinePlay,
    HiOutlineTrash,
    HiPlus,
} from "react-icons/hi2";
import Divider from "./Divider";
import { useMatchContext } from "../contexts/MatchContext";

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
    border-radius: var(--border-radius-sm);
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

const pulseAnimation = keyframes`
  0%, 100% { 
    box-shadow: 0 0 5px var(--pulse-color-heavily-transparent);
    background-color: var(--pulse-color-transparent);
 }
  50% { 
    box-shadow: 0 0 20px var(--pulse-color-slightly-transparent); 
    background-color: var(--pulse-color-medium-transparent);
  }
`;

const ActiveMatchListElement = styled.li`
    border-radius: var(--border-radius-sm);
    animation: ${pulseAnimation} 2s infinite;

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

function MainNav({ close }) {
    const { activeMatch } = useMatchContext();

    return (
        <StyledMainNav>
            <NavList>
                <li>
                    <StyledNavLink to="/home" title="Home" onClick={close}>
                        <HiOutlineHome />
                        <span>Home</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/rankings"
                        title="Rankings"
                        onClick={close}
                    >
                        <HiOutlineListBullet />
                        <span>Rankings</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/fatalities"
                        title="Fatalities"
                        onClick={close}
                    >
                        <HiOutlineTrash />
                        <span>Fatalities</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/matches"
                        title="Matches"
                        onClick={close}
                    >
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
                    <StyledNavLink
                        to="/settings"
                        title="Settings"
                        onClick={close}
                    >
                        <HiOutlineCog6Tooth />
                        <span>Settings</span>
                    </StyledNavLink>
                </li>
                <Divider $variation="horizontal" />

                {activeMatch ? (
                    <ActiveMatchListElement>
                        <StyledNavLink
                            to={`/matches/${activeMatch.id}`}
                            title="Active Match"
                            onClick={close}
                        >
                            <HiOutlinePlay />
                            <span>Active Match</span>
                        </StyledNavLink>
                    </ActiveMatchListElement>
                ) : (
                    <NewMatchListElement>
                        <StyledNavLink
                            to="/matches/create"
                            title="New match"
                            onClick={close}
                        >
                            <HiPlus />
                            <span>New match</span>
                        </StyledNavLink>
                    </NewMatchListElement>
                )}
            </NavList>
            <NavList></NavList>
        </StyledMainNav>
    );
}

export default MainNav;
