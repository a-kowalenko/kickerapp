import styled from "styled-components";
import { FaPlus, FaArrowRight } from "react-icons/fa";
import DarkModeToggle from "../../ui/DarkModeToggle";
import { useDarkMode } from "../../contexts/DarkModeContext";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../features/authentication/useUser";
import Spinner from "../../ui/Spinner";
import { useLogout } from "../../features/authentication/useLogout";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useCreateKicker } from "../../features/kicker/useCreateKicker";
import { useJoinKicker } from "../../features/kicker/useJoinKicker";
import { FaBars } from "react-icons/fa";
import { useUserKickers } from "../../features/kicker/useUserKickers";
import { useKicker } from "../../contexts/KickerContext";
import ButtonIcon from "../../ui/ButtonIcon";
import { HiXMark } from "react-icons/hi2";
import { media } from "../../utils/constants";

const Sidebar = styled.aside`
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    padding: 1rem;
    position: fixed;
    top: 0;
    bottom: 0;
    left: -100%;
    width: 25rem;
    transition: left 0.3s ease-in-out;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    border-radius: 5px;

    &.active {
        left: 0;
    }

    ${media.tablet} {
        width: 100%;
        left: -100%;
    }
`;

const KickerList = styled.ul`
    list-style: none;
    padding: 0;
`;

const KickerListElement = styled.li`
    cursor: pointer;
    padding: 0.8rem 1.2rem;

    border-radius: 3px;

    border-bottom: 1px solid var(--primary-border-color);

    &:hover {
        background-color: var(--nav-link-background-color-active);
    }
`;

const BurgerMenuContainer = styled.div`
    display: flex;
    position: absolute;
    left: 1.5rem;
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
`;

const Tagline = styled.p`
    font-size: 1.5rem;
    margin-bottom: 2rem;
`;

const ColumnsContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 8rem;

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 3rem;
    }
`;

const CreateKickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;

    & button {
        width: 100%;
    }
`;

const JoinKickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;

    & button {
        width: 100%;
    }
`;

const Footer = styled.footer`
    padding: 1rem;
    font-size: 1rem;
    text-align: center;
    /* position: absolute; */
    bottom: 0;
    width: 100%;
    border-top: 1px solid var(--primary-border-color);
`;

const ResponsiveNavButtonsContainer = styled(NavButtonsContainer)`
    /* ${media.tablet} {
        position: static;
        justify-content: space-evenly;
        width: 100%;
        padding-top: 1rem;
    } */
`;

const CloseSidebarContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const KickerListTitle = styled.h2`
    color: var(--primary-text-color);
    font-size: 1.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--primary-border-color);
`;

const SidebarInfoMessage = styled.span`
    font-style: italic;
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
`;

function Startpage() {
    const [sidebarActive, setSidebarActive] = useLocalStorageState(
        null,
        "sidebar-open"
    );
    const toggleSidebar = () => setSidebarActive(!sidebarActive);

    const { setCurrentKicker, isLoading: isHandlingKicker } = useKicker();

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

    useEffect(
        function () {
            setCurrentKicker(null);
        },
        [setCurrentKicker]
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

    if (isLoading || isCreatingKicker || isJoiningKicker) {
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
                {isAuthenticated && (
                    <BurgerMenuContainer>
                        <ButtonIcon onClick={toggleSidebar}>
                            <FaBars />
                        </ButtonIcon>
                    </BurgerMenuContainer>
                )}
                <Logo src={logo} alt="Logo" />
                <ResponsiveNavButtonsContainer>
                    <DarkModeToggle />
                    {!isAuthenticated && (
                        <>
                            <NavButton as={NavLink} to="/register">
                                Sign Up
                            </NavButton>
                            <NavButton as={NavLink} to="/login">
                                Sign In
                            </NavButton>
                        </>
                    )}
                    {isAuthenticated && (
                        <NavButton as="div" onClick={logout}>
                            Logout
                        </NavButton>
                    )}
                </ResponsiveNavButtonsContainer>
            </Navbar>
            {isAuthenticated && (
                <Sidebar className={sidebarActive ? "active" : ""}>
                    <CloseSidebarContainer>
                        <ButtonIcon onClick={() => setSidebarActive(false)}>
                            <HiXMark />
                        </ButtonIcon>
                    </CloseSidebarContainer>
                    {isLoadingKickers ? (
                        <Spinner />
                    ) : (
                        <>
                            <KickerListTitle>Your Kickers</KickerListTitle>
                            {kickers?.length > 0 ? (
                                <KickerList>
                                    {kickers.map((kicker) => (
                                        <KickerListElement
                                            key={kicker.id}
                                            onClick={() =>
                                                handleKickerSelect(kicker.id)
                                            }
                                        >
                                            {kicker.name}
                                        </KickerListElement>
                                    ))}
                                </KickerList>
                            ) : (
                                <SidebarInfoMessage>
                                    You have no kickers yet
                                </SidebarInfoMessage>
                            )}
                        </>
                    )}
                </Sidebar>
            )}
            <Main>
                <Title>Welcome to zerohero</Title>
                <Tagline>The one and only table football manager</Tagline>
                <ColumnsContainer>
                    <CreateKickerContainer>
                        <Input
                            type="text"
                            placeholder="Name"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                        />
                        <Button $size="large" onClick={handleCreateKicker}>
                            <FaPlus />
                            Create new kicker
                        </Button>
                    </CreateKickerContainer>
                    <JoinKickerContainer>
                        <Input
                            type="text"
                            placeholder="Access Token"
                            value={joinAccessToken}
                            onChange={(e) => setJoinAccessToken(e.target.value)}
                        />
                        <Button $size="large" onClick={handleJoinKicker}>
                            <FaArrowRight />
                            Join existing kicker
                        </Button>
                    </JoinKickerContainer>
                </ColumnsContainer>
            </Main>
            <Footer>© 2023 Andreas Kowalenko</Footer>
        </StyledStartpage>
    );
}

export default Startpage;
