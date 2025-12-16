import styled from "styled-components";
import { Link } from "react-router-dom";

const MentionLink = styled(Link)`
    color: var(--primary-button-color);
    font-weight: 600;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

// Parse comment content and convert @[name](id) patterns to clickable links
function MentionText({ content }) {
    if (!content) return null;

    // Regex to match @[name](id) pattern
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        // Add text before the mention
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }

        // Add the mention as a link
        const [, name, playerId] = match;
        parts.push(
            <MentionLink key={match.index} to={`/user/${name}/profile`}>
                @{name}
            </MentionLink>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last mention
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return <>{parts}</>;
}

export default MentionText;
