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
}

interface SeasonRecord {
    id: number;
    name: string;
    status: string;
    kicker_id: number;
    start_date: string;
    end_date: string | null;
}

interface AchievementDefinition {
    id: number;
    key: string;
    name: string;
    trigger_event: string;
    condition: AchievementCondition;
    max_progress: number;
    is_repeatable: boolean;
    parent_id: number | null;
    season_id: number | null;
    kicker_id: number;
    points: number;
}

interface AchievementCondition {
    type: "counter" | "threshold" | "streak" | "compound";
    metric?: string;
    target?: number;
    filters?: {
        gamemode?: string;
        result?: "win" | "loss";
        score_diff?: { min?: number; max?: number };
        opponent_mmr?: { min?: number; max?: number };
        duration_seconds?: { min?: number; max?: number };
        goal_type?: string;
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
    gamemode: string;
    durationSeconds: number;
    match: MatchRecord;
}

interface PlayerGoalContext {
    playerId: number;
    goalType: string;
    gamemode: string;
    kickerId: number;
    matchId: number;
    amount: number;
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

    console.log(
        `Found ${achievements.length} MATCH_ENDED achievements to evaluate`
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

    // Build context for each player
    const playerContexts: PlayerMatchContext[] = buildPlayerMatchContexts(
        match,
        team1Won,
        scoreDiff,
        durationSeconds
    );

    // Get existing unlocked achievements for all players
    const unlockedMap = await getUnlockedMap(supabase, playerIds);

    // Process each player
    const results = await processMatchAchievements(
        supabase,
        playerContexts,
        achievements,
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

    // Only process standard goals (not own goals being removed)
    if (goal.amount <= 0) {
        return jsonResponse({ message: "Not a positive goal, skipping" });
    }

    console.log(
        `Processing GOAL_SCORED achievements for goal ${goal.id}, player ${goal.player_id}`
    );

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

    console.log(
        `Found ${achievements.length} GOAL_SCORED achievements to evaluate`
    );

    // Get the match to find the season_id
    const { data: match } = await supabase
        .from("matches")
        .select("season_id")
        .eq("id", goal.match_id)
        .single();

    const seasonId = match?.season_id || null;

    // Build context for this goal
    const goalCtx: PlayerGoalContext = {
        playerId: goal.player_id,
        goalType: goal.goal_type,
        gamemode: goal.gamemode,
        kickerId: goal.kicker_id,
        matchId: goal.match_id,
        amount: goal.amount,
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

    for (const achievement of achievements as AchievementDefinition[]) {
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

            // If parent was JUST unlocked in this iteration, don't count this event for the child
            // The child should start counting from the NEXT event
            // But we DO need to initialize the child's progress with the parent's max_progress
            if (parentJustUnlocked) {
                // Initialize child progress with parent's max_progress (carry over the count)
                const parentAchievement = (
                    achievements as AchievementDefinition[]
                ).find((a) => a.id === achievement.parent_id);
                if (parentAchievement) {
                    await initializeChainProgress(
                        supabase,
                        goal.player_id,
                        achievement.id,
                        parentAchievement.max_progress
                    );
                    console.log(
                        `[Chain] Initialized child achievement ${achievement.id} with parent's max_progress: ${parentAchievement.max_progress}`
                    );
                }
                // Skip counting this event for the child - it will count from next event
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
        .select("player_id, mmr, wins, losses")
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
    durationSeconds: number
): PlayerMatchContext[] {
    const contexts: PlayerMatchContext[] = [];

    // Player 1 (Team 1)
    contexts.push({
        playerId: match.player1,
        isWinner: team1Won,
        isLoser: !team1Won,
        team: 1,
        scoreDiff,
        opponentMmr: match.mmrPlayer2 || 1000,
        gamemode: match.gamemode,
        durationSeconds,
        match,
    });

    // Player 2 (Team 2)
    contexts.push({
        playerId: match.player2,
        isWinner: !team1Won,
        isLoser: team1Won,
        team: 2,
        scoreDiff,
        opponentMmr: match.mmrPlayer1 || 1000,
        gamemode: match.gamemode,
        durationSeconds,
        match,
    });

    // Player 3 (Team 1) if exists
    if (match.player3) {
        contexts.push({
            playerId: match.player3,
            isWinner: team1Won,
            isLoser: !team1Won,
            team: 1,
            scoreDiff,
            opponentMmr: match.mmrPlayer2 || 1000,
            gamemode: match.gamemode,
            durationSeconds,
            match,
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
            opponentMmr: match.mmrPlayer1 || 1000,
            gamemode: match.gamemode,
            durationSeconds,
            match,
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
                if (!unlockedMap.has(parentKey)) {
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

            // Evaluate condition
            const conditionMet = evaluateMatchCondition(
                achievement.condition,
                playerCtx
            );

            if (conditionMet) {
                const result = await updateProgress(
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
                }
            }
        }
    }

    return results;
}

// ============== CONDITION EVALUATORS ==============

function evaluateMatchCondition(
    condition: AchievementCondition,
    ctx: PlayerMatchContext
): boolean {
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

    // For counter/threshold types with metrics
    if (condition.type === "counter" || condition.type === "threshold") {
        const metric = condition.metric;
        switch (metric) {
            case "wins":
                return ctx.isWinner;
            case "losses":
                return ctx.isLoser;
            case "matches":
                return true;
            case "fatalities":
                return ctx.isWinner && ctx.scoreDiff >= 6;
            default:
                return true;
        }
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
    initialProgress: number
): Promise<void> {
    try {
        // Check if progress already exists
        const { data: existing } = await supabase
            .from("player_achievement_progress")
            .select("current_progress")
            .eq("player_id", playerId)
            .eq("achievement_id", achievementId)
            .maybeSingle();

        if (existing) {
            // Progress exists - only update if current is less than initial
            // This prevents overwriting if player already had progress somehow
            if (existing.current_progress < initialProgress) {
                await supabase
                    .from("player_achievement_progress")
                    .update({
                        current_progress: initialProgress,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievementId);
            }
        } else {
            // Create new progress record with initial progress
            await supabase.from("player_achievement_progress").insert({
                player_id: playerId,
                achievement_id: achievementId,
                current_progress: initialProgress,
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

    // For goals, the metric should be "goals"
    if (condition.type === "counter" || condition.type === "threshold") {
        const metric = condition.metric;
        if (metric === "goals") {
            return true; // Each goal counts
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
                return playerData.losses >= target;
            case "matches":
                return playerData.wins + playerData.losses >= target;
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
    // Try to use atomic RPC function first (prevents race conditions)
    try {
        const { data: result, error } = await supabase.rpc(
            "increment_achievement_progress",
            {
                p_player_id: playerId,
                p_achievement_id: achievement.id,
                p_kicker_id: achievement.kicker_id,
                p_increment: 1,
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

async function updateProgressFallback(
    supabase: any,
    playerId: number,
    achievement: AchievementDefinition,
    seasonId: number | null,
    matchId: number | null,
    alreadyUnlocked: boolean
): Promise<string> {
    try {
        // Get current progress
        const { data: progressData, error: selectError } = await supabase
            .from("player_achievement_progress")
            .select("current_progress")
            .eq("player_id", playerId)
            .eq("achievement_id", achievement.id)
            .maybeSingle();

        if (selectError) {
            console.error("[Fallback] Error selecting progress:", selectError);
        }

        const currentProgress = progressData?.current_progress || 0;
        const newProgress = Math.min(
            currentProgress + 1,
            achievement.max_progress
        );

        console.log(
            `[Fallback] Player ${playerId}, Achievement ${achievement.id}: Progress ${currentProgress} -> ${newProgress}/${achievement.max_progress}`
        );

        // Use INSERT or UPDATE based on whether record exists
        const now = new Date().toISOString();

        if (progressData) {
            // UPDATE existing record
            const { error: updateError } = await supabase
                .from("player_achievement_progress")
                .update({
                    current_progress: newProgress,
                    updated_at: now,
                })
                .eq("player_id", playerId)
                .eq("achievement_id", achievement.id);

            if (updateError) {
                console.error(
                    "[Fallback] Error updating progress:",
                    updateError
                );
                return "error";
            }
        } else {
            // INSERT new record
            // player_achievement_progress only has: id, player_id, achievement_id, current_progress, updated_at
            const { error: insertError } = await supabase
                .from("player_achievement_progress")
                .insert({
                    player_id: playerId,
                    achievement_id: achievement.id,
                    current_progress: newProgress,
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
                await supabase
                    .from("player_achievement_progress")
                    .update({ current_progress: 0 })
                    .eq("player_id", playerId)
                    .eq("achievement_id", achievement.id);
            } else if (!alreadyUnlocked) {
                // Award achievement
                // player_achievements columns: player_id, achievement_id, unlocked_at, times_completed, season_id, match_id
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
