import { createContext, useContext } from "react";
import styled from "styled-components";
import { media } from "../utils/constants";

const StyledTable = styled.div`
    font-size: 1.6rem;
    overflow: scroll;

    /* Removing scrollbars for webkit, firefox, and ms, respectively */
    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
`;

const StyledHeader = styled.div`
    display: grid;
    grid-template-columns: ${(props) => props.$columns};

    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 0.4rem 1.2rem;
    font-weight: 600;

    border-bottom: 1px solid #6363633b;
`;

const StyledBody = styled.ul``;

const StyledRow = styled.div`
    display: grid;
    grid-template-columns: ${(props) => props.$columns};
    cursor: pointer;

    text-transform: uppercase;
    letter-spacing: 0.4px;

    padding: 0.6rem 1.2rem;

    border-bottom: 1px solid #6363633b;

    ${(props) =>
        props.$isTeamMatch &&
        `
        background: linear-gradient(
            90deg,
            rgba(138, 43, 226, 0.05) 0%,
            transparent 20%,
            transparent 80%,
            rgba(138, 43, 226, 0.05) 100%
        );
        border-left: 3px solid var(--color-purple-500, #8b5cf6);
    `}

    &:hover {
        background-color: var(--table-row-color-hover);
    }

    ${media.mobile} {
        justify-content: space-between;
        padding: 0.6rem 0rem;
        ${(props) => props.$isTeamMatch && `padding-left: 0.4rem;`}
    }
`;

const StyledParagraph = styled.p`
    text-align: center;
    font-size: 1.8rem;
    font-weight: 500;
    margin-top: 3rem;
`;

const MiniTableContext = createContext();

function MiniTable({ columns, children }) {
    return (
        <MiniTableContext.Provider value={{ columns }}>
            <StyledTable role="table">{children}</StyledTable>
        </MiniTableContext.Provider>
    );
}

function Header({ children }) {
    const { columns } = useContext(MiniTableContext);
    return (
        <StyledHeader as="header" role="row" $columns={columns}>
            {children}
        </StyledHeader>
    );
}

function Body({ data, render, noDataLabel = "No data available" }) {
    if (!data?.length) {
        return <StyledParagraph>{noDataLabel}</StyledParagraph>; // TODO: Create Empty component
    }
    return <StyledBody>{data.map(render)}</StyledBody>;
}

function Row({ children, onClick, isTeamMatch }) {
    const { columns } = useContext(MiniTableContext);

    return (
        <StyledRow
            role="row"
            $columns={columns}
            onClick={onClick}
            $isTeamMatch={isTeamMatch}
        >
            {children}
        </StyledRow>
    );
}

MiniTable.Header = Header;
MiniTable.Body = Body;
MiniTable.Row = Row;

export default MiniTable;
