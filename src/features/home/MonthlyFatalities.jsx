import { format } from "date-fns";
import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import MiniTable from "../../ui/MiniTable";
import Row from "../../ui/Row";
import { enUS } from "date-fns/locale";
import MiniFatalityRow from "./MiniFatalityRow";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useMonthlyFatalities } from "./useMonthlyFatalities";
import styled from "styled-components";
import useWindowWidth from "../../hooks/useWindowWidth";

const StyledMontylyFatalities = styled(ContentBox)`
    grid-area: 2 / 1 / 3 / 3;

    @media (max-width: 1350px) {
        grid-area: 3 / 1 / 4 / 3;
    }
`;

function MonthlyFatalities() {
    const { fatalities, isLoading } = useMonthlyFatalities();
    const currentMonth = format(new Date(), "LLLL", { locale: enUS });

    const { isMobile } = useWindowWidth();

    return (
        <StyledMontylyFatalities>
            <Row type="horizontal">
                <Heading as="h2">Fatalities - {currentMonth}</Heading>
            </Row>
            <MiniTable columns="0.6fr 1fr 0.3fr">
                <MiniTable.Header>
                    <div style={{ textAlign: isMobile ? "center" : "" }}>
                        Victim
                    </div>
                    <div style={{ textAlign: isMobile ? "center" : "" }}>
                        Finisher
                    </div>
                    <div style={{ textAlign: isMobile ? "center" : "" }}>
                        Date
                    </div>
                </MiniTable.Header>
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <MiniTable.Body
                        noDataLabel="No fatalities available"
                        data={fatalities}
                        render={(fatality) => (
                            <MiniFatalityRow
                                fatality={fatality}
                                key={fatality.id}
                            />
                        )}
                    />
                )}
            </MiniTable>
        </StyledMontylyFatalities>
    );
}

export default MonthlyFatalities;
