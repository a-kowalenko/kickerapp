import styled from "styled-components";
import { useState, useEffect } from "react";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const TextArea = styled.textarea`
    width: 100%;
    min-height: 15rem;
    padding: 1rem;
    font-family: "Fira Code", "Monaco", "Consolas", monospace;
    font-size: 1.3rem;
    border: 1px solid
        ${(props) =>
            props.$hasError
                ? "var(--color-red-500)"
                : "var(--secondary-border-color)"};
    border-radius: var(--border-radius-sm);
    background-color: var(--color-grey-50);
    resize: vertical;

    &:focus {
        outline: none;
        border-color: ${(props) =>
            props.$hasError
                ? "var(--color-red-500)"
                : "var(--color-brand-500)"};
    }
`;

const ErrorMessage = styled.div`
    color: var(--color-red-700);
    font-size: 1.2rem;
    padding: 0.4rem 0.8rem;
    background-color: var(--color-red-100);
    border-radius: var(--border-radius-sm);
`;

const HelpText = styled.div`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const SchemaPreview = styled.pre`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    background-color: var(--color-grey-100);
    padding: 1rem;
    border-radius: var(--border-radius-sm);
    overflow-x: auto;
    white-space: pre-wrap;
`;

const EXAMPLE_SCHEMA = `{
  "type": "counter" | "threshold" | "streak",
  "metric": "wins" | "losses" | "goals" | "matches" | "fatalities" | "mmr",
  "filters": {
    "gamemode": "1on1" | "2on2",
    "result": "win" | "loss",
    "score_diff": { "min": 6 },
    "opponent_mmr": { "min": 1200 },
    "duration_seconds": { "max": 300 }
  },
  "streak_condition": { "result": "win", "min_streak": 5 }
}`;

function ConditionJsonEditor({ condition, onChange }) {
    const [jsonText, setJsonText] = useState(
        JSON.stringify(condition, null, 2)
    );
    const [error, setError] = useState(null);

    // Sync when condition prop changes (e.g., from builder)
    useEffect(() => {
        const newText = JSON.stringify(condition, null, 2);
        if (newText !== jsonText) {
            setJsonText(newText);
            setError(null);
        }
    }, [condition]);

    const handleChange = (e) => {
        const text = e.target.value;
        setJsonText(text);

        try {
            const parsed = JSON.parse(text);
            setError(null);
            onChange(parsed);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container>
            <TextArea
                value={jsonText}
                onChange={handleChange}
                $hasError={!!error}
                spellCheck="false"
            />

            {error && <ErrorMessage>JSON Error: {error}</ErrorMessage>}

            <HelpText>
                Edit the condition JSON directly. Changes are synced with the
                builder.
            </HelpText>

            <details>
                <summary
                    style={{
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        color: "var(--secondary-text-color)",
                    }}
                >
                    Schema Reference
                </summary>
                <SchemaPreview>{EXAMPLE_SCHEMA}</SchemaPreview>
            </details>
        </Container>
    );
}

export default ConditionJsonEditor;
