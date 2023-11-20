import { createContext, useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";

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
    max-height: ${(props) => props.$maxHeight || "50rem"};
    overflow-y: auto;
`;

const Footer = styled.footer`
    display: flex;
    justify-content: center;
    background-color: var(--table-footer-background-color);
    padding: 1.2rem;
    z-index: 1000;

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
    const [maxHeight, setMaxHeight] = useState("50rem");
    const ref = useRef(null);

    useEffect(() => {
        function updateMaxHeight() {
            if (ref.current) {
                const distanceToTop = ref.current.getBoundingClientRect().top;
                const distanceToBottom =
                    ref.current.getBoundingClientRect().bottom;
                const windowHeight = window.innerHeight;
                const newMaxHeight = `${
                    windowHeight - distanceToTop - 120 > 529
                        ? 529
                        : windowHeight - distanceToTop - 120
                }px`;
                setMaxHeight(newMaxHeight);
                console.log("windowHeight", windowHeight);
                console.log("distanceToTop", distanceToTop);
                console.log("distanceToBottom", distanceToBottom);
                console.log("newMaxHeight", newMaxHeight);
            }
        }

        window.addEventListener("resize", updateMaxHeight);
        updateMaxHeight();

        return () => window.removeEventListener("resize", updateMaxHeight);
    }, []);

    if (!data?.length) {
        return <StyledParagraph>{noDataLabel}</StyledParagraph>;
    }

    return (
        <StyledBody ref={ref} $maxHeight={maxHeight}>
            {data.map(render)}
        </StyledBody>
    );
}

Table.Header = Header;
Table.Row = Row;
Table.Body = Body;
Table.Footer = Footer;

export default Table;
