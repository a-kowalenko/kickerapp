import ButtonIcon from "../../ui/ButtonIcon";

function ScoreButton({ onClick, isDisabled, children }) {
    return (
        <ButtonIcon $size="xlarge" onClick={onClick} disabled={isDisabled}>
            {children}
        </ButtonIcon>
    );
}

export default ScoreButton;
