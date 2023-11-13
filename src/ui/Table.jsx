import { createContext, useContext } from "react";
import styled from "styled-components";

// TODO: Create styled components for each table component
const StyledTable = styled.div`
    border: 1px solid var(--table-border-color);
    font-size: 1.4rem;
    background-color: var(--table-background-color);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
`;

const DefaultRow = styled.div`
    display: grid;
    grid-template-columns: ${(props) => props.$columns};
    column-gap: 2.4rem;
    align-items: center;
    transition: none;
`;

const StyledHeader = styled(DefaultRow)`
    padding: 1.6rem 2.4rem;
    background-color: var(--primary-background-color);
    border-bottom: 1px solid var(--table-border-color);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--primary-text-color);
`;

const StyledRow = styled(DefaultRow)`
    padding: 1.2rem 2.4rem;
    position: relative;
    cursor: pointer;

    &:hover {
        background-color: var(--table-row-color-hover);
        box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1), 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    &:not(:last-child) {
        border-bottom: 1px solid var(--table-border-color);
    }
`;

const StyledBody = styled.section`
    margin: 0.4rem 0;
`;

const Footer = styled.footer`
    display: flex;
    justify-content: center;
    background-color: var(--table-footer-background-color);
    padding: 1.2rem;

    &:not(:has(*)) {
        display: none;
    }
`;

const StyledParagraph = styled.p`
    text-align: center;
    font-size: 1.8rem;
    font-weight: 500;
    margin: 3rem 0;
`;

const TableContext = createContext();

function Table({ columns, children }) {
    return (
        <TableContext.Provider value={{ columns }}>
            <StyledTable role="table">{children}</StyledTable>
        </TableContext.Provider>
    );
}

function Header({ children }) {
    const { columns } = useContext(TableContext);
    return (
        <StyledHeader as="header" role="row" $columns={columns}>
            {children}
        </StyledHeader>
    );
}

function Row({ children, onClick }) {
    const { columns } = useContext(TableContext);
    return (
        <StyledRow role="row" $columns={columns} onClick={onClick}>
            {children}
        </StyledRow>
    );
}

function Body({ data, render, noDataLabel = "No data available" }) {
    if (!data?.length) {
        return <StyledParagraph>{noDataLabel}</StyledParagraph>; // TODO: Create Empty component
    }
    return <StyledBody>{data.map(render)}</StyledBody>;
}

Table.Header = Header;
Table.Row = Row;
Table.Body = Body;
Table.Footer = Footer;

export default Table;
