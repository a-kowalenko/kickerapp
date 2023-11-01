import { useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../utils/constants";
import styled from "styled-components";
import {
    HiChevronDoubleLeft,
    HiChevronDoubleRight,
    HiChevronLeft,
    HiChevronRight,
} from "react-icons/hi2";

const StyledPagination = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.4rem;
`;

const P = styled.p`
    display: flex;
    justify-content: center;
    white-space: pre-wrap;

    & span {
        font-weight: 600;
    }
`;

const Buttons = styled.div`
    display: flex;
    gap: 0.6rem;
`;

const PaginationButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-amber-100);
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: var(--border-radius-sm);
    color: ${(props) => (props.$active ? " var(--color-brand-50)" : "inherit")};
    font-weight: 500;

    &:hover:not(:disabled) {
        background-color: var(--color-amber-200);
    }

    &:active:not(:disabled) {
        background-color: var(--color-amber-300);
    }

    &:disabled {
        background-color: var(--color-amber-75);
    }

    & svg {
        height: 1.8rem;
        width: 1.8rem;
    }
`;

function Pagination({ numEntries }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const numPages = Math.ceil(numEntries / PAGE_SIZE);

    const currentPage = !searchParams.get("page")
        ? 1
        : Number(searchParams.get("page"));

    function nextPage() {
        const next = currentPage + 1 > numPages ? currentPage : currentPage + 1;
        setPage(next);
    }

    function prevPage() {
        const prev = currentPage === 1 ? currentPage : currentPage - 1;
        setPage(prev);
    }

    function setPage(page) {
        searchParams.set("page", page);
        setSearchParams(searchParams);
    }

    if (numPages <= 1) {
        return (
            <P>
                <span>1</span> - <span>{numEntries}</span> of{" "}
                <span>{numEntries}</span>
            </P>
        );
    }

    const from = currentPage * PAGE_SIZE - PAGE_SIZE + 1;
    const to = currentPage === numPages ? numEntries : currentPage * PAGE_SIZE;

    return (
        <StyledPagination>
            <P>
                <span>{from}</span> - <span>{to}</span> of{" "}
                <span>{numEntries}</span>
            </P>
            <Buttons>
                <PaginationButton
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                >
                    <HiChevronDoubleLeft />
                </PaginationButton>
                <PaginationButton
                    onClick={prevPage}
                    disabled={currentPage === 1}
                >
                    <HiChevronLeft />
                </PaginationButton>

                <PaginationButton onClick={() => setPage(currentPage)}>
                    {currentPage}
                </PaginationButton>

                <PaginationButton
                    onClick={nextPage}
                    disabled={currentPage === numPages}
                >
                    <HiChevronRight />
                </PaginationButton>
                <PaginationButton
                    onClick={() => setPage(numPages)}
                    disabled={currentPage === numPages}
                >
                    <HiChevronDoubleRight />
                </PaginationButton>
            </Buttons>
        </StyledPagination>
    );
}

export default Pagination;
