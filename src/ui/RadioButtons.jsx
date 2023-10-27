import { useContext } from "react";
import { useState } from "react";
import { createContext } from "react";

const RadioContext = createContext();

function RadioGroup({ name, children, onSelect }) {
    const [selected, setSelected] = useState(null);

    function select(value) {
        onSelect(value);
        setSelected(value);
    }

    return (
        <RadioContext.Provider value={{ selected, select }}>
            <div name={name}>{children}</div>
        </RadioContext.Provider>
    );
}

function RadioButton({ label, value }) {
    const { selected, select } = useContext(RadioContext);

    return (
        <div>
            <input
                type="radio"
                checked={selected === value}
                onChange={() => select(value)}
            ></input>
            <label htmlFor={value}>{label}</label>
        </div>
    );
}

RadioGroup.RadioButton = RadioButton;

export default RadioGroup;
