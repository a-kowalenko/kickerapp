// Supabase Edge Function: process-achievement
// Processes achievements when matches end, goals are scored, or seasons end

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============== INTERFACES ==============

interface WebhookPayload {
    type: "INSERT" | "UPDATE";
    table: string;
    schema: string;
    record: MatchRecord | GoalRecord | SeasonRecord;
    old_record: MatchRecord | GoalRecord | SeasonRecord | null;
}

interface MatchRecord {
    id: number;
    player1: number;
    player2: number;
    player3: number | null;
    player4: number | null;
    status: string;
    scoreTeam1: number;
    scoreTeam2: number;
    mmrChangeTeam1: number | null;
    mmrChangeTeam2: number | null;
    mmrPlayer1: number | null;
    mmrPlayer2: number | null;
    mmrPlayer3: number | null;
    mmrPlayer4: number | null;
    gamemode: string;
    kicker_id: number;
    season_id: number | null;
    created_at: string;
    end_time: string | null;
}

interface GoalRecord {
    id: number;
    match_id: number;
    player_id: number;
    kicker_id: number;
    goal_type: string;
    amount: number;
    team: number;
    scoreTeam1: number;
    scoreTeam2: number;
    gamemode: string;
    created_at: string;
    match_started_at?: string; // Added for early goal detection
}

interface SeasonRecord {
    id: number;
    name: string;
    status: string;
    kicker_id: number;
    start_date: string;
    end_date: string | null;
}

interface PlayerAchievementRecord {
    id: number;
    player_id: number;
    achievement_id: number;
    unlocked_at: string;
    times_completed: number;
    season_id: number | null;
    match_id: number | null;
}

interface AchievementDefinition {
    id: number;
    key: string;
    name: string;
    trigger_event: string;
    condition: AchievementCondition;
    max_progress: number;
    is_repeatable: boolean;
    is_season_specific: boolean;
    parent_id: number | null;
    season_id: number | null;
    kicker_id: number;
    points: number;
}

interface AchievementCondition {
    type: "counter" | "threshold" | "streak" | "compound";
    metric?: string;
    target?: number;
    timeframe_seconds?: number; // For goals_in_timeframe
    filters?: {
        gamemode?: string;
        result?: "win" | "loss";
        score_diff?: { min?: number; max?: number };
        opponent_mmr?: { min?: number; max?: number };
        duration_seconds?: { min?: number; max?: number };
        goal_type?: string;
        final_score?: string; // e.g. "10-0", "10-9"
        time_before?: string; // e.g. "09:00" - match must end before this time
        time_after?: string; // e.g. "17:00" - match must end after this time
        day_of_week?: string; // e.g. "wednesday"
        both_scores?: number; // For own_goal_at_score when both teams have this score
    };
    streak_condition?: {
        result: "win" | "loss";
        min_streak: number;
    };
}

interface PlayerMatchContext {
    playerId: number;
    isWinner: boolean;
    isLoser: boolean;
    team: 1 | 2;
    scoreDiff: number;
    opponentMmr: number;
    ownMmr: number; // Added for MMR achievements
    gamemode: string;
    durationSeconds: number;
    match: MatchRecord;
    playerGoals: number; // Goals scored by this player in match
    teamGoals: number; // Total goals scored by player's team
    opponentGoals: number; // Goals conceded
    ownGoals: number; // Own goals by this player
    maxDeficit: number; // Maximum score deficit during match (for comeback)
    goalTimestamps: number[]; // Timestamps of goals scored by this player (for goals_in_timeframe)
}

interface PlayerGoalContext {
    playerId: number;
    goalType: string;
    gamemode: string;
    kickerId: number;
    matchId: number;
    amount: number;
    secondsSinceMatchStart: number; // Added for early goal detection
    goalTimestamps?: number[]; // All goal timestamps in this match for goals_in_timeframe
    scoreTeam1BeforeGoal: number; // Score before this goal was scored
    scoreTeam2BeforeGoal: number;
    playerTeam: 1 | 2; // Which team the player is on
}

interface MatchGoalStats {
    [playerId: number]: {
        goals: number;
        ownGoals: number;
        goalTimestamps: number[]; // For checking goals in timeframe
    };
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// ============== MAIN HANDLER ==============

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: WebhookPayload = await req.json();
        console.log(
            "Received webhook payload:",
            JSON.stringify(payload, null, 2)
        );

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const dbSchema = payload.schema || "public";

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            db: { schema: dbSchema },
        });

        // Route to appropriate handler based on table
        switch (payload.table) {
            case "matches":
                return await handleMatchEnded(
                    supabase,
                    payload as WebhookPayload & {
                        record: MatchRecord;
                        old_record: MatchRecord | null;
                    }
                );
            case "goals":
                return await handleGoalScored(
                    supabase,
                    payload as WebhookPayload & { record: GoalRecord }
                );
            case "seasons":
                return await handleSeasonEnded(
                    supabase,
                    payload as WebhookPayload & {
                        record: SeasonRecord;
                        old_record: SeasonRecord | null;
                    }
                );
            case "player_achievements":
                return await handleAchievementUnlocked(
                    supabase,
                    payload as WebhookPayload & {
                        record: PlayerAchievementRecord;
                    }
                );
            default:
                return jsonResponse({
                    message: `Unknown table: ${payload.table}`,
                });
        }
    } catch (error) {
        console.error("Error processing achievements:", error);
        return jsonResponse({ error: error.message }, 500);
    }
});

// ============== MATCH ENDED HANDLER ==============

async function handleMatchEnded(
    supabase: any,
    payload: WebhookPayload & {
        record: MatchRecord;
        old_record: MatchRecord | null;
    }
): Promise<Response> {
    const match = payload.record;
    const oldMatch = payload.old_record;

    // Check if this is a match that just ended
    const matchJustEnded =
        match.status === "ended" && oldMatch && oldMatch.status !== "ended";

    if (!matchJustEnded) {
        return jsonResponse({ message: "Match not just ended, skipping" });
    }

    console.log(`Processing MATCH_ENDED achievements for match ${match.id}`);

    // Get all MATCH_ENDED achievements for this kicker
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
        .eq("kicker_id", match.kicker_id)
        .eq("trigger_event", "MATCH_ENDED");

    if (achievementsError) {
        console.error("Error fetching achievements:", achievementsError);
        throw achievementsError;
    }

    if (!achievements || achievements.length === 0) {
        return jsonResponse({
            message: "No MATCH_ENDED achievements to process",
        });
    }

    // Filter out season-specific achievements if match has no season_id
    // Season-specific achievements should only be processed for matches within a season
    const filteredAchievements = match.season_id
        ? achievements
        : achievements.filter(
              (a: AchievementDefinition) => !a.is_season_specific
          );

    if (filteredAchievements.length === 0) {
        return jsonResponse({
            message:
                "No applicable achievements (match has no season, skipping season-specific achievements)",
        });
    }

    console.log(
        `Found ${filteredAchievements.length} MATCH_ENDED achievements to evaluate (filtered from ${achievements.length})`
    );

    // Get all players in this match
    const playerIds = [
        match.player1,
        match.player2,
        match.player3,
        match.player4,
    ].filter((id): id is number => id !== null);

    // Calculate match duration
    const startTime = new Date(match.created_at).getTime();
    const endTime = match.end_time
        ? new Date(match.end_time).getTime()
        : Date.now();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    // Determine winners and losers
    const team1Won = match.scoreTeam1 > match.scoreTeam2;
    const scoreDiff = Math.abs(match.scoreTeam1 - match.scoreTeam2);

    // Fetch goals for this match (for comeback detection, goals per player, etc.)
    const { data: matchGoals } = await supabase
        .from("goals")
        .select(
            "player_id, goal_type, team, scoreTeam1, scoreTeam2, created_at"
        )
        .eq("match_id", match.id)
        .order("created_at", { ascending: true });

    // Calculate goal stats per player and max deficit for each team
    const goalStats: MatchGoalStats = {};
    let maxDeficitTeam1 = 0; // Max deficit team1 faced (scoreTeam2 - scoreTeam1 when team2 was ahead)
    let maxDeficitTeam2 = 0; // Max deficit team2 faced

    for (const goal of matchGoals || []) {
        // Skip generated_goal - these are auto-generated and shouldn't count for achievements
        if (goal.goal_type === "generated_goal") {
            continue;
        }

        if (!goalStats[goal.player_id]) {
            goalStats[goal.player_id] = {
                goals: 0,
                ownGoals: 0,
                goalTimestamps: [],
            };
        }
        if (goal.goal_type === "own_goal") {
            goalStats[goal.player_id].ownGoals++;
        } else {
            goalStats[goal.player_id].goals++;
            // Track goal timestamps for goals_in_timeframe calculation
            goalStats[goal.player_id].goalTimestamps.push(
                new Date(goal.created_at).getTime()
            );
        }

        // Track max deficit for comeback achievements
        const deficitTeam1 = goal.scoreTeam2 - goal.scoreTeam1;
        const deficitTeam2 = goal.scoreTeam1 - goal.scoreTeam2;
        if (deficitTeam1 > maxDeficitTeam1) maxDeficitTeam1 = deficitTeam1;
        if (deficitTeam2 > maxDeficitTeam2) maxDeficitTeam2 = deficitTeam2;
    }

    // Build context for each player
    const playerContexts: PlayerMatchContext[] = buildPlayerMatchContexts(
        match,
        team1Won,
        scoreDiff,
        durationSeconds,
        goalStats,
        maxDeficitTeam1,
        maxDeficitTeam2
    );

    // Get existing unlocked achievements for all players
    const unlockedMap = await getUnlockedMap(supabase, playerIds);

    // Process each player
    const results = await processMatchAchievements(
        supabase,
        playerContexts,
        filteredAchievements,
        unlockedMap,
        match
    );

    console.log("MATCH_ENDED processing results:", results);

    return jsonResponse({
        success: true,
        event: "MATCH_ENDED",
        matchId: match.id,
        results,
    });
}

// ============== GOAL SCORED HANDLER ==============

async function handleGoalScored(
    supabase: any,
    payload: WebhookPayload & { record: GoalRecord }
): Promise<Response> {
    const goal = payload.record;

    // Only process standard goals (not own goals, generated goals, or negative amounts)
    if (goal.amount <= 0) {
        return jsonResponse({ message: "Not a positive goal, skipping" });
    }

    // Skip generated_goal - these are auto-generated and shouldn't trigger achievements
    if (goal.goal_type === "generated_goal") {
        return jsonResponse({ message: "Generated goal, skipping" });
    }

    console.log(
        `Processing GOAL_SCORED achievements for goal ${goal.id}, player ${goal.player_id}`
    );

    // Get the match to find the season_id, start time, and player teams
    const { data: match } = await supabase
        .from("matches")
        .select("season_id, created_at, player1, player2, player3, player4")
        .eq("id", goal.match_id)
        .single();

    const seasonId = match?.season_id || null;

    // Get all GOAL_SCORED achievements for this kicker
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
        .eq("kicker_id", goal.kicker_id)
        .eq("trigger_event", "GOAL_SCORED");

    if (achievementsError) {
        console.error("Error fetching achievements:", achievementsError);
        throw achievementsError;
    }

    if (!achievements || achievements.length === 0) {
        return jsonResponse({
            message: "No GOAL_SCORED achievements to process",
        });
    }

    // Filter out season-specific achievements if match has no season_id
    // Season-specific achievements should only be processed for matches within a season
    const filteredAchievements = seasonId
        ? achievements
        : achievements.filter(
              (a: AchievementDefinition) => !a.is_season_specific
          );

    if (filteredAchievements.length === 0) {
        return jsonResponse({
            message:
                "No applicable achievements (match has no season, skipping season-specific achievements)",
        });
    }

    console.log(
        `Found ${filteredAchievements.length} GOAL_SCORED achievements to evaluate (filtered from ${achievements.length})`
    );

    // Determine which team the player is on
    let playerTeam: 1 | 2 = 1;
    if (match) {
        if (
            goal.player_id === match.player1 ||
            goal.player_id === match.player3
        ) {
            playerTeam = 1;
        } else if (
            goal.player_id === match.player2 ||
            goal.player_id === match.player4
        ) {
            playerTeam = 2;
        }
    }

    // Calculate scores BEFORE this goal was scored
    // The goal record contains the score AFTER the goal
    let scoreTeam1BeforeGoal = goal.scoreTeam1;
    let scoreTeam2BeforeGoal = goal.scoreTeam2;

    // Adjust based on goal type and which team scored
    if (goal.goal_type === "own_goal") {
        // Own goal: goal goes to the opposing team
        if (playerTeam === 1) {
            scoreTeam2BeforeGoal -= goal.amount;
        } else {
            scoreTeam1BeforeGoal -= goal.amount;
        }
    } else {
        // Standard goal: goes to the player's team
        if (goal.team === 1) {
            scoreTeam1BeforeGoal -= goal.amount;
        } else {
            scoreTeam2BeforeGoal -= goal.amount;
        }
    }

    // Calculate seconds since match start for early goal detection
    const goalTime = new Date(goal.created_at).getTime();
    const matchStartTime = match?.created_at
        ? new Date(match.created_at).getTime()
        : goalTime;
    const secondsSinceMatchStart = Math.floor(
        (goalTime - matchStartTime) / 1000
    );

    // Get all goals from this player in this match (for goals_in_timeframe)
    // Exclude own_goal and generated_goal
    const { data: playerGoalsInMatch } = await supabase
        .from("goals")
        .select("created_at, goal_type")
        .eq("match_id", goal.match_id)
        .eq("player_id", goal.player_id)
        .eq("goal_type", "standard_goal")
        .order("created_at", { ascending: true });

    // Convert to timestamps
    const goalTimestamps = (playerGoalsInMatch || []).map((g: any) =>
        new Date(g.created_at).getTime()
    );

    // Build context for this goal
    const goalCtx: PlayerGoalContext = {
        playerId: goal.player_id,
        goalType: goal.goal_type,
        gamemode: goal.gamemode,
        kickerId: goal.kicker_id,
        matchId: goal.match_id,
        amount: goal.amount,
        secondsSinceMatchStart,
        goalTimestamps, // All goal timestamps in this match for this player
        scoreTeam1BeforeGoal,
        scoreTeam2BeforeGoal,
        playerTeam,
    };

    // Get existing unlocked achievements
    const unlockedMap = await getUnlockedMap(supabase, [goal.player_id]);

    // Track which achievements were unlocked in THIS iteration (to prevent double-counting for chains)
    const newlyUnlockedInThisIteration = new Set<number>();

    const results: Array<{
        playerId: number;
        achievementId: number;
        action: string;
    }> = [];

    for (const achievement of filteredAchievements as AchievementDefinition[]) {
        // Skip if season-specific and doesn't match
        if (achievement.season_id && achievement.season_id !== seasonId) {
            continue;
        }

        // Check if parent achievement is unlocked (chain logic)
        if (achievement.parent_id) {
            const parentKey = `${goal.player_id}-${achievement.parent_id}`;
            const parentWasAlreadyUnlocked = unlockedMap.has(parentKey);
            const parentJustUnlocked = newlyUnlockedInThisIteration.has(
                achievement.parent_id
            );

            // Parent must be unlocked
            if (!parentWasAlreadyUnlocked && !parentJustUnlocked) {
                continue;
            }

            // If parent was JUST unlocked in this iteration, initialize the child's progress
            // with the parent's max_progress. The event that triggered the parent was already
            // counted in parent's max_progress, so we should NOT count it again for the child.
            if (parentJustUnlocked) {
                // Initialize child progress with parent's max_progress (carry over the count)
                const parentAchievement = (
                    filteredAchievements as AchievementDefinition[]
                ).find((a) => a.id === achievement.parent_id);
                if (parentAchievement) {
                    // Determine season_id for the child achievement's progress
                    const childProgressSeasonId = achievement.is_season_specific
                        ? seasonId
                        : null;
                    await initializeChainProgress(
                        supabase,
                        goal.player_id,
                        achievement.id,
                        parentAchievement.max_progress,
                        childProgressSeasonId
                    );
                    console.log(
                        `[Chain] Initialized child achievement ${achievement.id} with parent's max_progress: ${parentAchievement.max_progress}, season_id: ${childProgressSeasonId}`
                    );
                }
                // Skip this event for the child - it was already counted in parent's progress
                continue;
            }
        }

        // Check if already unlocked (and not repeatable)
        const alreadyUnlocked = unlockedMap.has(
            `${goal.player_id}-${achievement.id}`
        );
        if (alreadyUnlocked && !achievement.is_repeatable) {
            continue;
        }

        // Evaluate goal condition
        const conditionMet = evaluateGoalCondition(
            achievement.condition,
            goalCtx
        );

        if (conditionMet) {
            // Special handling for goals_in_day - check actual count from DB
            if (achievement.condition.metric === "goals_in_day") {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const { data: goalsToday, error: countError } = await supabase
                    .from("goals")
                    .select("id", { count: "exact" })
                    .eq("player_id", goal.player_id)
                    .eq("kicker_id", goal.kicker_id)
                    .neq("goal_type", "own_goal") // Only count regular goals, not own goals
                    .gte("created_at", todayStart.toISOString());

                const goalCount = goalsToday?.length || 0;
                const target = achievement.condition.target || 25;

                console.log(
                    `[goals_in_day] Player ${goal.player_id}: ${goalCount} goals today, target: ${target}`
                );

                if (goalCount >= target && !alreadyUnlocked) {
                    // Award the achievement directly
                    const result = await awardAchievementDirectly(
                        supabase,
                        goal.player_id,
                        achievement,
                        seasonId,
                        goal.match_id,
                        alreadyUnlocked
                    );
                    results.push({
                        playerId: goal.player_id,
                        achievementId: achievement.id,
                        action: result,
                    });

                    if (result === "unlocked") {
                        unlockedMap.set(
                            `${goal.player_id}-${achievement.id}`,
                            true
                        );
                        newlyUnlockedInThisIteration.add(achievement.id);
                    }
                }
                continue; // Skip normal progress update
            }

            // Special handling for own_goals_in_day - check actual count from DB
            if (achievement.condition.metric === "own_goals_in_day") {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const { data: ownGoalsToday, error: countError } =
                    await supabase
                        .from("goals")
                        .select("id", { count: "exact" })
                        .eq("player_id", goal.player_id)
                        .eq("kicker_id", goal.kicker_id)
                        .eq("goal_type", "own_goal")
                        .gte("created_at", todayStart.toISOString());

                const ownGoalCount = ownGoalsToday?.length || 0;
                const target = achievement.condition.target || 5;

                console.log(
                    `[own_goals_in_day] Player ${goal.player_id}: ${ownGoalCount} own goals today, target: ${target}`
                );

                if (ownGoalCount >= target && !alreadyUnlocked) {
                    // Award the achievement directly
                    const result = await awardAchievementDirectly(
                        supabase,
                        goal.player_id,
                        achievement,
                        seasonId,
                        goal.match_id,
                        alreadyUnlocked
                    );
                    results.push({
                        playerId: goal.player_id,
                        achievementId: achievement.id,
                        action: result,
                    });

                    if (result === "unlocked") {
                        unlockedMap.set(
                            `${goal.player_id}-${achievement.id}`,
                            true
                        );
                        newlyUnlockedInThisIteration.add(achievement.id);
                    }
                }
                continue; // Skip normal progress update
            }

            const result = await updateProgress(
                supabase,
                goal.player_id,
                achievement,
                seasonId,
                goal.match_id,
                alreadyUnlocked
            );
            results.push({
                playerId: goal.player_id,
                achievementId: achievement.id,
                action: result,
            });

            if (result === "unlocked") {
                unlockedMap.set(`${goal.player_id}-${achievement.id}`, true);
                newlyUnlockedInThisIteration.add(achievement.id);
            }
        }
    }

    console.log("GOAL_SCORED processing results:", results);

    return jsonResponse({
        success: true,
        event: "GOAL_SCORED",
        goalId: goal.id,
        results,
    });
}

// ============== SEASON ENDED HANDLER ==============

async function handleSeasonEnded(
    supabase: any,
    payload: WebhookPayload & {
        record: SeasonRecord;
        old_record: SeasonRecord | null;
    }
): Promise<Response> {
    const season = payload.record;
    const oldSeason = payload.old_record;

    // Check if this is a season that just ended
    const seasonJustEnded =
        season.status === "ended" && oldSeason && oldSeason.status !== "ended";

    if (!seasonJustEnded) {
        return jsonResponse({ message: "Season not just ended, skipping" });
    }

    console.log(`Processing SEASON_ENDED achievements for season ${season.id}`);

    // Get all SEASON_ENDED achievements for this kicker
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
        .eq("kicker_id", season.kicker_id)
        .eq("trigger_event", "SEASON_ENDED");

    if (achievementsError) {
        console.error("Error fetching achievements:", achievementsError);
        throw achievementsError;
    }

    if (!achievements || achievements.length === 0) {
        return jsonResponse({
            message: "No SEASON_ENDED achievements to process",
        });
    }

    console.log(
        `Found ${achievements.length} SEASON_ENDED achievements to evaluate`
    );

    // Get all players who participated in this season (from season_end_history or rankings)
    const { data: seasonPlayers } = await supabase
        .from("season_end_history")
        .select("player_id, mmr, wins, losses, rank")
        .eq("season_id", season.id)
        .eq("kicker_id", season.kicker_id);

    if (!seasonPlayers || seasonPlayers.length === 0) {
        return jsonResponse({ message: "No players found for this season" });
    }

    const playerIds = seasonPlayers.map((p: any) => p.player_id);
    const unlockedMap = await getUnlockedMap(supabase, playerIds);

    const results: Array<{
        playerId: number;
        achievementId: number;
        action: string;
    }> = [];

    for (const playerData of seasonPlayers) {
        for (const achievement of achievements as AchievementDefinition[]) {
            // Skip if season-specific and doesn't match
            if (achievement.season_id && achievement.season_id !== season.id) {
                continue;
            }

            // Check if parent achievement is unlocked
            if (achievement.parent_id) {
                const parentKey = `${playerData.player_id}-${achievement.parent_id}`;
                if (!unlockedMap.has(parentKey)) {
                    continue;
                }
            }

            // Check if already unlocked
            const alreadyUnlocked = unlockedMap.has(
                `${playerData.player_id}-${achievement.id}`
            );
            if (alreadyUnlocked && !achievement.is_repeatable) {
                continue;
            }

            // Evaluate season condition
            const conditionMet = evaluateSeasonCondition(
                achievement.condition,
                playerData
            );

            if (conditionMet) {
                const result = await updateProgress(
                    supabase,
                    playerData.player_id,
                    achievement,
                    season.id,
                    null,
                    alreadyUnlocked
                );
                results.push({
                    playerId: playerData.player_id,
                    achievementId: achievement.id,
                    action: result,
                });

                if (result === "unlocked") {
                    unlockedMap.set(
                        `${playerData.player_id}-${achievement.id}`,
                        true
                    );
                }
            }
        }
    }

    console.log("SEASON_ENDED processing results:", results);

    return jsonResponse({
        success: true,
        event: "SEASON_ENDED",
        seasonId: season.id,
        results,
    });
}

// ============== ACHIEVEMENT UNLOCKED HANDLER ==============

async function handleAchievementUnlocked(
    supabase: any,
    payload: WebhookPayload & {
        record: PlayerAchievementRecord;
    }
): Promise<Response> {
    // Only process INSERTs (new achievements)
    if (payload.type !== "INSERT") {
        return jsonResponse({ message: "Not an INSERT, skipping" });
    }

    const playerAchievement = payload.record;
    const playerId = playerAchievement.player_id;
    const unlockedAchievementId = playerAchievement.achievement_id;

    console.log(
        `Processing ACHIEVEMENT_UNLOCKED for player ${playerId}, achievement ${unlockedAchievementId}`
    );

    // First, get the achievement that was just unlocked to find the kicker_id and is_hidden
    const { data: unlockedAchievement, error: unlockedError } = await supabase
        .from("achievement_definitions")
        .select("kicker_id, is_hidden")
        .eq("id", unlockedAchievementId)
        .single();

    if (unlockedError || !unlockedAchievement) {
        console.error("Error fetching unlocked achievement:", unlockedError);
        return jsonResponse({ message: "Could not find unlocked achievement" });
    }

    const kickerId = unlockedAchievement.kicker_id;
    const unlockedIsHidden = unlockedAchievement.is_hidden;

    // Get all ACHIEVEMENT_UNLOCKED achievements for this kicker
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
        .eq("kicker_id", kickerId)
        .eq("trigger_event", "ACHIEVEMENT_UNLOCKED");

    if (achievementsError) {
        console.error("Error fetching achievements:", achievementsError);
        throw achievementsError;
    }

    if (!achievements || achievements.length === 0) {
        return jsonResponse({
            message: "No ACHIEVEMENT_UNLOCKED achievements to process",
        });
    }

    console.log(
        `Found ${achievements.length} ACHIEVEMENT_UNLOCKED achievements to evaluate`
    );

    // Count total achievements unlocked by this player
    const { count: totalUnlocked, error: countError } = await supabase
        .from("player_achievements")
        .select("*", { count: "exact", head: true })
        .eq("player_id", playerId);

    if (countError) {
        console.error("Error counting achievements:", countError);
        throw countError;
    }

    console.log(
        `Player ${playerId} has ${totalUnlocked} achievements unlocked`
    );

    // Get total achievement count for "all_achievements" metric
    const { count: totalAchievements, error: totalError } = await supabase
        .from("achievement_definitions")
        .select("*", { count: "exact", head: true })
        .eq("kicker_id", kickerId)
        .neq("trigger_event", "ACHIEVEMENT_UNLOCKED"); // Don't count meta-achievements

    if (totalError) {
        console.error("Error counting total achievements:", totalError);
        throw totalError;
    }

    console.log(`Total achievements for kicker: ${totalAchievements}`);

    // Get already unlocked map for this player
    const unlockedMap = await getUnlockedMap(supabase, [playerId]);

    const results: Array<{
        playerId: number;
        achievementId: number;
        action: string;
    }> = [];

    for (const achievement of achievements as AchievementDefinition[]) {
        // Don't let meta-achievements trigger themselves
        if (achievement.id === unlockedAchievementId) {
            continue;
        }

        // Check if parent achievement is unlocked
        if (achievement.parent_id) {
            const parentKey = `${playerId}-${achievement.parent_id}`;
            if (!unlockedMap.has(parentKey)) {
                continue;
            }
        }

        // Check if already unlocked
        const alreadyUnlocked = unlockedMap.has(
            `${playerId}-${achievement.id}`
        );
        if (alreadyUnlocked && !achievement.is_repeatable) {
            continue;
        }

        // Evaluate condition
        const condition = achievement.condition as AchievementCondition;
        let conditionMet = false;
        let increment = 1;

        if (condition.metric === "achievements_unlocked") {
            // Counter type: track total achievements
            const target = condition.target || 0;
            if (condition.type === "counter") {
                // Always increment by 1 for each unlock
                conditionMet = true;
                increment = 1;
            } else if (condition.type === "threshold") {
                conditionMet = (totalUnlocked || 0) >= target;
            }
        } else if (condition.metric === "secret_achievements_unlocked") {
            // Counter type: track secret achievements unlocked
            // Only increment if the unlocked achievement is secret
            if (condition.type === "counter") {
                if (unlockedIsHidden) {
                    conditionMet = true;
                    increment = 1;
                    console.log(
                        `[secret_achievements_unlocked] Secret achievement unlocked, incrementing Secret Finder`
                    );
                } else {
                    console.log(
                        `[secret_achievements_unlocked] Non-secret achievement unlocked, skipping`
                    );
                }
            } else if (condition.type === "threshold") {
                // Count total secret achievements unlocked by this player
                const { data: hiddenUnlocked } = await supabase
                    .from("player_achievements")
                    .select(
                        "achievement:achievement_definitions!inner(is_hidden)"
                    )
                    .eq("player_id", playerId);
                const hiddenCount = (hiddenUnlocked || []).filter(
                    (pa: any) => pa.achievement?.is_hidden
                ).length;
                conditionMet = hiddenCount >= (condition.target || 0);
            }
        } else if (condition.metric === "all_achievements") {
            // Check if player has all non-meta achievements
            // totalUnlocked - 1 because we don't count the current meta achievement being checked
            // But we need to count achievements excluding ACHIEVEMENT_UNLOCKED trigger
            const nonMetaUnlockedCount = totalUnlocked || 0;
            conditionMet = nonMetaUnlockedCount >= (totalAchievements || 0);
            console.log(
                `Completionist check: ${nonMetaUnlockedCount} unlocked vs ${totalAchievements} total`
            );
        }

        if (conditionMet) {
            // For all-time meta-achievements (is_season_specific=false), use null for season_id
            // For season-specific meta-achievements, use the triggering achievement's season_id
            const progressSeasonId = achievement.is_season_specific
                ? playerAchievement.season_id
                : null;

            const result = await updateProgressWithAmount(
                supabase,
                playerId,
                achievement,
                progressSeasonId,
                playerAchievement.match_id,
                alreadyUnlocked,
                increment
            );
            results.push({
                playerId,
                achievementId: achievement.id,
                action: result,
            });

            if (result === "unlocked") {
                unlockedMap.set(`${playerId}-${achievement.id}`, true);
            }
        }
    }

    console.log("ACHIEVEMENT_UNLOCKED processing results:", results);

    return jsonResponse({
        success: true,
        event: "ACHIEVEMENT_UNLOCKED",
        playerId,
        unlockedAchievementId,
        totalUnlocked,
        results,
    });
}

// ============== STREAK HELPER FUNCTIONS ==============

async function getPlayerStreak(
    supabase: any,
    playerId: number,
    kickerId: number,
    gamemode: string | null,
    streakType: "win" | "loss",
    seasonId: number | null = null,
    isSeasonSpecific: boolean = true
): Promise<number> {
    // Build query for recent matches for this player, ordered by end_time desc
    let query = supabase
        .from("matches")
        .select(
            "player1, player2, player3, player4, scoreTeam1, scoreTeam2, gamemode"
        )
        .eq("kicker_id", kickerId)
        .eq("status", "ended")
        .or(
            `player1.eq.${playerId},player2.eq.${playerId},player3.eq.${playerId},player4.eq.${playerId}`
        )
        .order("end_time", { ascending: false })
        .limit(50);

    // Filter by gamemode if specified
    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    // Filter by season for season-specific achievements
    if (isSeasonSpecific && seasonId) {
        query = query.eq("season_id", seasonId);
    }

    const { data: matches, error } = await query;

    if (error) {
        console.error("Error fetching matches for streak:", error);
        return 0;
    }

    if (!matches || matches.length === 0) return 0;

    console.log(
        `[Streak] Player ${playerId}, gamemode: ${
            gamemode || "all"
        }, streakType: ${streakType}, matches found: ${matches.length}`
    );

    let streak = 0;
    for (const match of matches) {
        const isTeam1 =
            match.player1 === playerId || match.player3 === playerId;
        const isWinner = isTeam1
            ? match.scoreTeam1 > match.scoreTeam2
            : match.scoreTeam2 > match.scoreTeam1;

        const matchResult = isWinner ? "win" : "loss";

        console.log(
            `[Streak] Match result: ${matchResult}, looking for: ${streakType}`
        );

        if (matchResult === streakType) {
            streak++;
        } else {
            break; // Streak broken
        }
    }

    console.log(`[Streak] Final streak count: ${streak}`);
    return streak;
}

// ============== HELPER FUNCTIONS ==============

function jsonResponse(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function buildPlayerMatchContexts(
    match: MatchRecord,
    team1Won: boolean,
    scoreDiff: number,
    durationSeconds: number,
    goalStats: MatchGoalStats,
    maxDeficitTeam1: number,
    maxDeficitTeam2: number
): PlayerMatchContext[] {
    const contexts: PlayerMatchContext[] = [];

    // Calculate team MMRs for 2on2
    const team1AvgMmr = match.player3
        ? ((match.mmrPlayer1 || 1000) + (match.mmrPlayer3 || 1000)) / 2
        : match.mmrPlayer1 || 1000;
    const team2AvgMmr = match.player4
        ? ((match.mmrPlayer2 || 1000) + (match.mmrPlayer4 || 1000)) / 2
        : match.mmrPlayer2 || 1000;

    // Calculate team goals for carry/silent partner detection
    const team1Players = [match.player1, match.player3].filter(
        Boolean
    ) as number[];
    const team2Players = [match.player2, match.player4].filter(
        Boolean
    ) as number[];

    const team1TotalGoals = team1Players.reduce(
        (sum, pid) => sum + (goalStats[pid]?.goals || 0),
        0
    );
    const team2TotalGoals = team2Players.reduce(
        (sum, pid) => sum + (goalStats[pid]?.goals || 0),
        0
    );

    // Player 1 (Team 1)
    contexts.push({
        playerId: match.player1,
        isWinner: team1Won,
        isLoser: !team1Won,
        team: 1,
        scoreDiff,
        opponentMmr: team2AvgMmr,
        ownMmr: match.mmrPlayer1 || 1000,
        gamemode: match.gamemode,
        durationSeconds,
        match,
        playerGoals: goalStats[match.player1]?.goals || 0,
        teamGoals: team1TotalGoals,
        opponentGoals: match.scoreTeam2,
        ownGoals: goalStats[match.player1]?.ownGoals || 0,
        maxDeficit: maxDeficitTeam1,
        goalTimestamps: goalStats[match.player1]?.goalTimestamps || [],
    });

    // Player 2 (Team 2)
    contexts.push({
        playerId: match.player2,
        isWinner: !team1Won,
        isLoser: team1Won,
        team: 2,
        scoreDiff,
        opponentMmr: team1AvgMmr,
        ownMmr: match.mmrPlayer2 || 1000,
        gamemode: match.gamemode,
        durationSeconds,
        match,
        playerGoals: goalStats[match.player2]?.goals || 0,
        teamGoals: team2TotalGoals,
        opponentGoals: match.scoreTeam1,
        ownGoals: goalStats[match.player2]?.ownGoals || 0,
        maxDeficit: maxDeficitTeam2,
        goalTimestamps: goalStats[match.player2]?.goalTimestamps || [],
    });

    // Player 3 (Team 1) if exists
    if (match.player3) {
        contexts.push({
            playerId: match.player3,
            isWinner: team1Won,
            isLoser: !team1Won,
            team: 1,
            scoreDiff,
            opponentMmr: team2AvgMmr,
            ownMmr: match.mmrPlayer3 || 1000,
            gamemode: match.gamemode,
            durationSeconds,
            match,
            playerGoals: goalStats[match.player3]?.goals || 0,
            teamGoals: team1TotalGoals,
            opponentGoals: match.scoreTeam2,
            ownGoals: goalStats[match.player3]?.ownGoals || 0,
            maxDeficit: maxDeficitTeam1,
            goalTimestamps: goalStats[match.player3]?.goalTimestamps || [],
        });
    }

    // Player 4 (Team 2) if exists
    if (match.player4) {
        contexts.push({
            playerId: match.player4,
            isWinner: !team1Won,
            isLoser: team1Won,
            team: 2,
            scoreDiff,
            opponentMmr: team1AvgMmr,
            ownMmr: match.mmrPlayer4 || 1000,
            gamemode: match.gamemode,
            durationSeconds,
            match,
            playerGoals: goalStats[match.player4]?.goals || 0,
            teamGoals: team2TotalGoals,
            opponentGoals: match.scoreTeam1,
            ownGoals: goalStats[match.player4]?.ownGoals || 0,
            maxDeficit: maxDeficitTeam2,
            goalTimestamps: goalStats[match.player4]?.goalTimestamps || [],
        });
    }

    return contexts;
}

async function getUnlockedMap(
    supabase: any,
    playerIds: number[]
): Promise<Map<string, boolean>> {
    const { data: existingUnlocks } = await supabase
        .from("player_achievements")
        .select("player_id, achievement_id")
        .in("player_id", playerIds);

    const unlockedMap = new Map<string, boolean>();
    existingUnlocks?.forEach((u: any) => {
        unlockedMap.set(`${u.player_id}-${u.achievement_id}`, true);
    });

    return unlockedMap;
}

async function processMatchAchievements(
    supabase: any,
    playerContexts: PlayerMatchContext[],
    achievements: AchievementDefinition[],
    unlockedMap: Map<string, boolean>,
    match: MatchRecord
): Promise<Array<{ playerId: number; achievementId: number; action: string }>> {
    const results: Array<{
        playerId: number;
        achievementId: number;
        action: string;
    }> = [];

    // Track newly unlocked achievements in this iteration for chain handling
    const newlyUnlockedInThisIteration = new Set<number>();

    // Pre-calculate streaks for all players if any streak achievements exist
    const streakAchievements = achievements.filter(
        (a) => a.condition.type === "streak"
    );
    const playerStreaks = new Map<string, number>(); // "playerId-gamemode-streakType-seasonSpecific" -> streak count

    if (streakAchievements.length > 0) {
        for (const playerCtx of playerContexts) {
            for (const achievement of streakAchievements) {
                const streakCond = achievement.condition.streak_condition;
                const gamemode =
                    achievement.condition.filters?.gamemode || null;
                if (streakCond) {
                    // Include season-specificity in the key
                    const streakKey = `${playerCtx.playerId}-${
                        gamemode || "all"
                    }-${streakCond.result}-${
                        achievement.is_season_specific ? "season" : "alltime"
                    }`;
                    if (!playerStreaks.has(streakKey)) {
                        const streak = await getPlayerStreak(
                            supabase,
                            playerCtx.playerId,
                            match.kicker_id,
                            gamemode,
                            streakCond.result,
                            match.season_id,
                            achievement.is_season_specific
                        );
                        playerStreaks.set(streakKey, streak);
                    }
                }
            }
        }
    }

    for (const playerCtx of playerContexts) {
        for (const achievement of achievements) {
            // Skip if season-specific and doesn't match
            if (
                achievement.season_id &&
                achievement.season_id !== match.season_id
            ) {
                continue;
            }

            // Check if parent achievement is unlocked (chain logic)
            if (achievement.parent_id) {
                const parentKey = `${playerCtx.playerId}-${achievement.parent_id}`;
                const parentWasAlreadyUnlocked = unlockedMap.has(parentKey);
                const parentJustUnlocked = newlyUnlockedInThisIteration.has(
                    achievement.parent_id
                );

                // Parent must be unlocked
                if (!parentWasAlreadyUnlocked && !parentJustUnlocked) {
                    continue;
                }

                // If parent was JUST unlocked, initialize child's progress with parent's max_progress
                // The event that triggered the parent was already counted in parent's max_progress,
                // so we should NOT count it again for the child - just initialize and skip
                if (parentJustUnlocked) {
                    const parentAchievement = achievements.find(
                        (a) => a.id === achievement.parent_id
                    );
                    if (parentAchievement) {
                        // Determine season_id for the child achievement's progress
                        const childProgressSeasonId =
                            achievement.is_season_specific
                                ? match.season_id
                                : null;
                        await initializeChainProgress(
                            supabase,
                            playerCtx.playerId,
                            achievement.id,
                            parentAchievement.max_progress,
                            childProgressSeasonId
                        );
                        console.log(
                            `[Chain] Initialized child achievement ${achievement.id} with parent's max_progress: ${parentAchievement.max_progress}, season_id: ${childProgressSeasonId}`
                        );
                    }
                    // Skip this event for the child - it was already counted in parent's progress
                    continue;
                }
            }

            // Check if already unlocked (and not repeatable)
            const alreadyUnlocked = unlockedMap.has(
                `${playerCtx.playerId}-${achievement.id}`
            );
            if (alreadyUnlocked && !achievement.is_repeatable) {
                continue;
            }

            // Special handling for streak achievements
            if (achievement.condition.type === "streak") {
                const streakCond = achievement.condition.streak_condition;
                const achievementGamemode =
                    achievement.condition.filters?.gamemode || null;

                // IMPORTANT: Skip if this achievement is for a different gamemode than the current match
                if (
                    achievementGamemode &&
                    achievementGamemode !== playerCtx.gamemode
                ) {
                    console.log(
                        `[Streak] Skipping ${achievement.key} - achievement gamemode ${achievementGamemode} != match gamemode ${playerCtx.gamemode}`
                    );
                    continue;
                }

                if (streakCond) {
                    const streakKey = `${playerCtx.playerId}-${
                        achievementGamemode || "all"
                    }-${streakCond.result}-${
                        achievement.is_season_specific ? "season" : "alltime"
                    }`;
                    const currentStreak = playerStreaks.get(streakKey) || 0;

                    console.log(
                        `[Streak] Player ${playerCtx.playerId}, achievement ${achievement.key}: currentStreak=${currentStreak}, min_streak=${streakCond.min_streak}`
                    );

                    // Check if current streak meets the requirement
                    if (currentStreak >= streakCond.min_streak) {
                        // Directly award the achievement (threshold type, max_progress = 1)
                        const result = await awardAchievementDirectly(
                            supabase,
                            playerCtx.playerId,
                            achievement,
                            match.season_id,
                            match.id,
                            alreadyUnlocked
                        );
                        results.push({
                            playerId: playerCtx.playerId,
                            achievementId: achievement.id,
                            action: result,
                        });

                        if (result === "unlocked") {
                            unlockedMap.set(
                                `${playerCtx.playerId}-${achievement.id}`,
                                true
                            );
                            newlyUnlockedInThisIteration.add(achievement.id);
                        }
                    }
                }
                continue; // Skip normal condition evaluation for streaks
            }

            // Special handling for unique_opponents_defeated - set absolute progress
            if (achievement.condition.metric === "unique_opponents_defeated") {
                const uniqueCount = await calculateUniqueOpponentsDefeated(
                    supabase,
                    playerCtx.playerId,
                    match.kicker_id,
                    match.season_id,
                    achievement.is_season_specific,
                    achievement.condition.filters?.gamemode || null
                );

                const result = await setProgressAbsolute(
                    supabase,
                    playerCtx.playerId,
                    achievement,
                    match.season_id,
                    match.id,
                    alreadyUnlocked,
                    uniqueCount
                );
                results.push({
                    playerId: playerCtx.playerId,
                    achievementId: achievement.id,
                    action: result,
                });

                if (result === "unlocked") {
                    unlockedMap.set(
                        `${playerCtx.playerId}-${achievement.id}`,
                        true
                    );
                    newlyUnlockedInThisIteration.add(achievement.id);
                }
                continue;
            }

            // Special handling for unique_teammates_won_with - set absolute progress
            if (achievement.condition.metric === "unique_teammates_won_with") {
                const uniqueCount = await calculateUniqueTeammatesWonWith(
                    supabase,
                    playerCtx.playerId,
                    match.kicker_id,
                    match.season_id,
                    achievement.is_season_specific
                );

                const result = await setProgressAbsolute(
                    supabase,
                    playerCtx.playerId,
                    achievement,
                    match.season_id,
                    match.id,
                    alreadyUnlocked,
                    uniqueCount
                );
                results.push({
                    playerId: playerCtx.playerId,
                    achievementId: achievement.id,
                    action: result,
                });

                if (result === "unlocked") {
                    unlockedMap.set(
                        `${playerCtx.playerId}-${achievement.id}`,
                        true
                    );
                    newlyUnlockedInThisIteration.add(achievement.id);
                }
                continue;
            }

            // Evaluate condition
            const conditionMet = await evaluateMatchCondition(
                supabase,
                achievement.condition,
                playerCtx,
                match,
                achievement
            );

            if (conditionMet) {
                // Special handling for playtime_seconds - increment by duration, not 1
                let incrementAmount = 1;
                if (achievement.condition.metric === "playtime_seconds") {
                    incrementAmount = playerCtx.durationSeconds;
                }

                const result = await updateProgressWithAmount(
                    supabase,
                    playerCtx.playerId,
                    achievement,
                    match.season_id,
                    match.id,
                    alreadyUnlocked,
                    incrementAmount
                );
                results.push({
                    playerId: playerCtx.playerId,
                    achievementId: achievement.id,
                    action: result,
                });

                if (result === "unlocked") {
                    unlockedMap.set(
                        `${playerCtx.playerId}-${achievement.id}`,
                        true
                    );
                    newlyUnlockedInThisIteration.add(achievement.id);
                }
            }
        }
    }

    return results;
}

// Award achievement directly (for threshold=1 achievements like streaks)
async function awardAchievementDirectly(
    supabase: any,
    playerId: number,
    achievement: AchievementDefinition,
    seasonId: number | null,
    matchId: number | null,
    alreadyUnlocked: boolean
): Promise<string> {
    const now = new Date().toISOString();

    if (alreadyUnlocked) {
        if (achievement.is_repeatable) {
            const { data: existingAchievement } = await supabase
                .from("player_achievements")
                .select("times_completed")
                .eq("player_id", playerId)
                .eq("achievement_id", achievement.id)
                .single();

            await supabase
                .from("player_achievements")
                .update({
                    times_completed:
                        (existingAchievement?.times_completed || 1) + 1,
                })
                .eq("player_id", playerId)
                .eq("achievement_id", achievement.id);
        }
        return "unlocked";
    }

    // Award new achievement
    const { error: awardError } = await supabase
        .from("player_achievements")
        .insert({
            player_id: playerId,
            achievement_id: achievement.id,
            unlocked_at: now,
            season_id: seasonId,
            match_id: matchId,
        });

    if (awardError) {
        console.error("Error awarding achievement:", awardError);
        return "error";
    }

    // Also update progress to max
    await supabase.from("player_achievement_progress").upsert(
        {
            player_id: playerId,
            achievement_id: achievement.id,
            current_progress: achievement.max_progress,
            updated_at: now,
        },
        { onConflict: "player_id,achievement_id" }
    );

    console.log(`Achievement ${achievement.id} awarded to player ${playerId}!`);
    return "unlocked";
}

// ============== CONDITION EVALUATORS ==============

async function evaluateMatchCondition(
    supabase: any,
    condition: AchievementCondition,
    ctx: PlayerMatchContext,
    match: MatchRecord,
    achievement: AchievementDefinition
): Promise<boolean> {
    const filters = condition.filters || {};

    // Check gamemode filter
    if (filters.gamemode && filters.gamemode !== ctx.gamemode) {
        return false;
    }

    // Check result filter
    if (filters.result) {
        if (filters.result === "win" && !ctx.isWinner) return false;
        if (filters.result === "loss" && !ctx.isLoser) return false;
    }

    // Check score_diff filter
    if (filters.score_diff) {
        if (filters.score_diff.min && ctx.scoreDiff < filters.score_diff.min)
            return false;
        if (filters.score_diff.max && ctx.scoreDiff > filters.score_diff.max)
            return false;
    }

    // Check opponent_mmr filter
    if (filters.opponent_mmr) {
        if (
            filters.opponent_mmr.min &&
            ctx.opponentMmr < filters.opponent_mmr.min
        )
            return false;
        if (
            filters.opponent_mmr.max &&
            ctx.opponentMmr > filters.opponent_mmr.max
        )
            return false;
    }

    // Check duration filter
    if (filters.duration_seconds) {
        if (
            filters.duration_seconds.min &&
            ctx.durationSeconds < filters.duration_seconds.min
        )
            return false;
        if (
            filters.duration_seconds.max &&
            ctx.durationSeconds > filters.duration_seconds.max
        )
            return false;
    }

    // Check final_score filter (e.g. "10-0", "10-9")
    if (filters.final_score) {
        const [winnerScore, loserScore] = filters.final_score
            .split("-")
            .map(Number);
        const playerWon = ctx.isWinner;
        const playerTeamScore =
            ctx.team === 1 ? ctx.match.scoreTeam1 : ctx.match.scoreTeam2;
        const opponentTeamScore =
            ctx.team === 1 ? ctx.match.scoreTeam2 : ctx.match.scoreTeam1;

        // Check if the score matches (winner score - loser score)
        if (playerWon) {
            if (
                playerTeamScore !== winnerScore ||
                opponentTeamScore !== loserScore
            ) {
                return false;
            }
        } else {
            // If player lost, they can't match a winning score pattern
            return false;
        }
    }

    // Check time_before filter (match must have ended before this time of day)
    if (filters.time_before) {
        const matchEndTime = ctx.match.end_time
            ? new Date(ctx.match.end_time)
            : new Date();
        const [targetHour, targetMin] = filters.time_before
            .split(":")
            .map(Number);
        const matchHour = matchEndTime.getHours();
        const matchMin = matchEndTime.getMinutes();

        // Match must be before the target time
        if (
            matchHour > targetHour ||
            (matchHour === targetHour && matchMin >= targetMin)
        ) {
            return false;
        }
    }

    // Check time_after filter (match must have ended after this time of day)
    if (filters.time_after) {
        const matchEndTime = ctx.match.end_time
            ? new Date(ctx.match.end_time)
            : new Date();
        const [targetHour, targetMin] = filters.time_after
            .split(":")
            .map(Number);
        const matchHour = matchEndTime.getHours();
        const matchMin = matchEndTime.getMinutes();

        // Match must be after the target time
        if (
            matchHour < targetHour ||
            (matchHour === targetHour && matchMin < targetMin)
        ) {
            return false;
        }
    }

    // Check day_of_week filter
    if (filters.day_of_week) {
        const matchEndTime = ctx.match.end_time
            ? new Date(ctx.match.end_time)
            : new Date();
        const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
        ];
        const matchDay = dayNames[matchEndTime.getDay()];

        if (matchDay !== filters.day_of_week.toLowerCase()) {
            return false;
        }
    }

    // For counter/threshold types with metrics
    if (condition.type === "counter" || condition.type === "threshold") {
        const metric = condition.metric;
        const target = condition.target || 0;

        switch (metric) {
            case "wins":
                return ctx.isWinner;
            case "losses":
                return ctx.isLoser;
            case "matches":
                return true;
            case "fatalities":
                return ctx.isWinner && ctx.scoreDiff >= 6;

            // New metrics
            case "fast_win":
                // Win in under target seconds
                return ctx.isWinner && ctx.durationSeconds < target;

            case "perfect_win":
                // Win 10:0
                return (
                    ctx.isWinner &&
                    ctx.opponentGoals === 0 &&
                    ctx.scoreDiff === 10
                );

            case "comeback":
                // Win after being down by at least target points
                return ctx.isWinner && ctx.maxDeficit >= target;

            case "mmr":
                // Reach MMR threshold (check new MMR after match)
                const newMmr =
                    ctx.ownMmr +
                    (ctx.isWinner
                        ? ctx.match.mmrChangeTeam1 || 0
                        : -(ctx.match.mmrChangeTeam1 || 0));
                // For simplicity, use the MMR stored in match (which is post-match)
                return ctx.ownMmr >= target;

            case "mmr_diff_win":
                // Beat opponent(s) with higher MMR by at least target difference
                const mmrDiff = ctx.opponentMmr - ctx.ownMmr;
                return ctx.isWinner && mmrDiff >= target;

            case "playtime_seconds":
                // This returns the match duration to be added to progress
                return true; // Always count, the increment will be duration

            case "carry_win":
                // Score ALL your team's goals in a 2on2 win (min 10 goals)
                return (
                    ctx.isWinner &&
                    ctx.gamemode === "2on2" &&
                    ctx.teamGoals > 0 &&
                    ctx.playerGoals === ctx.teamGoals
                );

            case "silent_win":
                // Win without scoring any goals (2on2 only)
                return ctx.isWinner && ctx.playerGoals === 0;

            case "own_goals_in_match":
                // Score at least target own goals in a single match
                return ctx.ownGoals >= target;

            case "goals_in_timeframe":
                // Check if player scored at least 'target' goals within 'timeframe_seconds'
                const timeframeSec = condition.timeframe_seconds || 60;
                const timeframeMs = timeframeSec * 1000;
                const timestamps = ctx.goalTimestamps;

                // Need at least 'target' goals
                if (timestamps.length < target) return false;

                // Check if any consecutive 'target' goals are within timeframe
                // Sort timestamps just in case
                timestamps.sort((a, b) => a - b);

                for (let i = 0; i <= timestamps.length - target; i++) {
                    const firstGoalTime = timestamps[i];
                    const lastGoalTime = timestamps[i + target - 1];
                    if (lastGoalTime - firstGoalTime <= timeframeMs) {
                        console.log(
                            `[goals_in_timeframe] Player ${ctx.playerId}: ${target} goals within ${timeframeSec}s detected!`
                        );
                        return true;
                    }
                }
                return false;

            case "perfect_wins":
                // Win with score 10-0 (counter version)
                // The final_score filter should already be applied, so just check win
                return ctx.isWinner;

            case "matches_before_time":
                // Play a match that ends before a certain time
                // The time_before filter should already be applied, so just return true
                return true;

            case "matches_after_time":
                // Play a match that ends after a certain time
                // The time_after filter should already be applied, so just return true
                return true;

            case "matches_in_time_window":
                // Play a match within a specific time window (day + time range)
                // The day_of_week, time_after, time_before filters should already be applied
                return true;

            case "matches_in_day": {
                // Count matches played today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                let matchQuery = supabase
                    .from("matches")
                    .select("id", { count: "exact", head: true })
                    .eq("kicker_id", match.kicker_id)
                    .eq("status", "ended")
                    .or(
                        `player1.eq.${ctx.playerId},player2.eq.${ctx.playerId},player3.eq.${ctx.playerId},player4.eq.${ctx.playerId}`
                    )
                    .gte("end_time", todayStart.toISOString());

                // Filter by season for season-specific achievements
                if (achievement.is_season_specific && match.season_id) {
                    matchQuery = matchQuery.eq("season_id", match.season_id);
                }

                // Apply gamemode filter if specified
                if (filters.gamemode) {
                    matchQuery = matchQuery.eq("gamemode", filters.gamemode);
                }

                const { count: matchesToday } = await matchQuery;
                console.log(
                    `[matches_in_day] Player ${
                        ctx.playerId
                    }: ${matchesToday} matches today (target: ${target}, gamemode: ${
                        filters.gamemode || "all"
                    })`
                );
                return (matchesToday || 0) >= target;
            }

            case "playtime_in_day": {
                // Sum playtime for matches today (in seconds)
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                let playtimeQuery = supabase
                    .from("matches")
                    .select("created_at, end_time")
                    .eq("kicker_id", match.kicker_id)
                    .eq("status", "ended")
                    .or(
                        `player1.eq.${ctx.playerId},player2.eq.${ctx.playerId},player3.eq.${ctx.playerId},player4.eq.${ctx.playerId}`
                    )
                    .gte("end_time", todayStart.toISOString());

                if (achievement.is_season_specific && match.season_id) {
                    playtimeQuery = playtimeQuery.eq(
                        "season_id",
                        match.season_id
                    );
                }

                const { data: matchesToday } = await playtimeQuery;
                let totalPlaytime = 0;
                for (const m of matchesToday || []) {
                    if (m.end_time && m.created_at) {
                        const duration =
                            new Date(m.end_time).getTime() -
                            new Date(m.created_at).getTime();
                        totalPlaytime += Math.floor(duration / 1000);
                    }
                }
                console.log(
                    `[playtime_in_day] Player ${ctx.playerId}: ${totalPlaytime}s today (target: ${target}s)`
                );
                return totalPlaytime >= target;
            }

            case "playtime_in_week": {
                // Sum playtime for matches this week (since Monday 00:00)
                const weekStart = new Date();
                const day = weekStart.getDay();
                const diff = day === 0 ? 6 : day - 1; // Monday is start of week
                weekStart.setDate(weekStart.getDate() - diff);
                weekStart.setHours(0, 0, 0, 0);

                let playtimeQuery = supabase
                    .from("matches")
                    .select("created_at, end_time")
                    .eq("kicker_id", match.kicker_id)
                    .eq("status", "ended")
                    .or(
                        `player1.eq.${ctx.playerId},player2.eq.${ctx.playerId},player3.eq.${ctx.playerId},player4.eq.${ctx.playerId}`
                    )
                    .gte("end_time", weekStart.toISOString());

                if (achievement.is_season_specific && match.season_id) {
                    playtimeQuery = playtimeQuery.eq(
                        "season_id",
                        match.season_id
                    );
                }

                const { data: matchesThisWeek } = await playtimeQuery;
                let totalPlaytime = 0;
                for (const m of matchesThisWeek || []) {
                    if (m.end_time && m.created_at) {
                        const duration =
                            new Date(m.end_time).getTime() -
                            new Date(m.created_at).getTime();
                        totalPlaytime += Math.floor(duration / 1000);
                    }
                }
                console.log(
                    `[playtime_in_week] Player ${ctx.playerId}: ${totalPlaytime}s this week (target: ${target}s)`
                );
                return totalPlaytime >= target;
            }

            case "wins_in_day": {
                // Count wins today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                let winsQuery = supabase
                    .from("matches")
                    .select(
                        "player1, player2, player3, player4, scoreTeam1, scoreTeam2"
                    )
                    .eq("kicker_id", match.kicker_id)
                    .eq("status", "ended")
                    .or(
                        `player1.eq.${ctx.playerId},player2.eq.${ctx.playerId},player3.eq.${ctx.playerId},player4.eq.${ctx.playerId}`
                    )
                    .gte("end_time", todayStart.toISOString());

                if (achievement.is_season_specific && match.season_id) {
                    winsQuery = winsQuery.eq("season_id", match.season_id);
                }

                if (filters.gamemode) {
                    winsQuery = winsQuery.eq("gamemode", filters.gamemode);
                }

                const { data: matchesToday } = await winsQuery;
                let winsToday = 0;
                for (const m of matchesToday || []) {
                    const isTeam1 =
                        m.player1 === ctx.playerId ||
                        m.player3 === ctx.playerId;
                    const won = isTeam1
                        ? m.scoreTeam1 > m.scoreTeam2
                        : m.scoreTeam2 > m.scoreTeam1;
                    if (won) winsToday++;
                }
                console.log(
                    `[wins_in_day] Player ${ctx.playerId}: ${winsToday} wins today (target: ${target})`
                );
                return winsToday >= target;
            }

            case "unique_opponents_defeated": {
                // Count unique opponents defeated in wins
                let opponentsQuery = supabase
                    .from("matches")
                    .select(
                        "player1, player2, player3, player4, scoreTeam1, scoreTeam2"
                    )
                    .eq("kicker_id", match.kicker_id)
                    .eq("status", "ended")
                    .or(
                        `player1.eq.${ctx.playerId},player2.eq.${ctx.playerId},player3.eq.${ctx.playerId},player4.eq.${ctx.playerId}`
                    );

                if (achievement.is_season_specific && match.season_id) {
                    opponentsQuery = opponentsQuery.eq(
                        "season_id",
                        match.season_id
                    );
                }

                if (filters.gamemode) {
                    opponentsQuery = opponentsQuery.eq(
                        "gamemode",
                        filters.gamemode
                    );
                }

                const { data: matches } = await opponentsQuery;
                const uniqueOpponents = new Set<number>();
                for (const m of matches || []) {
                    const isTeam1 =
                        m.player1 === ctx.playerId ||
                        m.player3 === ctx.playerId;
                    const won = isTeam1
                        ? m.scoreTeam1 > m.scoreTeam2
                        : m.scoreTeam2 > m.scoreTeam1;
                    if (won) {
                        // Add opponents to set
                        if (isTeam1) {
                            if (m.player2) uniqueOpponents.add(m.player2);
                            if (m.player4) uniqueOpponents.add(m.player4);
                        } else {
                            if (m.player1) uniqueOpponents.add(m.player1);
                            if (m.player3) uniqueOpponents.add(m.player3);
                        }
                    }
                }
                console.log(
                    `[unique_opponents_defeated] Player ${ctx.playerId}: ${uniqueOpponents.size} unique opponents (target: ${target})`
                );
                return uniqueOpponents.size >= target;
            }

            case "unique_teammates_won_with": {
                // Count unique teammates won with in 2on2 matches
                let teammatesQuery = supabase
                    .from("matches")
                    .select(
                        "player1, player2, player3, player4, scoreTeam1, scoreTeam2"
                    )
                    .eq("kicker_id", match.kicker_id)
                    .eq("status", "ended")
                    .eq("gamemode", "2on2")
                    .or(
                        `player1.eq.${ctx.playerId},player2.eq.${ctx.playerId},player3.eq.${ctx.playerId},player4.eq.${ctx.playerId}`
                    );

                if (achievement.is_season_specific && match.season_id) {
                    teammatesQuery = teammatesQuery.eq(
                        "season_id",
                        match.season_id
                    );
                }

                const { data: matches } = await teammatesQuery;
                const uniqueTeammates = new Set<number>();
                for (const m of matches || []) {
                    const isTeam1 =
                        m.player1 === ctx.playerId ||
                        m.player3 === ctx.playerId;
                    const won = isTeam1
                        ? m.scoreTeam1 > m.scoreTeam2
                        : m.scoreTeam2 > m.scoreTeam1;
                    if (won) {
                        // Add teammate to set
                        if (isTeam1) {
                            const teammate =
                                m.player1 === ctx.playerId
                                    ? m.player3
                                    : m.player1;
                            if (teammate) uniqueTeammates.add(teammate);
                        } else {
                            const teammate =
                                m.player2 === ctx.playerId
                                    ? m.player4
                                    : m.player2;
                            if (teammate) uniqueTeammates.add(teammate);
                        }
                    }
                }
                console.log(
                    `[unique_teammates_won_with] Player ${ctx.playerId}: ${uniqueTeammates.size} unique teammates (target: ${target})`
                );
                return uniqueTeammates.size >= target;
            }

            default:
                console.warn(
                    `[evaluateMatchCondition] Unknown metric: ${metric}`
                );
                return false;
        }
    }

    // For compound type - all sub-conditions must be met
    if (condition.type === "compound") {
        const subConditions = (condition as any).conditions || [];
        for (const subCond of subConditions) {
            // Create a sub-condition object with the compound's sub-condition data
            const subCondition: AchievementCondition = {
                type: "threshold",
                metric: subCond.metric,
                target: subCond.target,
                filters: subCond.filters || {},
            };
            const subMet = await evaluateMatchCondition(
                supabase,
                subCondition,
                ctx,
                match,
                achievement
            );
            if (!subMet) {
                console.log(
                    `[compound] Sub-condition ${subCond.metric} (target: ${subCond.target}) not met for player ${ctx.playerId}`
                );
                return false;
            }
        }
        console.log(
            `[compound] All sub-conditions met for player ${ctx.playerId}`
        );
        return true;
    }

    // For streak type
    if (condition.type === "streak") {
        const streakCond = condition.streak_condition;
        if (streakCond) {
            if (streakCond.result === "win" && !ctx.isWinner) return false;
            if (streakCond.result === "loss" && !ctx.isLoser) return false;
        }
        return true;
    }

    return true;
}

// Initialize chain achievement progress when parent is unlocked
// This carries over the parent's max_progress as the starting point for the child
async function initializeChainProgress(
    supabase: any,
    playerId: number,
    achievementId: number,
    initialProgress: number,
    seasonId: number | null = null
): Promise<void> {
    try {
        // Build query with proper season_id handling
        let query = supabase
            .from("player_achievement_progress")
            .select("current_progress")
            .eq("player_id", playerId)
            .eq("achievement_id", achievementId);

        if (seasonId === null) {
            query = query.is("season_id", null);
        } else {
            query = query.eq("season_id", seasonId);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            // Progress exists - only update if current is less than initial
            // This prevents overwriting if player already had progress somehow
            if (existing.current_progress < initialProgress) {
                let updateQuery = supabase
                    .from("player_achievement_progress")
                    .update({
                        current_progress: initialProgress,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievementId);

                if (seasonId === null) {
                    updateQuery = updateQuery.is("season_id", null);
                } else {
                    updateQuery = updateQuery.eq("season_id", seasonId);
                }

                await updateQuery;
            }
        } else {
            // Create new progress record with initial progress
            await supabase.from("player_achievement_progress").insert({
                player_id: playerId,
                achievement_id: achievementId,
                current_progress: initialProgress,
                season_id: seasonId,
                updated_at: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error("Error initializing chain progress:", error);
    }
}

function evaluateGoalCondition(
    condition: AchievementCondition,
    ctx: PlayerGoalContext
): boolean {
    const filters = condition.filters || {};

    // Check gamemode filter
    if (filters.gamemode && filters.gamemode !== ctx.gamemode) {
        return false;
    }

    // Check goal_type filter (standard, own_goal)
    if (filters.goal_type && filters.goal_type !== ctx.goalType) {
        return false;
    }

    // Check both_scores filter (for own_goal at specific score like 0-0)
    if (filters.both_scores !== undefined) {
        if (
            ctx.scoreTeam1BeforeGoal !== filters.both_scores ||
            ctx.scoreTeam2BeforeGoal !== filters.both_scores
        ) {
            return false;
        }
    }

    // For goals, the metric should be "goals"
    if (condition.type === "counter" || condition.type === "threshold") {
        const metric = condition.metric;
        const target = condition.target || 0;

        switch (metric) {
            case "goals":
                // Standard goal counting
                return ctx.goalType !== "own_goal";

            case "early_goal":
                // Goal within first X seconds of match
                return (
                    ctx.goalType !== "own_goal" &&
                    ctx.secondsSinceMatchStart <= target
                );

            case "first_blood_goals":
                // First goal of the match (score was 0-0 before this goal)
                // Must be a standard goal (not own goal)
                return (
                    ctx.goalType !== "own_goal" &&
                    ctx.scoreTeam1BeforeGoal === 0 &&
                    ctx.scoreTeam2BeforeGoal === 0
                );

            case "own_goal_at_score":
                // Own goal at a specific score
                // target is the player's team score before the own goal
                if (ctx.goalType !== "own_goal") return false;
                const playerTeamScoreBefore =
                    ctx.playerTeam === 1
                        ? ctx.scoreTeam1BeforeGoal
                        : ctx.scoreTeam2BeforeGoal;
                return playerTeamScoreBefore === target;

            case "own_goals_in_day":
                // This is tracked via counter - just check it's an own goal
                return ctx.goalType === "own_goal";

            case "goals_in_day":
                // This is handled by counting in DB - just check it's a regular goal
                return ctx.goalType !== "own_goal";

            case "goals_in_timeframe":
                // Check if player scored at least 'target' goals within 'timeframe_seconds'
                // This requires checking all goal timestamps in the current match
                if (!ctx.goalTimestamps || ctx.goalTimestamps.length < target) {
                    return false;
                }

                const timeframeSec = condition.timeframe_seconds || 60;
                const timeframeMs = timeframeSec * 1000;
                const timestamps = [...ctx.goalTimestamps].sort(
                    (a, b) => a - b
                );

                // Sliding window: check if any 'target' consecutive goals are within timeframe
                for (let i = 0; i <= timestamps.length - target; i++) {
                    const firstGoalTime = timestamps[i];
                    const lastGoalTime = timestamps[i + target - 1];
                    if (lastGoalTime - firstGoalTime <= timeframeMs) {
                        console.log(
                            `[goals_in_timeframe] Player ${ctx.playerId}: ${target} goals within ${timeframeSec}s detected!`
                        );
                        return true;
                    }
                }
                return false;

            default:
                return true;
        }
    }

    return true;
}

function evaluateSeasonCondition(
    condition: AchievementCondition,
    playerData: any
): boolean {
    // Season-based achievements check final stats
    if (condition.type === "threshold") {
        const metric = condition.metric;
        const target = condition.target || 0;

        switch (metric) {
            case "mmr":
                return playerData.mmr >= target;
            case "wins":
                return playerData.wins >= target;
            case "losses":
                // For "undefeated" achievement, target is 0
                return playerData.losses <= target;
            case "matches":
                return playerData.wins + playerData.losses >= target;
            case "season_rank":
                // Rank 1 means first place
                return playerData.rank === target;
            default:
                return true;
        }
    }

    return true;
}

// ============== PROGRESS UPDATE ==============

async function updateProgress(
    supabase: any,
    playerId: number,
    achievement: AchievementDefinition,
    seasonId: number | null,
    matchId: number | null,
    alreadyUnlocked: boolean
): Promise<string> {
    // Determine the season_id to use for progress tracking
    // Season-specific achievements use the match's season_id
    // Global achievements (is_season_specific = false) use null
    const progressSeasonId = achievement.is_season_specific ? seasonId : null;

    // Try to use atomic RPC function first (prevents race conditions)
    try {
        const { data: result, error } = await supabase.rpc(
            "increment_achievement_progress",
            {
                p_player_id: playerId,
                p_achievement_id: achievement.id,
                p_kicker_id: achievement.kicker_id,
                p_increment: 1,
                p_season_id: progressSeasonId,
            }
        );

        if (!error && result && result.length > 0) {
            const progressResult = result[0];
            console.log(
                `[RPC] Player ${playerId}, Achievement ${achievement.id}: Progress ${progressResult.new_progress}/${progressResult.max_progress}, Completed: ${progressResult.is_completed}`
            );

            if (progressResult.is_completed) {
                // Handle repeatable or update with match/season info
                if (alreadyUnlocked && achievement.is_repeatable) {
                    const { data: existingAchievement } = await supabase
                        .from("player_achievements")
                        .select("times_completed")
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id)
                        .single();

                    await supabase
                        .from("player_achievements")
                        .update({
                            times_completed:
                                (existingAchievement?.times_completed || 1) + 1,
                        })
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id);

                    // Reset progress for repeatable
                    await supabase
                        .from("player_achievement_progress")
                        .update({ current_progress: 0 })
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id);
                } else if (matchId || seasonId) {
                    await supabase
                        .from("player_achievements")
                        .update({ match_id: matchId, season_id: seasonId })
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id);
                }
                return "unlocked";
            }
            return "progress_updated";
        }

        // If RPC failed, log and fall through to fallback
        if (error) {
            console.warn(
                "RPC increment_achievement_progress failed, using fallback:",
                error.message
            );
        }
    } catch (rpcError) {
        console.warn("RPC exception, using fallback:", rpcError);
    }

    // Fallback: Use traditional upsert (less safe for concurrent updates)
    return await updateProgressFallback(
        supabase,
        playerId,
        achievement,
        seasonId,
        matchId,
        alreadyUnlocked
    );
}

// Set progress to an absolute value (for unique_opponents_defeated, unique_teammates_won_with)
async function setProgressAbsolute(
    supabase: any,
    playerId: number,
    achievement: AchievementDefinition,
    seasonId: number | null,
    matchId: number | null,
    alreadyUnlocked: boolean,
    absoluteValue: number
): Promise<string> {
    const progressSeasonId = achievement.is_season_specific ? seasonId : null;
    const now = new Date().toISOString();

    console.log(
        `[setProgressAbsolute] Player ${playerId}, Achievement ${achievement.id}: Setting progress to ${absoluteValue}/${achievement.max_progress}`
    );

    // Check if progress record exists (handle NULL season_id explicitly)
    let existingQuery = supabase
        .from("player_achievement_progress")
        .select("id, current_progress")
        .eq("player_id", playerId)
        .eq("achievement_id", achievement.id);

    if (progressSeasonId === null) {
        existingQuery = existingQuery.is("season_id", null);
    } else {
        existingQuery = existingQuery.eq("season_id", progressSeasonId);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
        // Update existing record
        let updateQuery = supabase
            .from("player_achievement_progress")
            .update({
                current_progress: absoluteValue,
                updated_at: now,
            })
            .eq("id", existing.id);

        const { error: updateError } = await updateQuery;
        if (updateError) {
            console.error("Error updating absolute progress:", updateError);
            return "error";
        }
    } else {
        // Insert new record
        const { error: insertError } = await supabase
            .from("player_achievement_progress")
            .insert({
                player_id: playerId,
                achievement_id: achievement.id,
                current_progress: absoluteValue,
                season_id: progressSeasonId,
                updated_at: now,
            });

        if (insertError) {
            console.error("Error inserting absolute progress:", insertError);
            return "error";
        }
    }

    // Check if completed
    if (absoluteValue >= achievement.max_progress && !alreadyUnlocked) {
        // Award achievement
        const { error: awardError } = await supabase
            .from("player_achievements")
            .insert({
                player_id: playerId,
                achievement_id: achievement.id,
                unlocked_at: now,
                season_id: seasonId,
                match_id: matchId,
            });

        if (awardError) {
            console.error("Error awarding achievement:", awardError);
            return "error";
        }

        console.log(
            `Achievement ${achievement.id} awarded to player ${playerId}!`
        );
        return "unlocked";
    }

    return "progress_updated";
}

// Calculate unique opponents defeated
async function calculateUniqueOpponentsDefeated(
    supabase: any,
    playerId: number,
    kickerId: number,
    seasonId: number | null,
    isSeasonSpecific: boolean,
    gamemode: string | null
): Promise<number> {
    let query = supabase
        .from("matches")
        .select("player1, player2, player3, player4, scoreTeam1, scoreTeam2")
        .eq("kicker_id", kickerId)
        .eq("status", "ended")
        .or(
            `player1.eq.${playerId},player2.eq.${playerId},player3.eq.${playerId},player4.eq.${playerId}`
        );

    if (isSeasonSpecific && seasonId) {
        query = query.eq("season_id", seasonId);
    }

    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    const { data: matches } = await query;
    const uniqueOpponents = new Set<number>();

    for (const m of matches || []) {
        const isTeam1 = m.player1 === playerId || m.player3 === playerId;
        const won = isTeam1
            ? m.scoreTeam1 > m.scoreTeam2
            : m.scoreTeam2 > m.scoreTeam1;
        if (won) {
            if (isTeam1) {
                if (m.player2) uniqueOpponents.add(m.player2);
                if (m.player4) uniqueOpponents.add(m.player4);
            } else {
                if (m.player1) uniqueOpponents.add(m.player1);
                if (m.player3) uniqueOpponents.add(m.player3);
            }
        }
    }

    console.log(
        `[calculateUniqueOpponentsDefeated] Player ${playerId}: ${uniqueOpponents.size} unique opponents`
    );
    return uniqueOpponents.size;
}

// Calculate unique teammates won with
async function calculateUniqueTeammatesWonWith(
    supabase: any,
    playerId: number,
    kickerId: number,
    seasonId: number | null,
    isSeasonSpecific: boolean
): Promise<number> {
    let query = supabase
        .from("matches")
        .select("player1, player2, player3, player4, scoreTeam1, scoreTeam2")
        .eq("kicker_id", kickerId)
        .eq("status", "ended")
        .eq("gamemode", "2on2")
        .or(
            `player1.eq.${playerId},player2.eq.${playerId},player3.eq.${playerId},player4.eq.${playerId}`
        );

    if (isSeasonSpecific && seasonId) {
        query = query.eq("season_id", seasonId);
    }

    const { data: matches } = await query;
    const uniqueTeammates = new Set<number>();

    for (const m of matches || []) {
        const isTeam1 = m.player1 === playerId || m.player3 === playerId;
        const won = isTeam1
            ? m.scoreTeam1 > m.scoreTeam2
            : m.scoreTeam2 > m.scoreTeam1;
        if (won) {
            if (isTeam1) {
                const teammate = m.player1 === playerId ? m.player3 : m.player1;
                if (teammate) uniqueTeammates.add(teammate);
            } else {
                const teammate = m.player2 === playerId ? m.player4 : m.player2;
                if (teammate) uniqueTeammates.add(teammate);
            }
        }
    }

    console.log(
        `[calculateUniqueTeammatesWonWith] Player ${playerId}: ${uniqueTeammates.size} unique teammates`
    );
    return uniqueTeammates.size;
}

// Update progress with custom increment amount (for playtime etc)
async function updateProgressWithAmount(
    supabase: any,
    playerId: number,
    achievement: AchievementDefinition,
    seasonId: number | null,
    matchId: number | null,
    alreadyUnlocked: boolean,
    incrementAmount: number
): Promise<string> {
    // Determine the season_id to use for progress tracking
    const progressSeasonId = achievement.is_season_specific ? seasonId : null;

    // Try to use atomic RPC function first
    try {
        const { data: result, error } = await supabase.rpc(
            "increment_achievement_progress",
            {
                p_player_id: playerId,
                p_achievement_id: achievement.id,
                p_kicker_id: achievement.kicker_id,
                p_increment: incrementAmount,
                p_season_id: progressSeasonId,
            }
        );

        if (!error && result && result.length > 0) {
            const progressResult = result[0];
            console.log(
                `[RPC] Player ${playerId}, Achievement ${achievement.id}: Progress ${progressResult.new_progress}/${progressResult.max_progress}, Completed: ${progressResult.is_completed}`
            );

            if (progressResult.is_completed) {
                // Handle repeatable or update with match/season info
                if (alreadyUnlocked && achievement.is_repeatable) {
                    const { data: existingAchievement } = await supabase
                        .from("player_achievements")
                        .select("times_completed")
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id)
                        .single();

                    await supabase
                        .from("player_achievements")
                        .update({
                            times_completed:
                                (existingAchievement?.times_completed || 1) + 1,
                        })
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id);

                    // Reset progress for repeatable
                    await supabase
                        .from("player_achievement_progress")
                        .update({ current_progress: 0 })
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id);
                } else if (matchId || seasonId) {
                    await supabase
                        .from("player_achievements")
                        .update({ match_id: matchId, season_id: seasonId })
                        .eq("player_id", playerId)
                        .eq("achievement_id", achievement.id);
                }
                return "unlocked";
            }
            return "progress_updated";
        }

        if (error) {
            console.warn("RPC failed, using fallback:", error.message);
        }
    } catch (rpcError) {
        console.warn("RPC exception, using fallback:", rpcError);
    }

    // Fallback
    return await updateProgressFallbackWithAmount(
        supabase,
        playerId,
        achievement,
        seasonId,
        matchId,
        alreadyUnlocked,
        incrementAmount
    );
}

async function updateProgressFallbackWithAmount(
    supabase: any,
    playerId: number,
    achievement: AchievementDefinition,
    seasonId: number | null,
    matchId: number | null,
    alreadyUnlocked: boolean,
    incrementAmount: number
): Promise<string> {
    try {
        // For season-specific achievements, track progress per season
        // For global achievements (is_season_specific = false), use season_id = null
        const progressSeasonId = achievement.is_season_specific
            ? seasonId
            : null;

        // Build query with season filter
        let query = supabase
            .from("player_achievement_progress")
            .select("current_progress")
            .eq("player_id", playerId)
            .eq("achievement_id", achievement.id);

        if (progressSeasonId === null) {
            query = query.is("season_id", null);
        } else {
            query = query.eq("season_id", progressSeasonId);
        }

        const { data: progressData } = await query.maybeSingle();

        const currentProgress = progressData?.current_progress || 0;
        const newProgress = Math.min(
            currentProgress + incrementAmount,
            achievement.max_progress
        );

        const now = new Date().toISOString();

        if (progressData) {
            // Update existing progress record
            let updateQuery = supabase
                .from("player_achievement_progress")
                .update({
                    current_progress: newProgress,
                    updated_at: now,
                })
                .eq("player_id", playerId)
                .eq("achievement_id", achievement.id);

            if (progressSeasonId === null) {
                updateQuery = updateQuery.is("season_id", null);
            } else {
                updateQuery = updateQuery.eq("season_id", progressSeasonId);
            }

            await updateQuery;
        } else {
            await supabase.from("player_achievement_progress").insert({
                player_id: playerId,
                achievement_id: achievement.id,
                current_progress: newProgress,
                season_id: progressSeasonId,
                updated_at: now,
            });
        }

        // Check if completed
        if (newProgress >= achievement.max_progress) {
            if (alreadyUnlocked && achievement.is_repeatable) {
                const { data: existingAchievement } = await supabase
                    .from("player_achievements")
                    .select("times_completed")
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id)
                    .single();

                await supabase
                    .from("player_achievements")
                    .update({
                        times_completed:
                            (existingAchievement?.times_completed || 1) + 1,
                    })
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id);

                // Reset progress for repeatable
                let resetQuery = supabase
                    .from("player_achievement_progress")
                    .update({ current_progress: 0 })
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id);

                if (progressSeasonId === null) {
                    resetQuery = resetQuery.is("season_id", null);
                } else {
                    resetQuery = resetQuery.eq("season_id", progressSeasonId);
                }

                await resetQuery;
            } else if (!alreadyUnlocked) {
                await supabase.from("player_achievements").insert({
                    player_id: playerId,
                    achievement_id: achievement.id,
                    unlocked_at: now,
                    season_id: seasonId,
                    match_id: matchId,
                });
            }
            return "unlocked";
        }

        return "progress_updated";
    } catch (err) {
        console.error("[Fallback] Unexpected error:", err);
        return "error";
    }
}

async function updateProgressFallback(
    supabase: any,
    playerId: number,
    achievement: AchievementDefinition,
    seasonId: number | null,
    matchId: number | null,
    alreadyUnlocked: boolean
): Promise<string> {
    try {
        // For season-specific achievements, track progress per season
        // For global achievements (is_season_specific = false), use season_id = null
        const progressSeasonId = achievement.is_season_specific
            ? seasonId
            : null;

        // Get current progress with season filter
        let query = supabase
            .from("player_achievement_progress")
            .select("current_progress")
            .eq("player_id", playerId)
            .eq("achievement_id", achievement.id);

        if (progressSeasonId === null) {
            query = query.is("season_id", null);
        } else {
            query = query.eq("season_id", progressSeasonId);
        }

        const { data: progressData, error: selectError } =
            await query.maybeSingle();

        if (selectError) {
            console.error("[Fallback] Error selecting progress:", selectError);
        }

        const currentProgress = progressData?.current_progress || 0;
        const newProgress = Math.min(
            currentProgress + 1,
            achievement.max_progress
        );

        console.log(
            `[Fallback] Player ${playerId}, Achievement ${achievement.id}: Progress ${currentProgress} -> ${newProgress}/${achievement.max_progress} (season: ${progressSeasonId})`
        );

        // Use INSERT or UPDATE based on whether record exists
        const now = new Date().toISOString();

        if (progressData) {
            // UPDATE existing record
            let updateQuery = supabase
                .from("player_achievement_progress")
                .update({
                    current_progress: newProgress,
                    updated_at: now,
                })
                .eq("player_id", playerId)
                .eq("achievement_id", achievement.id);

            if (progressSeasonId === null) {
                updateQuery = updateQuery.is("season_id", null);
            } else {
                updateQuery = updateQuery.eq("season_id", progressSeasonId);
            }

            const { error: updateError } = await updateQuery;

            if (updateError) {
                console.error(
                    "[Fallback] Error updating progress:",
                    updateError
                );
                return "error";
            }
        } else {
            // INSERT new record with season_id
            const { error: insertError } = await supabase
                .from("player_achievement_progress")
                .insert({
                    player_id: playerId,
                    achievement_id: achievement.id,
                    current_progress: newProgress,
                    season_id: progressSeasonId,
                    updated_at: now,
                });

            if (insertError) {
                console.error(
                    "[Fallback] Error inserting progress:",
                    insertError
                );
                return "error";
            }
        }

        console.log(
            `[Fallback] Successfully updated progress to ${newProgress}`
        );

        // Check if completed
        if (newProgress >= achievement.max_progress) {
            if (alreadyUnlocked && achievement.is_repeatable) {
                const { data: existingAchievement } = await supabase
                    .from("player_achievements")
                    .select("times_completed")
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id)
                    .single();

                await supabase
                    .from("player_achievements")
                    .update({
                        times_completed:
                            (existingAchievement?.times_completed || 1) + 1,
                    })
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id);

                // Reset progress for repeatable
                let resetQuery = supabase
                    .from("player_achievement_progress")
                    .update({ current_progress: 0 })
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id);

                if (progressSeasonId === null) {
                    resetQuery = resetQuery.is("season_id", null);
                } else {
                    resetQuery = resetQuery.eq("season_id", progressSeasonId);
                }

                await resetQuery;
            } else if (!alreadyUnlocked) {
                // Award achievement
                const { error: awardError } = await supabase
                    .from("player_achievements")
                    .insert({
                        player_id: playerId,
                        achievement_id: achievement.id,
                        unlocked_at: now,
                        season_id: seasonId,
                        match_id: matchId,
                    });

                if (awardError) {
                    console.error(
                        "[Fallback] Error awarding achievement:",
                        awardError
                    );
                } else {
                    console.log(
                        `[Fallback] Achievement ${achievement.id} awarded to player ${playerId}!`
                    );
                }
            }
            return "unlocked";
        }

        return "progress_updated";
    } catch (err) {
        console.error("[Fallback] Unexpected error:", err);
        return "error";
    }
}
