import styled from "styled-components";
import { useUser } from "../features/authentication/useUser";
import Avatar from "./Avatar";
import { useState } from "react";
import {
    HiMiniArrowLeftOnRectangle,
    HiOutlineUserCircle,
} from "react-icons/hi2";
import { useLogout } from "../features/authentication/useLogout";
import { useNavigate } from "react-router-dom";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { DEFAULT_AVATAR } from "../utils/constants";

const StyledProfileMenu = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;

    & label {
        cursor: pointer;
    }
`;

const StyledList = styled.ul`
    position: absolute;
    width: max-content;
    background-color: var(--color-grey-0);
    box-shadow: var(--shadow-md);
    border-radius: var(--border-radius-md);

    position: absolute; // Die Liste wird über anderen Elementen angezeigt
    top: 110%; // Beginnt direkt unter dem Toggle-Button
    right: 0; // Ausgerichtet am linken Rand des Containers
    /* width: 100%; // Nimmt die volle Breite des Containers ein */
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
        /* color: var(--color-grey-400); */
        transition: all 0.3s;
    }
`;

function ProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const close = () => setIsOpen(false);
    const { logout, isLoading } = useLogout();
    const navigate = useNavigate();
    const dropdownRef = useOutsideClick(close);

    const {
        user: {
            user_metadata: { username, avatar },
        },
    } = useUser();

    function handleToggle() {
        setIsOpen((open) => !open);
    }

    function goToProfile() {
        close();
        navigate(`/user/${username}/profile`);
    }

    function handleLogout() {
        close();
        logout();
    }

    return (
        <div ref={dropdownRef}>
            <StyledProfileMenu onClick={handleToggle}>
                <Avatar $size="small" src={avatar || DEFAULT_AVATAR} />
                <label>{username}</label>

                {isOpen && (
                    <StyledList>
                        <li>
                            <StyledButton onClick={goToProfile}>
                                <HiOutlineUserCircle />
                                Profile
                            </StyledButton>
                        </li>
                        <li>
                            <StyledButton onClick={handleLogout}>
                                <HiMiniArrowLeftOnRectangle />
                                Logout
                            </StyledButton>
                        </li>
                    </StyledList>
                )}
            </StyledProfileMenu>
        </div>
    );
}

export default ProfileMenu;
