import ButtonIcon from "../../ui/ButtonIcon";

function ScoreButton({ onClick, disabled, children }) {
    return (
        <ButtonIcon $size="xlarge" onClick={onClick} disabled={disabled}>
            {children}
        </ButtonIcon>
    );
}

export default ScoreButton;
