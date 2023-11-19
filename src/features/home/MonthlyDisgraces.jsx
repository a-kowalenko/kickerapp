import { format } from "date-fns";
import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import MiniTable from "../../ui/MiniTable";
import Row from "../../ui/Row";
import { de } from "date-fns/locale";
import MiniDisgraceRow from "./MiniDisgraceRow";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useMonthlyDisgraces } from "./useMonthlyDisgraces";
import styled from "styled-components";

const StyledMontylyDisgrace = styled(ContentBox)`
    grid-area: 2 / 1 / 3 / 3;

    @media (max-width: 1350px) {
        grid-area: 3 / 1 / 4 / 3;
    }
`;

function MonthlyDisgraces() {
    const { disgraces, isLoadingMatches } = useMonthlyDisgraces();
    const currentMonth = format(new Date(), "LLLL", { locale: de });

    return (
        <StyledMontylyDisgrace>
            <Row type="horizontal">
                <Heading as="h2">Strich der Schande - {currentMonth}</Heading>
            </Row>
            <MiniTable columns="0.6fr 1fr 0.3fr">
                <MiniTable.Header>
                    <div>Player</div>
                    <div>geschändet von</div>
                    <div>Am</div>
                </MiniTable.Header>
                {isLoadingMatches ? (
                    <LoadingSpinner />
                ) : (
                    <MiniTable.Body
                        noDataLabel="Noch niemand geschändet"
                        data={disgraces}
                        render={(disgrace) => (
                            <MiniDisgraceRow
                                disgrace={disgrace}
                                key={disgrace.id}
                            />
                        )}
                    />
                )}
            </MiniTable>
        </StyledMontylyDisgrace>
    );
}

export default MonthlyDisgraces;
