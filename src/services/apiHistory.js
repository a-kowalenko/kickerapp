import supabase from "./supabase";

export async function getPlayerHistory(kicker, filter) {
    const PAGE_SIZE = 1000;
    let allData = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        let query = supabase
            .from("player_history")
            .select("*")
            .eq("kicker_id", kicker);

        // Season filter
        if (filter?.seasonId !== undefined) {
            if (filter.seasonId === null) {
                // Off-season: records without a season
                query = query.is("season_id", null);
            } else {
                query = query.eq("season_id", filter.seasonId);
            }
        }
        // If seasonValue is SEASON_ALL_TIME or not provided, no season filter is applied

        // Month filter: -1 means "Entire Year", so we filter by year only
        if (filter?.month !== undefined && filter.month !== null) {
            if (filter.month === -1) {
                // Entire year - filter by year only
                const yearNum = filter.year || new Date().getFullYear();
                const start = `${yearNum}-01-01T00:00:00.000Z`;
                const end = `${yearNum + 1}-01-01T00:00:00.000Z`;

                query = query
                    .filter("created_at", "gte", start)
                    .filter("created_at", "lt", end);
            } else {
                // Specific month
                const start = new Date(
                    filter.year || new Date().getFullYear(),
                    filter.month,
                    1
                );
                const end = new Date(
                    filter.year || new Date().getFullYear(),
                    filter.month + 1,
                    1
                );

                query = query
                    .filter("created_at", "gte", start.toISOString())
                    .filter("created_at", "lt", end.toISOString());
            }
        }

        query = query
            .order("created_at", { ascending: true })
            .order("player_id", { ascending: true })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            page++;
            // If we got less than PAGE_SIZE, we've reached the end
            hasMore = data.length === PAGE_SIZE;
        } else {
            hasMore = false;
        }
    }

    return allData;
}
