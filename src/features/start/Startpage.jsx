import styled, { keyframes } from "styled-components";
import { FaPlus, FaArrowRight } from "react-icons/fa";
import DarkModeToggle from "../../ui/DarkModeToggle";
import { useDarkMode } from "../../contexts/DarkModeContext";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../features/authentication/useUser";
import Spinner from "../../ui/Spinner";
import { useLogout } from "../../features/authentication/useLogout";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useCreateKicker } from "../../features/kicker/useCreateKicker";
import { useJoinKicker } from "../../features/kicker/useJoinKicker";
import { useUpdateKickerOrder } from "../../features/kicker/useUpdateKickerOrder";
import { FaBars } from "react-icons/fa";
import {
    HiOutlineQuestionMarkCircle,
    HiOutlineSquare3Stack3D,
} from "react-icons/hi2";
import { MdDragIndicator } from "react-icons/md";
import { useUserKickers } from "../../features/kicker/useUserKickers";
import { useKicker } from "../../contexts/KickerContext";
import ButtonIcon from "../../ui/ButtonIcon";
import { HiXMark } from "react-icons/hi2";
import { media } from "../../utils/constants";
import SpinnerMini from "../../ui/SpinnerMini";
import FeatureGrid from "./FeatureGrid";
import PlatformShowcase from "./PlatformShowcase";
import ScreenshotCarousel from "./ScreenshotCarousel";
import PublicStats from "./PublicStats";
import { screenshotsUrl } from "../../services/supabase";

// Screenshot filenames for PlatformShowcase
const PLATFORM_SCREENSHOTS = {
    desktop: `${screenshotsUrl}/dashboard-desktop.png`,
    mobile: `${screenshotsUrl}/dashboard-mobile.png`,
};

// Animations
const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const Sidebar = styled.aside`
    background-color: var(--secondary-background-color);
    color: var(--primary-text-color);
    position: fixed;
    top: 0;
    bottom: 0;
    left: -100%;
    width: 32rem;
    transition: left 0.3s ease-in-out;
    z-index: 1001;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border-radius: 0 1.2rem 1.2rem 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.active {
        left: 0;
    }

    ${media.tablet} {
        width: 100%;
        border-radius: 0;
    }
`;

const SidebarHeader = styled.div`
    background: linear-gradient(
        135deg,
        var(--primary-button-color) 0%,
        var(--primary-button-color-hover) 100%
    );
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
`;

const SidebarHeaderTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--primary-button-color-text);

    svg {
        font-size: 2.4rem;
    }

    h2 {
        font-size: 1.8rem;
        font-weight: 600;
        margin: 0;
    }
`;

const SidebarContent = styled.div`
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
`;

const SidebarBackdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;

    &.active {
        opacity: 1;
        visibility: visible;
    }
`;

const KickerList = styled.ul`
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const KickerCard = styled.li`
    cursor: pointer;
    padding: 1.2rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    background: var(--primary-background-color);
    border-radius: 1rem;
    border: 2px solid transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
        border-color: var(--primary-button-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    &:active {
        transform: scale(0.98);
    }

    &.dragging {
        opacity: 0.5;
        border-color: var(--primary-button-color);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    &.drag-over {
        border-color: var(--primary-button-color);
        background: var(--secondary-background-color);
    }
`;

const DragHandle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--secondary-text-color);
    cursor: grab;
    padding: 0.4rem;
    margin-left: auto;
    border-radius: 0.4rem;
    transition: all 0.2s ease;

    &:hover {
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
    }

    &:active {
        cursor: grabbing;
    }

    svg {
        font-size: 2rem;
    }
`;

const KickerCardName = styled.span`
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const KickerAvatar = styled.img`
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid var(--primary-button-color);
`;

const AvatarPlaceholder = styled.div`
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    flex-shrink: 0;
    background: linear-gradient(
        135deg,
        var(--primary-button-color) 0%,
        var(--primary-button-color-hover) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-button-color-text);
    font-weight: 600;
    font-size: 1.4rem;
    text-transform: uppercase;
`;

const BurgerMenuContainer = styled.div`
    display: flex;
    position: absolute;
    left: 1.5rem;
    top: 1.6rem;
    gap: 1rem;
`;

const Navbar = styled.nav`
    display: flex;
    border-left: 5px;
    align-items: center;
    justify-content: ${(props) =>
        props.$isAuthenticated ? "center" : "flex-start"};
    padding: 1rem;
    background-color: var(--primary-background-color);
`;

const NavButtonsContainer = styled.div`
    display: flex;
    position: absolute;
    right: 2.5rem;
    gap: 1rem;
`;

const NavButton = styled.button`
    background: none;
    border: none;
    color: var(--primary-text-color);
    font-size: 1.6rem;
    cursor: pointer;
    padding: 0.5rem;

    &:hover {
        text-decoration: underline;
    }
`;

const Logo = styled.img`
    height: 5rem;
`;

const Title = styled.h1`
    margin-top: 2rem;
    font-size: 3.5rem;
    animation: ${fadeInUp} 0.6s ease-out;

    ${media.tablet} {
        font-size: 2.8rem;
    }

    ${media.mobile} {
        font-size: 2.4rem;
    }
`;

const Tagline = styled.p`
    font-size: 1.6rem;
    margin-bottom: 2.5rem;
    color: var(--secondary-text-color);
    animation: ${fadeInUp} 0.6s ease-out 0.1s both;

    ${media.tablet} {
        font-size: 1.4rem;
    }
`;

// Hero Section
const HeroSection = styled.section`
    padding: 2rem 2rem 4rem;
    position: relative;
    z-index: 1;
`;

const CTASection = styled.section`
    padding: 0 2rem 3rem;
    background: transparent;
    position: relative;
    z-index: 1;
    margin-top: -1rem;
`;

const ColumnsContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 2.5rem;
    max-width: 70rem;
    margin: 0 auto;
    animation: ${fadeInUp} 0.6s ease-out 0.2s both;

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 0 1rem;
    }
`;

const ActionCard = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-lg);
    padding: 2.4rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    flex: 1;
    max-width: 32rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    ${media.tablet} {
        padding: 2rem;
        width: 100%;
        max-width: 100%;
    }
`;

const ActionCardTitle = styled.h3`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
    text-align: center;
`;

const ActionCardDescription = styled.p`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    margin: 0;
    text-align: center;
    line-height: 1.5;
`;

const OrDivider = styled.div`
    display: none;
    align-items: center;
    color: var(--color-grey-400);
    font-size: 1.4rem;
    font-weight: 500;

    ${media.tablet} {
        display: flex;
        gap: 1rem;

        &::before,
        &::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--color-grey-300);
        }
    }
`;

const ActionIcon = styled.div`
    width: 5rem;
    height: 5rem;
    margin: 0 auto;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
        135deg,
        var(--color-${(props) => props.$color}-100) 0%,
        var(--color-${(props) => props.$color}-200) 100%
    );
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    & svg {
        width: 2.4rem;
        height: 2.4rem;
        color: var(--color-${(props) => props.$color}-600);
        transition: transform 0.3s ease;
    }

    ${ActionCard}:hover & {
        transform: scale(1.05);
        box-shadow: 0 4px 12px var(--color-${(props) => props.$color}-200);
    }

    ${ActionCard}:hover & svg {
        transform: scale(1.1);
    }
`;

const InputWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const TooltipIcon = styled.span`
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-grey-400);
    cursor: help;
    display: flex;
    align-items: center;

    &:hover {
        color: var(--color-grey-600);
    }

    & svg {
        width: 1.8rem;
        height: 1.8rem;
    }
`;

const CreateKickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    width: 100%;
    margin-top: 0.5rem;

    & button {
        width: 100%;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-2px);
        }
    }
`;

const JoinKickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    width: 100%;
    margin-top: 0.5rem;

    & button {
        width: 100%;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-2px);
        }
    }
`;

// Divider between sections
const SectionDivider = styled.div`
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        var(--color-grey-300) 50%,
        transparent 100%
    );
    margin: 2rem auto;
    max-width: 60rem;
`;

const Footer = styled.footer`
    padding: 1.5rem;
    font-size: 1.2rem;
    text-align: center;
    width: 100%;
    background: var(--primary-background-color);
    border-top: 1px solid var(--primary-border-color);
    color: var(--secondary-text-color);
`;

const FooterLinks = styled.div`
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 0.5rem;
    font-size: 1.2rem;

    ${media.tablet} {
        margin-bottom: 1.5rem;
    }

    & a {
        color: var(--secondary-text-color);
        transition: color 0.2s ease;

        &:hover {
            color: var(--primary-text-color);
        }
    }
`;

const ResponsiveNavButtonsContainer = styled(NavButtonsContainer)`
    /* ${media.tablet} {
        position: static;
        justify-content: space-evenly;
        width: 100%;
        padding-top: 1rem;
    } */
`;

const SidebarCloseButton = styled(ButtonIcon)`
    color: var(--primary-button-color-text);
    background: rgba(255, 255, 255, 0.15);
    border-radius: 0.8rem;
    padding: 0.6rem;

    &:hover {
        background: rgba(255, 255, 255, 0.25);
    }
`;

const EmptyStateContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    gap: 1.5rem;
`;

const EmptyStateIcon = styled.div`
    font-size: 4rem;
    color: var(--secondary-text-color);
    opacity: 0.5;
`;

const EmptyStateText = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0;
`;

const EmptyStateHint = styled.p`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    opacity: 0.7;
    margin: 0;
`;

const StyledStartpage = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
`;

const Main = styled.main`
    display: flex;
    flex-direction: column;
    background-color: var(--secondary-background-color);
    color: var(--primary-text-color);
    text-align: center;
    flex-grow: 1;
    position: relative;
`;

function Startpage() {
    const [sidebarActive, setSidebarActive] = useLocalStorageState(
        null,
        "sidebar-open"
    );
    const toggleSidebar = () => setSidebarActive(!sidebarActive);

    const {
        currentKicker,
        setCurrentKicker,
        isLoading: isHandlingKicker,
    } = useKicker();

    const { isDarkMode } = useDarkMode();
    const logo = isDarkMode
        ? "/logo_darkmode_transparent.png"
        : "/logo_transparent.png";

    const [createName, setCreateName] = useLocalStorageState(
        "",
        "kicker_create_name"
    );
    const [joinAccessToken, setJoinAccessToken] = useLocalStorageState(
        "",
        "kicker_join_access_token"
    );

    const { createKicker, isLoading: isCreatingKicker } = useCreateKicker();
    const { joinKicker, isLoading: isJoiningKicker } = useJoinKicker();

    const navigate = useNavigate();

    const { user, isLoading, isAuthenticated } = useUser();

    const { logout } = useLogout();

    const { kickers, isLoadingKickers } = useUserKickers();
    const { reorderKickers } = useUpdateKickerOrder();

    // Local state for drag and drop
    const [localKickers, setLocalKickers] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const dragNodeRef = useRef(null);

    // Sync local kickers with fetched kickers
    useEffect(() => {
        if (kickers) {
            setLocalKickers(kickers);
        }
    }, [kickers]);

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        dragNodeRef.current = e.target;
        e.target.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", e.target);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove("dragging");
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newKickers = [...localKickers];
        const [draggedKicker] = newKickers.splice(draggedIndex, 1);
        newKickers.splice(dropIndex, 0, draggedKicker);

        setLocalKickers(newKickers);
        setDraggedIndex(null);
        setDragOverIndex(null);

        // Save new order to backend
        const kickerIds = newKickers.map((k) => k.id);
        reorderKickers(kickerIds);
    };

    // Redirect to last visited kicker if user is authenticated and has a saved kicker
    useEffect(
        function () {
            if (!isLoading && isAuthenticated && currentKicker) {
                navigate("/home");
            }
        },
        [isLoading, isAuthenticated, currentKicker, navigate]
    );

    useEffect(() => {
        const isDesktop = window.innerWidth > 768;
        const savedState = localStorage.getItem("sidebar-open");
        const shouldOpenSidebar =
            isAuthenticated &&
            kickers?.length > 0 &&
            isDesktop &&
            savedState === "null";

        if (shouldOpenSidebar) {
            setSidebarActive(true);
        } else if (isAuthenticated && kickers?.length > 0) {
            setSidebarActive(savedState === "true");
        }
    }, [isAuthenticated, kickers?.length, setSidebarActive]);

    if (isCreatingKicker || isJoiningKicker) {
        return <Spinner />;
    }

    function handleCreateKicker() {
        if (!createName) {
            return toast.error(
                "A name for the kicker is needed to create a new kicker"
            );
        }

        if (!isAuthenticated) {
            toast(() => <span>You must be logged in to create a kicker</span>);
            navigate("/register");
        }

        if (isAuthenticated) {
            setCreateName("");
            createKicker(
                { name: createName },
                {
                    onSuccess: (data) =>
                        toast.success(
                            `Kicker "${data.name}" created successfully`
                        ),

                    onError: (data) =>
                        toast.error(
                            `Error while creating kicker. ${data.message}`
                        ),
                }
            );
        }
    }

    function handleJoinKicker() {
        if (!joinAccessToken) {
            return toast.error(
                "An access token is needed to join an existing kicker"
            );
        }

        if (!isAuthenticated) {
            toast(() => <span>You must be logged in to join a kicker</span>);
            return navigate("/register");
        }

        if (isAuthenticated && joinAccessToken) {
            setJoinAccessToken("");
            joinKicker(
                { accessToken: joinAccessToken },
                {
                    onSuccess: (data) => {
                        toast.success("successfully joined kicker", data);
                        handleKickerSelect(data.id);
                    },
                    onError: (data) => {
                        toast.error(data.message);
                    },
                }
            );
        }
    }

    async function handleKickerSelect(kickerId) {
        setCurrentKicker(kickerId);
        navigate("/home");
    }

    return (
        <StyledStartpage>
            <Navbar $isAuthenticated={isAuthenticated}>
                {!isLoading && isAuthenticated && (
                    <BurgerMenuContainer>
                        <ButtonIcon onClick={toggleSidebar}>
                            <FaBars />
                        </ButtonIcon>
                    </BurgerMenuContainer>
                )}
                <Logo src={logo} alt="Logo" />
                <ResponsiveNavButtonsContainer>
                    <DarkModeToggle />
                    {!isLoading && !isAuthenticated && (
                        <>
                            <NavButton as={NavLink} to="/register">
                                Sign Up
                            </NavButton>
                            <NavButton as={NavLink} to="/login">
                                Sign In
                            </NavButton>
                        </>
                    )}
                    {!isLoading && isAuthenticated && (
                        <NavButton as="div" onClick={logout}>
                            Logout
                        </NavButton>
                    )}
                </ResponsiveNavButtonsContainer>
            </Navbar>
            {!isLoading && isAuthenticated && (
                <>
                    <SidebarBackdrop
                        className={sidebarActive ? "active" : ""}
                        onClick={() => setSidebarActive(false)}
                    />
                    <Sidebar className={sidebarActive ? "active" : ""}>
                        <SidebarHeader>
                            <SidebarHeaderTitle>
                                <HiOutlineSquare3Stack3D />
                                <h2>Your Kickers</h2>
                            </SidebarHeaderTitle>
                            <SidebarCloseButton
                                onClick={() => setSidebarActive(false)}
                            >
                                <HiXMark />
                            </SidebarCloseButton>
                        </SidebarHeader>
                        <SidebarContent>
                            {isLoadingKickers ? (
                                <SpinnerMini />
                            ) : localKickers?.length > 0 ? (
                                <KickerList>
                                    {localKickers.map((kicker, index) => (
                                        <KickerCard
                                            key={kicker.id}
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(e, index)
                                            }
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) =>
                                                handleDragOver(e, index)
                                            }
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={
                                                dragOverIndex === index
                                                    ? "drag-over"
                                                    : ""
                                            }
                                            onClick={() =>
                                                handleKickerSelect(kicker.id)
                                            }
                                        >
                                            {kicker.avatar ? (
                                                <KickerAvatar
                                                    src={kicker.avatar}
                                                    alt=""
                                                />
                                            ) : (
                                                <AvatarPlaceholder>
                                                    {kicker.name
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </AvatarPlaceholder>
                                            )}
                                            <KickerCardName>
                                                {kicker.name}
                                            </KickerCardName>
                                            <DragHandle
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                title="Drag to reorder"
                                            >
                                                <MdDragIndicator />
                                            </DragHandle>
                                        </KickerCard>
                                    ))}
                                </KickerList>
                            ) : (
                                <EmptyStateContainer>
                                    <EmptyStateIcon>
                                        <HiOutlineSquare3Stack3D />
                                    </EmptyStateIcon>
                                    <EmptyStateText>
                                        No kickers yet
                                    </EmptyStateText>
                                    <EmptyStateHint>
                                        Create or join a kicker below to get
                                        started
                                    </EmptyStateHint>
                                </EmptyStateContainer>
                            )}
                        </SidebarContent>
                    </Sidebar>
                </>
            )}
            <Main>
                <HeroSection>
                    <Title>Welcome to KickerApp</Title>
                    <Tagline>The one and only table football manager</Tagline>

                    <CTASection>
                        <ColumnsContainer>
                            <ActionCard>
                                <ActionIcon $color="brand">
                                    <FaPlus />
                                </ActionIcon>
                                <ActionCardTitle>
                                    Create a Kicker
                                </ActionCardTitle>
                                <ActionCardDescription>
                                    Start tracking matches with your friends.
                                    Set up your own league in seconds.
                                </ActionCardDescription>
                                <CreateKickerContainer>
                                    <Input
                                        type="text"
                                        placeholder="Enter kicker name..."
                                        value={createName}
                                        onChange={(e) =>
                                            setCreateName(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            handleCreateKicker()
                                        }
                                    />
                                    <Button
                                        $size="large"
                                        onClick={handleCreateKicker}
                                    >
                                        <FaPlus />
                                        Create new kicker
                                    </Button>
                                </CreateKickerContainer>
                            </ActionCard>

                            <OrDivider>or</OrDivider>

                            <ActionCard>
                                <ActionIcon $color="green">
                                    <FaArrowRight />
                                </ActionIcon>
                                <ActionCardTitle>Join a Kicker</ActionCardTitle>
                                <ActionCardDescription>
                                    Got an invite? Enter the access token to
                                    join an existing kicker.
                                </ActionCardDescription>
                                <JoinKickerContainer>
                                    <InputWrapper>
                                        <Input
                                            type="text"
                                            placeholder="Enter access token..."
                                            value={joinAccessToken}
                                            onChange={(e) =>
                                                setJoinAccessToken(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                handleJoinKicker()
                                            }
                                        />
                                        <TooltipIcon title="Get the access token from your kicker admin">
                                            <HiOutlineQuestionMarkCircle />
                                        </TooltipIcon>
                                    </InputWrapper>
                                    <Button
                                        $size="large"
                                        $variation="secondary"
                                        onClick={handleJoinKicker}
                                    >
                                        <FaArrowRight />
                                        Join existing kicker
                                    </Button>
                                </JoinKickerContainer>
                            </ActionCard>
                        </ColumnsContainer>
                    </CTASection>
                </HeroSection>

                <PublicStats />

                <SectionDivider />

                <FeatureGrid />

                <PlatformShowcase
                    desktopScreenshot={PLATFORM_SCREENSHOTS.desktop}
                    mobileScreenshot={PLATFORM_SCREENSHOTS.mobile}
                />

                <ScreenshotCarousel />
            </Main>
            <Footer>
                <div>© 2023-{new Date().getFullYear()} Andreas Kowalenko</div>
                <FooterLinks>
                    <Link to="/imprint">Imprint</Link>
                    <span>|</span>
                    <Link to="/privacy">Privacy</Link>
                </FooterLinks>
            </Footer>
        </StyledStartpage>
    );
}

export default Startpage;
