import { useMatch } from "./useMatch";

function MatchDetail() {
    const { match, isLoading, error } = useMatch();
    console.log("match", match);

    if (!match || isLoading) {
        return null;
    }

    console.log("match", match);

    return <div></div>;
}

export default MatchDetail;
