import styled from "styled-components";
import NewMatchButton from "../features/home/NewMatchButton";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import { HiOutlineHome } from "react-icons/hi2";

const NavList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-bottom: 1.8rem;
`;

function RightNav() {
    const location = useLocation();

    console.log(location);
    const isCreatingMatch = location.pathname === "/matches/create";
    const navigate = useNavigate();
    return (
        <nav>
            <NavList>
                <li>
                    {isCreatingMatch ? (
                        <Button
                            $size="xlarge"
                            onClick={() => navigate("/home")}
                        >
                            <HiOutlineHome />
                            Home
                        </Button>
                    ) : (
                        <NewMatchButton />
                    )}
                </li>
            </NavList>
        </nav>
    );
}

export default RightNav;
