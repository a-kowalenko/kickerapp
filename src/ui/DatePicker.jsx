import ReactDatePicker from "react-datepicker";
import styled from "styled-components";
import "react-datepicker/dist/react-datepicker.css";

const StyledDatePicker = styled(ReactDatePicker)`
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.361);
    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-sm);

    color: var(--primary-dropdown-text-color);

    background-color: var(--primary-dropdown-background-color);

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

function DatePicker(props) {
    return <StyledDatePicker {...props} />;
}

export default DatePicker;
