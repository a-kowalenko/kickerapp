import { createContext, useContext } from "react";
import styled from "styled-components";

// TODO: Create styled components for each table component
const StyledTable = styled.div`
    border: 1px solid var(--color-amber-100);
    font-size: 1.4rem;
    background-color: var(--color-grey-0);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: -1px -1px 1px rgba(0, 0, 0, 0.1), 1px 1px 1px rgba(0, 0, 0, 0.1);
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
    background-color: var(--color-amber-75);
    border-bottom: 1px solid var(--color-amber-100);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--color-grey-700);
`;

const StyledRow = styled(DefaultRow)`
    padding: 1.2rem 2.4rem;
    position: relative;

    &:hover {
        background-color: var(--color-amber-50);
        box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1), 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    &:not(:last-child) {
        border-bottom: 1px solid var(--color-amber-100);
    }
`;

const StyledBody = styled.section`
    margin: 0.4rem 0;
`;

const Footer = styled.footer`
    display: flex;
    justify-content: center;
    background-color: var(--color-amber-50);
    padding: 1.2rem;

    &:not(:has(*)) {
        display: none;
    }
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

function Row({ children }) {
    const { columns } = useContext(TableContext);
    return (
        <StyledRow role="row" $columns={columns}>
            {children}
        </StyledRow>
    );
}

function Body({ data, render }) {
    if (!data?.length) {
        return <div>No data available</div>; // TODO: Create Empty component
    }
    return <StyledBody>{data.map(render)}</StyledBody>;
}

Table.Header = Header;
Table.Row = Row;
Table.Body = Body;
Table.Footer = Footer;

export default Table;
