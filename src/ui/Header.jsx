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

const StyledHeader = styled.header`
    background-color: var(--primary-background-color);
    padding: 1.6rem 4.8rem;
    border-bottom: 1px solid var(--secondary-border-color);

    display: flex;
    align-items: center;
    justify-content: space-between;

    ${media.tablet} {
        display: none;
    }
`;

const KickerInfoWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 40rem;
    gap: 2.4rem;
`;

const ToggleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;
`;

function Header() {
    const navigate = useNavigate();
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();

    const { kickers, isLoadingKickers } = useUserKickers();

    const { setCurrentKicker } = useKicker();

    function handleKickerSelect(option) {
        setCurrentKicker(option);
        navigate("/home");
    }

    return (
        <StyledHeader>
            <KickerInfoWrapper>
                {isLoadingKickerData || isLoadingKickers ? (
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
                        <ButtonIcon
                            onClick={() => navigate("/")}
                            title="Exit kicker"
                        >
                            <HiArrowRightOnRectangle />
                        </ButtonIcon>
                    </>
                )}
            </KickerInfoWrapper>
            <ToggleWrapper>
                <SoundToggle />
                <DarkModeToggle />
            </ToggleWrapper>
        </StyledHeader>
    );
}

export default Header;
