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
    points: number;
}

interface AchievementCondition {
    type: "counter" | "threshold" | "streak" | "compound";
    metric?: string;
    target?: number;
    timeframe_seconds?: number; // For goals_in_timeframe
    deficit_min?: number; // For team_streak_from_deficit (Momentum Shift)
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
        opponent_score?: number; // For own_goal_at_score with specific opponent score
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
    // New comeback tracking fields
    perfectComebackDeficit: number; // Largest deficit from which team won without conceding after
    isReverseSweep: boolean; // Exact 0:5 -> 10:5 win pattern
    maxTeamStreakWhileBehind: number; // Longest team goal streak while behind 3-5 goals
    deficitAtStreakStart: number; // Deficit when the max streak started
    comebackGoalsSelf: number; // Goals scored by this player after max deficit was reached
    comebackGoalsTotal: number; // Total team goals after max deficit was reached
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
    scoreTeam1BeforeGoal: number; // Score before this goal was scored (primary calculation)
    scoreTeam2BeforeGoal: number;
    playerTeam: 1 | 2; // Which team the player is on
    // For own goals when own team is at 0, there are two possible "before" states:
    // Case 1: Own team was at 1, opponent unchanged
    // Case 2: Own team was at 0, opponent had 1 less
    ownGoalAmbiguous?: boolean; // True when own team score after = 0 (can't distinguish case 1 vs 2)
    altScoreTeam1BeforeGoal?: number; // Alternative score (for Case 2)
    altScoreTeam2BeforeGoal?: number;
    // For team_streak_from_deficit (Momentum Shift achievement)
    currentTeamStreakWhileBehind?: number; // Current team goal streak while behind
    deficitAtCurrentStreakStart?: number; // Deficit when the current streak started
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

    // Get all MATCH_ENDED achievements (global - no kicker_id filter)
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
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

    // New comeback tracking variables
    let maxDeficitTeam1GoalIndex = -1; // Goal index where team1 reached max deficit
    let maxDeficitTeam2GoalIndex = -1; // Goal index where team2 reached max deficit
    let team1StreakWhileBehind = 0; // Current goal streak for team1 while behind
    let team2StreakWhileBehind = 0; // Current goal streak for team2 while behind
    let maxTeam1StreakWhileBehind = 0; // Max streak for team1 while behind 3-5
    let maxTeam2StreakWhileBehind = 0; // Max streak for team2 while behind 3-5
    let deficitAtTeam1StreakStart = 0; // Deficit when team1's max streak started
    let deficitAtTeam2StreakStart = 0; // Deficit when team2's max streak started
    let currentDeficitAtTeam1StreakStart = 0; // Deficit at start of current team1 streak
    let currentDeficitAtTeam2StreakStart = 0; // Deficit at start of current team2 streak
    // Track goals per player after max deficit for "On My Back" achievement
    const comebackGoalsPerPlayer: {
        [playerId: number]: { team1: number; team2: number };
    } = {};
    // Track if opponent scored after max deficit (for perfect comeback)
    let opponentScoredAfterMaxDeficitTeam1 = false;
    let opponentScoredAfterMaxDeficitTeam2 = false;
    // Score history for reverse sweep detection - track score AFTER each goal
    const scoreHistory: { team1: number; team2: number }[] = [];

    let goalIndex = 0;
    let prevScoreTeam1 = 0;
    let prevScoreTeam2 = 0;

    for (const goal of matchGoals || []) {
        // Skip generated_goal - these are auto-generated and shouldn't count for achievements
        if (goal.goal_type === "generated_goal") {
            continue;
        }

        // Calculate deficit BEFORE this goal was scored
        const deficitTeam1Before = prevScoreTeam2 - prevScoreTeam1;
        const deficitTeam2Before = prevScoreTeam1 - prevScoreTeam2;

        // Track score history for pattern matching (score AFTER goal)
        scoreHistory.push({ team1: goal.scoreTeam1, team2: goal.scoreTeam2 });

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

        // Track max deficit for comeback achievements (using score AFTER goal)
        const deficitTeam1After = goal.scoreTeam2 - goal.scoreTeam1;
        const deficitTeam2After = goal.scoreTeam1 - goal.scoreTeam2;

        // Update max deficit when opponent scores (deficit increases)
        if (deficitTeam1After > maxDeficitTeam1) {
            maxDeficitTeam1 = deficitTeam1After;
            maxDeficitTeam1GoalIndex = goalIndex;
            opponentScoredAfterMaxDeficitTeam1 = false; // Reset - new max deficit reached
        }
        if (deficitTeam2After > maxDeficitTeam2) {
            maxDeficitTeam2 = deficitTeam2After;
            maxDeficitTeam2GoalIndex = goalIndex;
            opponentScoredAfterMaxDeficitTeam2 = false; // Reset - new max deficit reached
        }

        // Track if opponent scores after max deficit was reached
        // For Team1: opponent is Team2, so check if goal.team === 2 and it's not an own goal by Team1
        if (
            maxDeficitTeam1GoalIndex >= 0 &&
            goalIndex > maxDeficitTeam1GoalIndex
        ) {
            // Team2 scores a regular goal OR Team1 scores an own goal
            if (
                (goal.team === 2 && goal.goal_type !== "own_goal") ||
                (goal.team === 1 && goal.goal_type === "own_goal")
            ) {
                opponentScoredAfterMaxDeficitTeam1 = true;
            }
        }
        if (
            maxDeficitTeam2GoalIndex >= 0 &&
            goalIndex > maxDeficitTeam2GoalIndex
        ) {
            if (
                (goal.team === 1 && goal.goal_type !== "own_goal") ||
                (goal.team === 2 && goal.goal_type === "own_goal")
            ) {
                opponentScoredAfterMaxDeficitTeam2 = true;
            }
        }

        // Track goals per player after max deficit for comeback calculations
        if (!comebackGoalsPerPlayer[goal.player_id]) {
            comebackGoalsPerPlayer[goal.player_id] = { team1: 0, team2: 0 };
        }
        // Only count standard goals (not own goals) for comeback tracking
        if (goal.goal_type !== "own_goal") {
            if (
                maxDeficitTeam1GoalIndex >= 0 &&
                goalIndex > maxDeficitTeam1GoalIndex &&
                goal.team === 1
            ) {
                comebackGoalsPerPlayer[goal.player_id].team1++;
            }
            if (
                maxDeficitTeam2GoalIndex >= 0 &&
                goalIndex > maxDeficitTeam2GoalIndex &&
                goal.team === 2
            ) {
                comebackGoalsPerPlayer[goal.player_id].team2++;
            }
        }

        // Track team goal streaks while behind at least 3 goals (for Momentum Shift)
        // Use deficit BEFORE the goal to check if team was behind when starting the streak
        // Once a streak starts (deficit >= 3), it continues until opponent scores
        // Team 1 streak tracking
        if (goal.team === 1 && goal.goal_type !== "own_goal") {
            // Team 1 scores a regular goal
            if (team1StreakWhileBehind === 0 && deficitTeam1Before >= 3) {
                // Start a new streak only if we're behind by 3+
                currentDeficitAtTeam1StreakStart = deficitTeam1Before;
                team1StreakWhileBehind = 1;
            } else if (team1StreakWhileBehind > 0) {
                // Continue existing streak (regardless of current deficit)
                team1StreakWhileBehind++;
            }
            // Update max if current is higher
            if (team1StreakWhileBehind > maxTeam1StreakWhileBehind) {
                maxTeam1StreakWhileBehind = team1StreakWhileBehind;
                deficitAtTeam1StreakStart = currentDeficitAtTeam1StreakStart;
            }
        } else if (
            (goal.team === 2 && goal.goal_type !== "own_goal") ||
            (goal.team === 1 && goal.goal_type === "own_goal")
        ) {
            // Opponent scores (either Team2 regular goal or Team1 own goal)
            team1StreakWhileBehind = 0; // Reset streak
        }

        // Team 2 streak tracking
        if (goal.team === 2 && goal.goal_type !== "own_goal") {
            // Team 2 scores a regular goal
            if (team2StreakWhileBehind === 0 && deficitTeam2Before >= 3) {
                // Start a new streak only if we're behind by 3+
                currentDeficitAtTeam2StreakStart = deficitTeam2Before;
                team2StreakWhileBehind = 1;
            } else if (team2StreakWhileBehind > 0) {
                // Continue existing streak (regardless of current deficit)
                team2StreakWhileBehind++;
            }
            // Update max if current is higher
            if (team2StreakWhileBehind > maxTeam2StreakWhileBehind) {
                maxTeam2StreakWhileBehind = team2StreakWhileBehind;
                deficitAtTeam2StreakStart = currentDeficitAtTeam2StreakStart;
            }
        } else if (
            (goal.team === 1 && goal.goal_type !== "own_goal") ||
            (goal.team === 2 && goal.goal_type === "own_goal")
        ) {
            // Opponent scores (either Team1 regular goal or Team2 own goal)
            team2StreakWhileBehind = 0; // Reset streak
        }

        // Update previous scores for next iteration
        prevScoreTeam1 = goal.scoreTeam1;
        prevScoreTeam2 = goal.scoreTeam2;
        goalIndex++;
    }

    // Calculate reverse sweep pattern (exact 0:5 -> 10:5)
    // Check if at any point the score was 0:5 (for team1) or 5:0 (for team2)
    const isReverseSweepTeam1 =
        team1Won &&
        match.scoreTeam1 === 10 &&
        match.scoreTeam2 === 5 &&
        scoreHistory.some((s) => s.team1 === 0 && s.team2 === 5);
    const isReverseSweepTeam2 =
        !team1Won &&
        match.scoreTeam2 === 10 &&
        match.scoreTeam1 === 5 &&
        scoreHistory.some((s) => s.team2 === 0 && s.team1 === 5);

    // Calculate perfect comeback deficit (won after deficit without conceding)
    const perfectComebackDeficitTeam1 =
        team1Won && !opponentScoredAfterMaxDeficitTeam1 && maxDeficitTeam1 >= 5
            ? maxDeficitTeam1
            : 0;
    const perfectComebackDeficitTeam2 =
        !team1Won && !opponentScoredAfterMaxDeficitTeam2 && maxDeficitTeam2 >= 5
            ? maxDeficitTeam2
            : 0;

    // Calculate total comeback goals per team (for "On My Back" calculation)
    const comebackGoalsTotalTeam1 = Object.values(
        comebackGoalsPerPlayer
    ).reduce((sum, p) => sum + p.team1, 0);
    const comebackGoalsTotalTeam2 = Object.values(
        comebackGoalsPerPlayer
    ).reduce((sum, p) => sum + p.team2, 0);

    // Build context for each player
    const playerContexts: PlayerMatchContext[] = buildPlayerMatchContexts(
        match,
        team1Won,
        scoreDiff,
        durationSeconds,
        goalStats,
        maxDeficitTeam1,
        maxDeficitTeam2,
        // New comeback tracking data
        {
            perfectComebackDeficitTeam1,
            perfectComebackDeficitTeam2,
            isReverseSweepTeam1,
            isReverseSweepTeam2,
            maxTeam1StreakWhileBehind,
            maxTeam2StreakWhileBehind,
            deficitAtTeam1StreakStart,
            deficitAtTeam2StreakStart,
            comebackGoalsPerPlayer,
            comebackGoalsTotalTeam1,
            comebackGoalsTotalTeam2,
        }
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

    // ============== UPDATE PLAYER STATUS & BOUNTIES ==============
    const statusResults = await updatePlayerStatusesAfterMatch(
        supabase,
        match,
        playerContexts
    );
    console.log("Player status update results:", statusResults);

    // ============== PROCESS BOUNTY & STREAK ACHIEVEMENTS ==============
    const bountyAchievementResults = await processBountyAchievements(
        supabase,
        match,
        statusResults
    );
    console.log("Bounty achievement results:", bountyAchievementResults);

    return jsonResponse({
        success: true,
        event: "MATCH_ENDED",
        matchId: match.id,
        results,
        statusResults,
        bountyAchievementResults,
    });
}

// ============== GOAL SCORED HANDLER ==============

async function handleGoalScored(
    supabase: any,
    payload: WebhookPayload & { record: GoalRecord }
): Promise<Response> {
    const goal = payload.record;

    // Skip generated_goal - these are auto-generated and shouldn't trigger achievements
    if (goal.goal_type === "generated_goal") {
        return jsonResponse({ message: "Generated goal, skipping" });
    }

    // Own goal system:
    // - If own team > 0: own team loses 1 point (amount = -1)
    // - If own team = 0: opponent team gains 1 point (amount = +1)
    // Both cases are valid own goals and should be processed!
    if (goal.goal_type === "own_goal") {
        // Own goals can have amount = -1 (team loses point) OR amount = +1 (opponent gains point)
        // Only skip if amount = 0 (removal/undo operation)
        if (goal.amount === 0) {
            return jsonResponse({ message: "Own goal removal/undo, skipping" });
        }
    } else {
        // Standard goals should have positive amounts
        if (goal.amount <= 0) {
            return jsonResponse({ message: "Goal removal/undo, skipping" });
        }
    }

    console.log(
        `Processing GOAL_SCORED achievements for goal ${goal.id}, player ${goal.player_id}, type: ${goal.goal_type}, amount: ${goal.amount}`
    );

    // Get the match to find the season_id, start time, and player teams
    const { data: match } = await supabase
        .from("matches")
        .select("season_id, created_at, player1, player2, player3, player4")
        .eq("id", goal.match_id)
        .single();

    const seasonId = match?.season_id || null;

    // Get all GOAL_SCORED achievements (global - no kicker_id filter)
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
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
    let ownGoalAmbiguous = false;
    let altScoreTeam1BeforeGoal: number | undefined;
    let altScoreTeam2BeforeGoal: number | undefined;

    // Adjust based on goal type and which team scored
    if (goal.goal_type === "own_goal") {
        // Own goal system:
        // - If own team > 0: own team loses 1 point (Case 1, amount = -1)
        // - If own team = 0: opponent team gains 1 point (Case 2, amount = +1)
        //
        // We can use the amount to determine which case:
        // amount = -1 means own team lost a point (Case 1)
        // amount = +1 means opponent gained a point (Case 2)

        if (goal.amount < 0) {
            // Case 1: Own team lost a point (amount = -1)
            // Before: own team had current + 1
            if (playerTeam === 1) {
                scoreTeam1BeforeGoal = goal.scoreTeam1 + 1;
                // scoreTeam2 unchanged
            } else {
                scoreTeam2BeforeGoal = goal.scoreTeam2 + 1;
                // scoreTeam1 unchanged
            }
        } else if (goal.amount > 0) {
            // Case 2: Opponent gained a point (amount = +1)
            // Before: opponent had current - 1, own team unchanged at 0
            if (playerTeam === 1) {
                scoreTeam1BeforeGoal = 0; // Own team was at 0
                scoreTeam2BeforeGoal = goal.scoreTeam2 - 1; // Opponent had 1 less
            } else {
                scoreTeam2BeforeGoal = 0; // Own team was at 0
                scoreTeam1BeforeGoal = goal.scoreTeam1 - 1; // Opponent had 1 less
            }
        }
        // amount = 0 is already filtered out above
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

    // Calculate team streak while behind for Momentum Shift achievement
    // Get ALL goals in this match to calculate the streak
    const { data: allMatchGoals } = await supabase
        .from("goals")
        .select(
            "player_id, goal_type, team, scoreTeam1, scoreTeam2, created_at"
        )
        .eq("match_id", goal.match_id)
        .order("created_at", { ascending: true });

    let currentTeamStreakWhileBehind = 0;
    let deficitAtCurrentStreakStart = 0;

    if (allMatchGoals && allMatchGoals.length > 0) {
        let teamStreak = 0;
        let deficitAtStreakStart = 0;
        let currentDeficitAtStreakStart = 0;
        let prevScoreTeam1 = 0;
        let prevScoreTeam2 = 0;

        for (const g of allMatchGoals) {
            // Skip generated goals
            if (g.goal_type === "generated_goal") continue;

            // Calculate deficit BEFORE this goal was scored
            const deficitPlayerTeamBefore =
                playerTeam === 1
                    ? prevScoreTeam2 - prevScoreTeam1
                    : prevScoreTeam1 - prevScoreTeam2;

            // Check if player's team scored (standard goal for player's team or own goal from opponent)
            const playerTeamScored =
                (g.team === playerTeam && g.goal_type !== "own_goal") ||
                (g.team !== playerTeam && g.goal_type === "own_goal");

            // Check if opponent scored
            const opponentScored =
                (g.team !== playerTeam && g.goal_type !== "own_goal") ||
                (g.team === playerTeam && g.goal_type === "own_goal");

            if (playerTeamScored) {
                if (teamStreak === 0 && deficitPlayerTeamBefore >= 3) {
                    // Start a new streak only if we're behind by 3+
                    currentDeficitAtStreakStart = deficitPlayerTeamBefore;
                    teamStreak = 1;
                } else if (teamStreak > 0) {
                    // Continue existing streak
                    teamStreak++;
                }
                // Update max if current is higher
                if (teamStreak > currentTeamStreakWhileBehind) {
                    currentTeamStreakWhileBehind = teamStreak;
                    deficitAtCurrentStreakStart = currentDeficitAtStreakStart;
                }
            } else if (opponentScored) {
                // Opponent scores - reset streak
                teamStreak = 0;
            }

            // Update previous scores
            prevScoreTeam1 = g.scoreTeam1;
            prevScoreTeam2 = g.scoreTeam2;
        }

        console.log(
            `[team_streak_from_deficit] Player ${goal.player_id} team ${playerTeam}: ` +
                `currentTeamStreakWhileBehind=${currentTeamStreakWhileBehind}, ` +
                `deficitAtCurrentStreakStart=${deficitAtCurrentStreakStart}`
        );
    }

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
        ownGoalAmbiguous,
        altScoreTeam1BeforeGoal,
        altScoreTeam2BeforeGoal,
        currentTeamStreakWhileBehind,
        deficitAtCurrentStreakStart,
    };

    // DEBUG: Log goal context for own goals
    if (goal.goal_type === "own_goal") {
        console.log(
            `[DEBUG own_goal] Goal context:`,
            JSON.stringify({
                playerId: goalCtx.playerId,
                goalType: goalCtx.goalType,
                gamemode: goalCtx.gamemode,
                playerTeam: goalCtx.playerTeam,
                scoreTeam1BeforeGoal: goalCtx.scoreTeam1BeforeGoal,
                scoreTeam2BeforeGoal: goalCtx.scoreTeam2BeforeGoal,
                ownGoalAmbiguous: goalCtx.ownGoalAmbiguous,
                altScoreTeam1BeforeGoal: goalCtx.altScoreTeam1BeforeGoal,
                altScoreTeam2BeforeGoal: goalCtx.altScoreTeam2BeforeGoal,
                goalScoreTeam1: goal.scoreTeam1,
                goalScoreTeam2: goal.scoreTeam2,
                goalAmount: goal.amount,
            })
        );
    }

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

        // DEBUG: Log own_goal achievements being evaluated
        if (
            goal.goal_type === "own_goal" &&
            achievement.condition.metric?.includes("own_goal")
        ) {
            console.log(
                `[DEBUG own_goal] Evaluating achievement: ${achievement.key}`,
                JSON.stringify({
                    metric: achievement.condition.metric,
                    target: achievement.condition.target,
                    filters: achievement.condition.filters,
                })
            );
        }

        // Evaluate goal condition
        const conditionMet = evaluateGoalCondition(
            achievement.condition,
            goalCtx
        );

        // DEBUG: Log result for own_goal achievements
        if (
            goal.goal_type === "own_goal" &&
            achievement.condition.metric?.includes("own_goal")
        ) {
            console.log(
                `[DEBUG own_goal] ${achievement.key} conditionMet: ${conditionMet}`
            );
        }

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

    // Get all SEASON_ENDED achievements (global - no kicker_id filter)
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
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

    // First, get the achievement that was just unlocked to check if it's hidden
    const { data: unlockedAchievement, error: unlockedError } = await supabase
        .from("achievement_definitions")
        .select("is_hidden")
        .eq("id", unlockedAchievementId)
        .single();

    if (unlockedError || !unlockedAchievement) {
        console.error("Error fetching unlocked achievement:", unlockedError);
        return jsonResponse({ message: "Could not find unlocked achievement" });
    }

    const unlockedIsHidden = unlockedAchievement.is_hidden;

    // Get all ACHIEVEMENT_UNLOCKED achievements (global - no kicker_id filter)
    const { data: achievements, error: achievementsError } = await supabase
        .from("achievement_definitions")
        .select("*")
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

    // Get total achievement count for "all_achievements" metric (global - no kicker_id filter)
    const { count: totalAchievements, error: totalError } = await supabase
        .from("achievement_definitions")
        .select("*", { count: "exact", head: true })
        .neq("trigger_event", "ACHIEVEMENT_UNLOCKED"); // Don't count meta-achievements

    if (totalError) {
        console.error("Error counting total achievements:", totalError);
        throw totalError;
    }

    console.log(`Total achievements: ${totalAchievements}`);

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

// Type for comeback tracking data passed to buildPlayerMatchContexts
interface ComebackTrackingData {
    perfectComebackDeficitTeam1: number;
    perfectComebackDeficitTeam2: number;
    isReverseSweepTeam1: boolean;
    isReverseSweepTeam2: boolean;
    maxTeam1StreakWhileBehind: number;
    maxTeam2StreakWhileBehind: number;
    deficitAtTeam1StreakStart: number;
    deficitAtTeam2StreakStart: number;
    comebackGoalsPerPlayer: {
        [playerId: number]: { team1: number; team2: number };
    };
    comebackGoalsTotalTeam1: number;
    comebackGoalsTotalTeam2: number;
}

function buildPlayerMatchContexts(
    match: MatchRecord,
    team1Won: boolean,
    scoreDiff: number,
    durationSeconds: number,
    goalStats: MatchGoalStats,
    maxDeficitTeam1: number,
    maxDeficitTeam2: number,
    comebackData: ComebackTrackingData
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
        // New comeback fields
        perfectComebackDeficit: comebackData.perfectComebackDeficitTeam1,
        isReverseSweep: comebackData.isReverseSweepTeam1,
        maxTeamStreakWhileBehind: comebackData.maxTeam1StreakWhileBehind,
        deficitAtStreakStart: comebackData.deficitAtTeam1StreakStart,
        comebackGoalsSelf:
            comebackData.comebackGoalsPerPlayer[match.player1]?.team1 || 0,
        comebackGoalsTotal: comebackData.comebackGoalsTotalTeam1,
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
        // New comeback fields
        perfectComebackDeficit: comebackData.perfectComebackDeficitTeam2,
        isReverseSweep: comebackData.isReverseSweepTeam2,
        maxTeamStreakWhileBehind: comebackData.maxTeam2StreakWhileBehind,
        deficitAtStreakStart: comebackData.deficitAtTeam2StreakStart,
        comebackGoalsSelf:
            comebackData.comebackGoalsPerPlayer[match.player2]?.team2 || 0,
        comebackGoalsTotal: comebackData.comebackGoalsTotalTeam2,
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
            // New comeback fields
            perfectComebackDeficit: comebackData.perfectComebackDeficitTeam1,
            isReverseSweep: comebackData.isReverseSweepTeam1,
            maxTeamStreakWhileBehind: comebackData.maxTeam1StreakWhileBehind,
            deficitAtStreakStart: comebackData.deficitAtTeam1StreakStart,
            comebackGoalsSelf:
                comebackData.comebackGoalsPerPlayer[match.player3]?.team1 || 0,
            comebackGoalsTotal: comebackData.comebackGoalsTotalTeam1,
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
            // New comeback fields
            perfectComebackDeficit: comebackData.perfectComebackDeficitTeam2,
            isReverseSweep: comebackData.isReverseSweepTeam2,
            maxTeamStreakWhileBehind: comebackData.maxTeam2StreakWhileBehind,
            deficitAtStreakStart: comebackData.deficitAtTeam2StreakStart,
            comebackGoalsSelf:
                comebackData.comebackGoalsPerPlayer[match.player4]?.team2 || 0,
            comebackGoalsTotal: comebackData.comebackGoalsTotalTeam2,
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

            case "perfect_comeback":
                // Win after being down by at least target points without opponent scoring after max deficit
                console.log(
                    `[perfect_comeback] Player ${ctx.playerId}: isWinner=${ctx.isWinner}, perfectComebackDeficit=${ctx.perfectComebackDeficit}, target=${target}`
                );
                return ctx.isWinner && ctx.perfectComebackDeficit >= target;

            case "reverse_sweep":
                // Exact 0:5 -> 10:5 win pattern
                console.log(
                    `[reverse_sweep] Player ${ctx.playerId}: isWinner=${ctx.isWinner}, isReverseSweep=${ctx.isReverseSweep}`
                );
                return ctx.isWinner && ctx.isReverseSweep;

            case "team_streak_from_deficit":
                // Score at least target goals in a row after being behind by deficit_min goals
                const deficitMin = condition.deficit_min || 3;
                console.log(
                    `[team_streak_from_deficit] Player ${ctx.playerId}: maxTeamStreakWhileBehind=${ctx.maxTeamStreakWhileBehind}, deficitAtStreakStart=${ctx.deficitAtStreakStart}, target=${target}, deficitMin=${deficitMin}`
                );
                return (
                    ctx.maxTeamStreakWhileBehind >= target &&
                    ctx.deficitAtStreakStart >= deficitMin
                );

            case "solo_comeback":
                // Score ALL comeback goals yourself after being down by at least target points (2on2 only)
                console.log(
                    `[solo_comeback] Player ${ctx.playerId}: isWinner=${ctx.isWinner}, maxDeficit=${ctx.maxDeficit}, comebackGoalsSelf=${ctx.comebackGoalsSelf}, comebackGoalsTotal=${ctx.comebackGoalsTotal}, gamemode=${ctx.gamemode}`
                );
                return (
                    ctx.isWinner &&
                    ctx.gamemode === "2on2" &&
                    ctx.maxDeficit >= target &&
                    ctx.comebackGoalsTotal > 0 &&
                    ctx.comebackGoalsSelf === ctx.comebackGoalsTotal
                );

            case "mmr":
                // Reach MMR threshold (check new MMR after match)
                const newMmr =
                    ctx.ownMmr +
                    (ctx.isWinner
                        ? ctx.match.mmrChangeTeam1 || 0
                        : -(ctx.match.mmrChangeTeam1 || 0));
                // For simplicity, use the MMR stored in match (which is post-match)
                return ctx.ownMmr >= target;

            case "mmr_below":
                // Drop below MMR threshold (check MMR after match, which is stored in match)
                // This is for the "Rock Bottom" achievement
                console.log(
                    `[mmr_below] Player ${ctx.playerId}: ownMmr=${ctx.ownMmr}, target=${target}`
                );
                return ctx.ownMmr < target;

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
                console.log(
                    `[own_goals_in_match] Player ${ctx.playerId}: ownGoals=${ctx.ownGoals}, target=${target}`
                );
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
        if (condition.metric?.includes("own_goal")) {
            console.log(
                `[DEBUG filter] Gamemode mismatch: filter=${filters.gamemode}, ctx=${ctx.gamemode}`
            );
        }
        return false;
    }

    // Check goal_type filter (standard, own_goal)
    if (filters.goal_type && filters.goal_type !== ctx.goalType) {
        if (condition.metric?.includes("own_goal")) {
            console.log(
                `[DEBUG filter] Goal_type mismatch: filter=${filters.goal_type}, ctx=${ctx.goalType}`
            );
        }
        return false;
    }

    // Check both_scores filter (for own_goal at specific score like 0-0)
    if (filters.both_scores !== undefined) {
        const primaryMatch =
            ctx.scoreTeam1BeforeGoal === filters.both_scores &&
            ctx.scoreTeam2BeforeGoal === filters.both_scores;

        // Also check alternative scores if ambiguous
        let altMatch = false;
        if (
            ctx.ownGoalAmbiguous &&
            ctx.altScoreTeam1BeforeGoal !== undefined &&
            ctx.altScoreTeam2BeforeGoal !== undefined
        ) {
            altMatch =
                ctx.altScoreTeam1BeforeGoal === filters.both_scores &&
                ctx.altScoreTeam2BeforeGoal === filters.both_scores;
        }

        if (!primaryMatch && !altMatch) {
            if (condition.metric?.includes("own_goal")) {
                console.log(
                    `[DEBUG filter] Both_scores mismatch: filter=${filters.both_scores}, ` +
                        `primary: team1=${ctx.scoreTeam1BeforeGoal}, team2=${ctx.scoreTeam2BeforeGoal}, ` +
                        `alt: team1=${ctx.altScoreTeam1BeforeGoal}, team2=${ctx.altScoreTeam2BeforeGoal}`
                );
            }
            return false;
        }
    }

    // Check opponent_score filter (for own_goal when opponent is at specific score)
    if (filters.opponent_score !== undefined) {
        const opponentScoreBefore =
            ctx.playerTeam === 1
                ? ctx.scoreTeam2BeforeGoal
                : ctx.scoreTeam1BeforeGoal;

        // Also check alternative scores if ambiguous
        let primaryMatch = opponentScoreBefore === filters.opponent_score;
        let altMatch = false;
        if (
            ctx.ownGoalAmbiguous &&
            ctx.altScoreTeam1BeforeGoal !== undefined &&
            ctx.altScoreTeam2BeforeGoal !== undefined
        ) {
            const altOpponentScoreBefore =
                ctx.playerTeam === 1
                    ? ctx.altScoreTeam2BeforeGoal
                    : ctx.altScoreTeam1BeforeGoal;
            altMatch = altOpponentScoreBefore === filters.opponent_score;
        }

        if (!primaryMatch && !altMatch) {
            if (condition.metric?.includes("own_goal")) {
                console.log(
                    `[DEBUG filter] Opponent_score mismatch: filter=${filters.opponent_score}, ` +
                        `primary: opponent=${opponentScoreBefore}, ambiguous=${ctx.ownGoalAmbiguous}`
                );
            }
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

                // Check primary calculation
                let primaryMatch = playerTeamScoreBefore === target;

                // If ambiguous (own team at 0 after goal), also check alternative calculation
                let altMatch = false;
                if (
                    ctx.ownGoalAmbiguous &&
                    ctx.altScoreTeam1BeforeGoal !== undefined
                ) {
                    const altPlayerTeamScoreBefore =
                        ctx.playerTeam === 1
                            ? ctx.altScoreTeam1BeforeGoal
                            : ctx.altScoreTeam2BeforeGoal;
                    altMatch = altPlayerTeamScoreBefore === target;
                }

                console.log(
                    `[own_goal_at_score] Player ${ctx.playerId} team ${ctx.playerTeam}: ` +
                        `scoreTeam1Before=${ctx.scoreTeam1BeforeGoal}, scoreTeam2Before=${ctx.scoreTeam2BeforeGoal}, ` +
                        `playerTeamScoreBefore=${playerTeamScoreBefore}, target=${target}, ` +
                        `primaryMatch=${primaryMatch}, ambiguous=${ctx.ownGoalAmbiguous}, altMatch=${altMatch}`
                );

                return primaryMatch || altMatch;

            case "own_goals":
                // Counter for own goals (used for season/all-time own goal chains)
                return ctx.goalType === "own_goal";

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

            case "team_streak_from_deficit":
                // Score at least target goals in a row after being behind by deficit_min goals
                // This is for Momentum Shift achievements
                const deficitMin = condition.deficit_min || 3;
                console.log(
                    `[team_streak_from_deficit GOAL] Player ${ctx.playerId}: ` +
                        `currentTeamStreakWhileBehind=${ctx.currentTeamStreakWhileBehind}, ` +
                        `deficitAtCurrentStreakStart=${ctx.deficitAtCurrentStreakStart}, ` +
                        `target=${target}, deficitMin=${deficitMin}`
                );
                return (
                    (ctx.currentTeamStreakWhileBehind || 0) >= target &&
                    (ctx.deficitAtCurrentStreakStart || 0) >= deficitMin
                );

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

// ============== PLAYER STATUS & BOUNTY SYSTEM ==============

interface PlayerStatusResult {
    playerId: number;
    gamemode: string;
    newStreak: number;
    oldStreak: number;
    newBounty: number;
    activeStatuses: string[];
    bountyClaimed: number;
    bountyVictimId: number | null;
    bountyGained: number;
}

/**
 * Updates player statuses after a match ends
 * Handles streak tracking, bounty calculation, and status effects
 */
async function updatePlayerStatusesAfterMatch(
    supabase: any,
    match: MatchRecord,
    playerContexts: PlayerMatchContext[]
): Promise<PlayerStatusResult[]> {
    const results: PlayerStatusResult[] = [];

    for (const ctx of playerContexts) {
        try {
            // Calculate score difference from player's perspective
            const isTeam1 = ctx.team === 1;
            const ownScore = isTeam1 ? match.scoreTeam1 : match.scoreTeam2;
            const oppScore = isTeam1 ? match.scoreTeam2 : match.scoreTeam1;
            const scoreDiff = ctx.isWinner
                ? ownScore - oppScore
                : (oppScore - ownScore) * -1;

            // Get opponent MMR (average for 2on2)
            let ownMmr = 0;
            let oppMmr = 0;

            if (match.gamemode === "1on1") {
                if (isTeam1) {
                    ownMmr = match.mmrPlayer1 || 1000;
                    oppMmr = match.mmrPlayer2 || 1000;
                } else {
                    ownMmr = match.mmrPlayer2 || 1000;
                    oppMmr = match.mmrPlayer1 || 1000;
                }
            } else {
                // 2on2: average MMR of teams
                if (isTeam1) {
                    ownMmr = Math.round(
                        ((match.mmrPlayer1 || 1000) +
                            (match.mmrPlayer3 || 1000)) /
                            2
                    );
                    oppMmr = Math.round(
                        ((match.mmrPlayer2 || 1000) +
                            (match.mmrPlayer4 || 1000)) /
                            2
                    );
                } else {
                    ownMmr = Math.round(
                        ((match.mmrPlayer2 || 1000) +
                            (match.mmrPlayer4 || 1000)) /
                            2
                    );
                    oppMmr = Math.round(
                        ((match.mmrPlayer1 || 1000) +
                            (match.mmrPlayer3 || 1000)) /
                            2
                    );
                }
            }

            // Call the RPC function to update player status
            const { data, error } = await supabase.rpc(
                "update_player_status_after_match",
                {
                    p_player_id: ctx.playerId,
                    p_match_id: match.id,
                    p_gamemode: match.gamemode,
                    p_is_winner: ctx.isWinner,
                    p_score_diff: scoreDiff,
                    p_own_mmr: ownMmr,
                    p_opponent_mmr: oppMmr,
                }
            );

            if (error) {
                console.error(
                    `Error updating status for player ${ctx.playerId}:`,
                    error
                );
                continue;
            }

            const result = data?.[0];
            if (result) {
                results.push({
                    playerId: ctx.playerId,
                    gamemode: match.gamemode,
                    newStreak: result.streak,
                    oldStreak: result.old_streak || 0,
                    newBounty: 0, // Bounty is calculated in the RPC
                    activeStatuses: result.new_status || [],
                    bountyClaimed: result.bounty_claimed || 0,
                    bountyVictimId: result.bounty_victim_id || null,
                    bountyGained: result.bounty_gained || 0,
                });

                // Log bounty claims
                if (result.bounty_claimed > 0) {
                    console.log(
                        `🎯 Player ${ctx.playerId} claimed ${result.bounty_claimed} MMR bounty from player ${result.bounty_victim_id}!`
                    );
                }

                // Log bounty gained
                if (result.bounty_gained > 0) {
                    console.log(
                        `💰 Player ${ctx.playerId} gained ${result.bounty_gained} bounty (streak: ${result.streak})`
                    );
                }

                // Log significant streak changes
                if (Math.abs(result.streak) >= 3) {
                    const streakType = result.streak > 0 ? "🔥 Win" : "❄️ Loss";
                    console.log(
                        `${streakType} streak: Player ${ctx.playerId} is now at ${result.streak} (${match.gamemode})`
                    );
                }
            }
        } catch (err) {
            console.error(
                `Unexpected error updating status for player ${ctx.playerId}:`,
                err
            );
        }
    }

    return results;
}

// ============== BOUNTY & STREAK ACHIEVEMENT PROCESSING ==============

interface BountyAchievementResult {
    playerId: number;
    achievementKey: string;
    action: "progress_updated" | "unlocked" | "skipped";
    newProgress?: number;
}

/**
 * Process bounty-related and streak achievements after player statuses are updated
 * Handles trigger events: bounty_claimed, bounty_gained, win_streak
 */
async function processBountyAchievements(
    supabase: any,
    match: MatchRecord,
    statusResults: PlayerStatusResult[]
): Promise<BountyAchievementResult[]> {
    const results: BountyAchievementResult[] = [];
    const seasonId = match.season_id || null;

    // Get all bounty-related achievements
    const { data: bountyAchievements, error: achievementsError } =
        await supabase
            .from("achievement_definitions")
            .select("*")
            .in("trigger_event", [
                "bounty_claimed",
                "bounty_gained",
                "win_streak",
            ]);

    if (achievementsError) {
        console.error("Error fetching bounty achievements:", achievementsError);
        return results;
    }

    if (!bountyAchievements || bountyAchievements.length === 0) {
        console.log("No bounty/streak achievements defined");
        return results;
    }

    console.log(
        `Found ${bountyAchievements.length} bounty/streak achievements to evaluate`
    );

    // Get player IDs from status results
    const playerIds = statusResults.map((r) => r.playerId);

    // Get existing unlocked achievements for all players
    const unlockedMap = await getUnlockedMap(supabase, playerIds);

    // Process each player's status result
    for (const statusResult of statusResults) {
        const playerId = statusResult.playerId;

        // Track newly unlocked in this iteration for chain logic
        const newlyUnlockedInThisIteration = new Set<number>();

        for (const achievement of bountyAchievements as AchievementDefinition[]) {
            // Skip if season-specific and doesn't match
            if (achievement.season_id && achievement.season_id !== seasonId) {
                continue;
            }

            // Check if already unlocked (and not repeatable)
            const alreadyUnlocked = unlockedMap.has(
                `${playerId}-${achievement.id}`
            );
            if (alreadyUnlocked && !achievement.is_repeatable) {
                continue;
            }

            // Check if parent achievement is unlocked (chain logic)
            if (achievement.parent_id) {
                const parentKey = `${playerId}-${achievement.parent_id}`;
                const parentWasAlreadyUnlocked = unlockedMap.has(parentKey);
                const parentJustUnlocked = newlyUnlockedInThisIteration.has(
                    achievement.parent_id
                );

                if (!parentWasAlreadyUnlocked && !parentJustUnlocked) {
                    continue;
                }

                // Initialize child progress if parent just unlocked
                if (parentJustUnlocked) {
                    const parentAchievement = (
                        bountyAchievements as AchievementDefinition[]
                    ).find((a) => a.id === achievement.parent_id);
                    if (parentAchievement) {
                        const childProgressSeasonId =
                            achievement.is_season_specific ? seasonId : null;
                        await initializeChainProgress(
                            supabase,
                            playerId,
                            achievement.id,
                            parentAchievement.max_progress,
                            childProgressSeasonId
                        );
                        console.log(
                            `[BountyChain] Initialized child ${achievement.key} with parent's max_progress: ${parentAchievement.max_progress}`
                        );
                    }
                    continue; // Skip this event for the child
                }
            }

            let shouldProgress = false;
            let progressAmount = 0;

            // Evaluate based on trigger event
            switch (achievement.trigger_event) {
                case "bounty_claimed":
                    // Player claimed bounty from another player
                    if (statusResult.bountyClaimed > 0) {
                        const condition = achievement.condition as any;

                        if (condition.min_count) {
                            // Count-based: "Defeat X players with bounty"
                            shouldProgress = true;
                            progressAmount = 1; // Each bounty claim counts as 1
                        } else if (condition.cumulative_bounty) {
                            // Cumulative: "Collect total of X bounty"
                            shouldProgress = true;
                            progressAmount = statusResult.bountyClaimed;
                        }
                    }
                    break;

                case "bounty_gained":
                    // Player gained bounty on their head (crossed a threshold)
                    if (statusResult.bountyGained > 0) {
                        const condition = achievement.condition as any;

                        if (condition.cumulative_bounty) {
                            // Cumulative: "Accumulate total of X bounty on your head"
                            shouldProgress = true;
                            progressAmount = statusResult.bountyGained;
                        }
                    }
                    break;

                case "win_streak":
                    // Player reached a certain win streak
                    if (statusResult.newStreak >= 3) {
                        const condition = achievement.condition as any;
                        const minStreak = condition.min_streak || 3;

                        // Check if player just crossed this streak threshold
                        if (
                            statusResult.newStreak >= minStreak &&
                            statusResult.oldStreak < minStreak
                        ) {
                            shouldProgress = true;
                            progressAmount = 1; // Binary: reached the streak or not
                        }
                    }
                    break;
            }

            if (shouldProgress && progressAmount > 0) {
                // Get current progress
                const progressSeasonId = achievement.is_season_specific
                    ? seasonId
                    : null;
                let progressQuery = supabase
                    .from("player_achievement_progress")
                    .select("current_progress")
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id);

                if (progressSeasonId === null) {
                    progressQuery = progressQuery.is("season_id", null);
                } else {
                    progressQuery = progressQuery.eq(
                        "season_id",
                        progressSeasonId
                    );
                }

                const { data: progressData } = await progressQuery.single();
                const currentProgress = progressData?.current_progress || 0;
                const newProgress = currentProgress + progressAmount;

                // Update or insert progress
                const { error: upsertError } = await supabase
                    .from("player_achievement_progress")
                    .upsert(
                        {
                            player_id: playerId,
                            achievement_id: achievement.id,
                            current_progress: newProgress,
                            season_id: progressSeasonId,
                            updated_at: new Date().toISOString(),
                        },
                        {
                            onConflict:
                                progressSeasonId === null
                                    ? "player_id,achievement_id,season_id"
                                    : "player_id,achievement_id,season_id",
                        }
                    );

                if (upsertError) {
                    console.error(
                        `Error updating progress for ${achievement.key}:`,
                        upsertError
                    );
                    continue;
                }

                console.log(
                    `[Bounty] ${achievement.key}: Player ${playerId} progress ${currentProgress} -> ${newProgress} / ${achievement.max_progress}`
                );

                // Check if achievement is now complete
                if (newProgress >= achievement.max_progress) {
                    const now = new Date().toISOString();

                    if (achievement.is_repeatable && alreadyUnlocked) {
                        // Increment times_completed for repeatable
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
                                    (existingAchievement?.times_completed ||
                                        1) + 1,
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
                            resetQuery = resetQuery.eq(
                                "season_id",
                                progressSeasonId
                            );
                        }

                        await resetQuery;

                        results.push({
                            playerId,
                            achievementKey: achievement.key,
                            action: "unlocked",
                            newProgress: 0,
                        });
                    } else if (!alreadyUnlocked) {
                        // Award achievement
                        const { error: awardError } = await supabase
                            .from("player_achievements")
                            .insert({
                                player_id: playerId,
                                achievement_id: achievement.id,
                                unlocked_at: now,
                                season_id: seasonId,
                                match_id: match.id,
                            });

                        if (awardError) {
                            console.error(
                                `Error awarding ${achievement.key}:`,
                                awardError
                            );
                        } else {
                            console.log(
                                `🏆 [Bounty] Achievement ${achievement.key} unlocked for player ${playerId}!`
                            );
                            newlyUnlockedInThisIteration.add(achievement.id);
                            results.push({
                                playerId,
                                achievementKey: achievement.key,
                                action: "unlocked",
                                newProgress,
                            });
                        }
                    }
                } else {
                    results.push({
                        playerId,
                        achievementKey: achievement.key,
                        action: "progress_updated",
                        newProgress,
                    });
                }
            }
        }
    }

    return results;
}
