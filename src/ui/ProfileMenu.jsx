import styled from "styled-components";
import { useState } from "react";
import {
    HiMiniArrowLeftOnRectangle,
    HiOutlineUserCircle,
    HiArrowRightOnRectangle,
    HiOutlineMoon,
    HiOutlineSun,
} from "react-icons/hi2";
import { useLogout } from "../features/authentication/useLogout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import { usePlayerStatusForAvatar } from "../features/players/usePlayerStatus";
import { useKicker } from "../contexts/KickerContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import useWindowWidth from "../hooks/useWindowWidth";
import { media } from "../utils/constants";
import SpinnerMini from "./SpinnerMini";
import { BountyCard } from "./BountyCard";

const ProfileMenuWrapper = styled.div`
    position: relative;
`;

const StyledList = styled.ul`
    position: absolute;
    width: max-content;
    min-width: 100%;
    background-color: var(--color-grey-0);
    box-shadow: var(--shadow-md);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    overflow: hidden;
    top: 110%;
    right: 0;
    z-index: 10;
`;

const StyledButton = styled.button`
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 1.2rem 2.4rem;
    font-size: 1.4rem;
    transition: all 0.2s;

    display: flex;
    align-items: center;
    gap: 1.6rem;

    &:hover {
        background-color: var(--color-grey-50);
    }

    & svg {
        width: 2rem;
        height: 2rem;
        transition: all 0.3s;
    }
`;

const MobileOnlyItem = styled.li`
    display: none;

    ${media.tablet} {
        display: block;
    }
`;

const Divider = styled.hr`
    border: none;
    border-top: 1px solid var(--primary-border-color);
    margin: 0.5rem 0;
    display: none;

    ${media.tablet} {
        display: block;
    }
`;

function ProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const close = () => setIsOpen(false);
    const { logout } = useLogout();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dropdownRef = useOutsideClick(close);
    const { setCurrentKicker } = useKicker();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { windowWidth } = useWindowWidth();
    const isMobile = windowWidth <= media.maxTablet;

    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();
    const { bestStreak, totalBounty, primaryStatusAsset } =
        usePlayerStatusForAvatar(player?.id);

    function handleToggle() {
        setIsOpen((open) => !open);
    }

    function goToProfile(e) {
        e.stopPropagation();
        close();
        const seasonParam = searchParams.get("season");
        const queryString = seasonParam ? `?season=${seasonParam}` : "";
        navigate(`/user/${player.name}/profile${queryString}`);
    }

    function handleLogout() {
        close();
        logout();
    }

    function handleExitKicker(e) {
        e.stopPropagation();
        close();
        setCurrentKicker(null);
        navigate("/");
    }

    function handleToggleDarkMode(e) {
        e.stopPropagation();
        toggleDarkMode();
        // Don't close menu after toggle so user can see the change
    }

    if (isLoadingPlayer) {
        return <SpinnerMini />;
    }

    return (
        <ProfileMenuWrapper ref={dropdownRef}>
            <BountyCard
                player={player}
                bounty={totalBounty}
                streak={bestStreak}
                status={primaryStatusAsset}
                size="small"
                onClick={handleToggle}
                showGamemode={false}
                showStatusBadge={true}
                showTargetIcon={false}
                showLabel={true}
            />

            {isOpen && (
                <StyledList>
                    <li>
                        <StyledButton onClick={goToProfile}>
                            <HiOutlineUserCircle />
                            Profile
                        </StyledButton>
                    </li>

                    {/* Mobile-only items */}
                    <Divider />
                    <MobileOnlyItem>
                        <StyledButton onClick={handleToggleDarkMode}>
                            {isDarkMode ? <HiOutlineSun /> : <HiOutlineMoon />}
                            {isDarkMode ? "Light Mode" : "Dark Mode"}
                        </StyledButton>
                    </MobileOnlyItem>
                    <MobileOnlyItem>
                        <StyledButton onClick={handleExitKicker}>
                            <HiArrowRightOnRectangle />
                            Exit Kicker
                        </StyledButton>
                    </MobileOnlyItem>
                    <Divider />

                    <li>
                        <StyledButton onClick={handleLogout}>
                            <HiMiniArrowLeftOnRectangle />
                            Logout
                        </StyledButton>
                    </li>
                </StyledList>
            )}
        </ProfileMenuWrapper>
    );
}

export default ProfileMenu;
