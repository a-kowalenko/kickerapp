import styled, { keyframes } from "styled-components";
import ScrollAwareNavLink from "./ScrollAwareNavLink";
import {
    HiOutlineBookOpen,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCog6Tooth,
    HiOutlineHome,
    HiOutlineListBullet,
    HiOutlinePlay,
    HiOutlineTrash,
    HiOutlineTrophy,
    HiOutlineUserGroup,
    HiOutlineShieldCheck,
    HiPlus,
} from "react-icons/hi2";
import Divider from "./Divider";
import { useMatchContext } from "../contexts/MatchContext";
import { useKickerInfo } from "../hooks/useKickerInfo";
import { useUser } from "../features/authentication/useUser";
import SeasonBadge from "../features/seasons/SeasonBadge";
import { media } from "../utils/constants";
import useWindowWidth from "../hooks/useWindowWidth";

const StyledMainNav = styled.nav`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-grow: 1;
    // not scrollable itself, but its children can be
    overflow: hidden;
`;

const NavList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    overflow: auto;

    // make scrollbar invisible but still scrollable
    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
`;

const SeasonBadgeContainer = styled.div`
    display: none;
    padding: 1.2rem 0;
    justify-content: center;

    ${media.tablet} {
        display: flex;
    }
`;

const StyledNavLink = styled(ScrollAwareNavLink)`
    border-radius: var(--border-radius-sm);
    &:link,
    &:visited {
        display: flex;
        align-items: center;
        gap: 1.2rem;

        color: var(--nav-link-color);
        font-size: 1.6rem;
        font-weight: 500;
        padding: 1.2rem 1.4rem;
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
    const { data: kickerData } = useKickerInfo();
    const { user } = useUser();
    const { isDesktop } = useWindowWidth();

    const isAdmin = kickerData?.admin === user?.id;

    // Only close sidebar on mobile
    const handleNavClick = isDesktop ? undefined : close;

    return (
        <StyledMainNav>
            <NavList>
                <li>
                    <StyledNavLink
                        to="/home"
                        title="Home"
                        onClick={handleNavClick}
                    >
                        <HiOutlineHome />
                        <span>Home</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/rankings"
                        title="Rankings"
                        onClick={handleNavClick}
                    >
                        <HiOutlineListBullet />
                        <span>Rankings</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/fatalities"
                        title="Fatalities"
                        onClick={handleNavClick}
                    >
                        <HiOutlineTrash />
                        <span>Fatalities</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/matches"
                        title="Matches"
                        onClick={handleNavClick}
                    >
                        <HiOutlineBookOpen />
                        <span>Matches</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/achievements"
                        title="Achievements"
                        onClick={handleNavClick}
                    >
                        <HiOutlineTrophy />
                        <span>Achievements</span>
                    </StyledNavLink>
                </li>
                <li>
                    <StyledNavLink
                        to="/teams"
                        title="Teams"
                        onClick={handleNavClick}
                    >
                        <HiOutlineUserGroup />
                        <span>Teams</span>
                    </StyledNavLink>
                </li>
                {/* <li>
                    <StyledNavLink to="/players">
                        <HiOutlineUsers />
                        <span>Players</span>
                    </StyledNavLink>
                </li> */}

                {isDesktop && (
                    <li>
                        <StyledNavLink
                            to="/chat"
                            title="Chat"
                            onClick={handleNavClick}
                        >
                            <HiOutlineChatBubbleLeftRight />
                            <span>Chat</span>
                        </StyledNavLink>
                    </li>
                )}
                <li>
                    <StyledNavLink
                        to="/settings"
                        title="Settings"
                        onClick={handleNavClick}
                    >
                        <HiOutlineCog6Tooth />
                        <span>Settings</span>
                    </StyledNavLink>
                </li>
                {isAdmin && (
                    <li>
                        <StyledNavLink
                            to="/admin"
                            title="Admin"
                            onClick={handleNavClick}
                        >
                            <HiOutlineShieldCheck />
                            <span>Admin</span>
                        </StyledNavLink>
                    </li>
                )}
                <Divider $variation="horizontal" />

                {activeMatch ? (
                    <ActiveMatchListElement>
                        <StyledNavLink
                            to={`/matches/${activeMatch.id}`}
                            title="Active Match"
                            onClick={handleNavClick}
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
                            onClick={handleNavClick}
                        >
                            <HiPlus />
                            <span>New match</span>
                        </StyledNavLink>
                    </NewMatchListElement>
                )}
            </NavList>
            <NavList>
                <SeasonBadgeContainer>
                    <SeasonBadge openUpwards={true} />
                </SeasonBadgeContainer>
            </NavList>
        </StyledMainNav>
    );
}

export default MainNav;
