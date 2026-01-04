import styled from "styled-components";
import DarkModeToggle from "./DarkModeToggle";
import SoundToggle from "./SoundToggle";
import { useKickerInfo } from "../hooks/useKickerInfo";
import SpinnerMini from "./SpinnerMini";
import { useUserKickers } from "../features/kicker/useUserKickers";
import Dropdown from "./Dropdown";
import { useKicker } from "../contexts/KickerContext";
import { useNavigate } from "react-router-dom";
import ButtonIcon from "./ButtonIcon";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { media } from "../utils/constants";
import ProfileMenu from "./ProfileMenu";
import useWindowWidth from "../hooks/useWindowWidth";
import { useMatchContext } from "../contexts/MatchContext";
import MiniActiveMatchInfo from "./MiniActiveMatchInfo";
import { useEffect } from "react";
import { useState } from "react";
import SeasonBadge from "../features/seasons/SeasonBadge";
import NotificationBell from "../features/notifications/NotificationBell";

const StyledHeader = styled.header`
    background-color: var(--primary-background-color);
    padding: 1.6rem 4.8rem;
    border-bottom: 1px solid var(--secondary-border-color);

    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    // sticky:
    /* position: sticky;
    top: 0;
    z-index: 100;
    grid-column: 2 / -1; */

    ${media.tablet} {
        justify-content: flex-end;
        padding: 1.6rem 2.4rem;
    }

    @media (max-width: 850px) {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
        height: 66px;
    }
`;

const KickerInfoWrapper = styled.div`
    display: flex;
    align-items: center;
    /* width: 40rem; */
    gap: 2.4rem;

    @media (max-width: 850px) {
        padding-left: 2rem;
    }

    ${media.tablet} {
        display: none;
    }
`;

const ToggleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;
`;

const DesktopOnly = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;

    ${media.tablet} {
        display: none;
    }
`;

function Header() {
    const navigate = useNavigate();
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();
    const { kickers, isLoadingKickers } = useUserKickers();
    const { setCurrentKicker } = useKicker();
    const { activeMatch } = useMatchContext();
    const { windowWidth } = useWindowWidth();
    const showLeaveKicker = windowWidth <= media.maxTablet;
    const [showActiveMatch, setShowActiveMatch] = useState(!!activeMatch);

    function handleKickerSelect(option) {
        setCurrentKicker(option);
        navigate("/home");
    }

    useEffect(() => {
        const isOpen = localStorage.getItem("isOpenLeftSidebar") === "true";
        if (activeMatch && isOpen && windowWidth > 1100) {
            setShowActiveMatch(true);
        } else if (activeMatch && !isOpen && windowWidth > 950) {
            setShowActiveMatch(true);
        } else {
            setShowActiveMatch(false);
        }
    }, [windowWidth, activeMatch]);

    return (
        <StyledHeader>
            <KickerInfoWrapper>
                {isLoadingKickerData || isLoadingKickers || !kickers ? (
                    <SpinnerMini />
                ) : (
                    <>
                        <Dropdown
                            options={kickers.map((kicker) => ({
                                text: kicker.name,
                                value: kicker.id,
                            }))}
                            onSelect={handleKickerSelect}
                            initSelected={{
                                text: kickerData.name,
                                value: kickerData.id,
                            }}
                        />
                        <SeasonBadge />
                        <ButtonIcon
                            onClick={() => {
                                setCurrentKicker(null);
                                navigate("/");
                            }}
                            title="Exit kicker"
                        >
                            <HiArrowRightOnRectangle />
                        </ButtonIcon>
                    </>
                )}
            </KickerInfoWrapper>

            {showActiveMatch && <MiniActiveMatchInfo />}

            <ToggleWrapper>
                <DesktopOnly>
                    {showLeaveKicker && (
                        <ButtonIcon
                            onClick={() => {
                                setCurrentKicker(null);
                                navigate("/");
                            }}
                            title="Exit kicker"
                        >
                            <HiArrowRightOnRectangle />
                        </ButtonIcon>
                    )}
                </DesktopOnly>
                <DesktopOnly>
                    <SoundToggle />
                </DesktopOnly>
                <DesktopOnly>
                    <DarkModeToggle />
                </DesktopOnly>
                <DesktopOnly>
                    <NotificationBell />
                </DesktopOnly>
                <ProfileMenu />
            </ToggleWrapper>
        </StyledHeader>
    );
}

export default Header;
