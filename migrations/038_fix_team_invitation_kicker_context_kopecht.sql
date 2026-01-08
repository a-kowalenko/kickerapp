-- Migration: Fix accept_team_invitation to use correct kicker context
-- The issue is that a user can have multiple players across different kickers
-- We need to find the player for the specific kicker the team belongs to

SET search_path TO kopecht;

-- Fix accept_team_invitation function
CREATE OR REPLACE FUNCTION kopecht.accept_team_invitation(p_invitation_id BIGINT)
RETURNS JSON AS $$
DECLARE
    v_invitation RECORD;
    v_team RECORD;
    v_user_player_id BIGINT;
    v_kicker_id BIGINT;
BEGIN
    -- Get invitation first to know which team/kicker we're dealing with
    SELECT * INTO v_invitation
    FROM kopecht.team_invitations
    WHERE id = p_invitation_id;
    
    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invitation not found');
    END IF;
    
    -- Get the kicker_id from the team
    SELECT kicker_id INTO v_kicker_id
    FROM kopecht.teams
    WHERE id = v_invitation.team_id;
    
    -- Get current user's player ID for this specific kicker
    SELECT id INTO v_user_player_id
    FROM kopecht.player
    WHERE user_id = auth.uid()
    AND kicker_id = v_kicker_id
    LIMIT 1;
    
    IF v_user_player_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Player not found for this kicker');
    END IF;
    
    -- Check if user is the invited player
    IF v_invitation.invited_player_id != v_user_player_id THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized');
    END IF;
    
    -- Check if invitation is still pending
    IF v_invitation.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Invitation already responded to');
    END IF;
    
    -- Update invitation status
    UPDATE kopecht.team_invitations
    SET status = 'accepted', responded_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Activate the team
    UPDATE kopecht.teams
    SET status = 'active'
    WHERE id = v_invitation.team_id;
    
    -- Get team info for response
    SELECT * INTO v_team
    FROM kopecht.teams
    WHERE id = v_invitation.team_id;
    
    RETURN json_build_object(
        'success', true, 
        'team_id', v_team.id,
        'team_name', v_team.name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix decline_team_invitation function with same kicker context fix
CREATE OR REPLACE FUNCTION kopecht.decline_team_invitation(p_invitation_id BIGINT)
RETURNS JSON AS $$
DECLARE
    v_invitation RECORD;
    v_user_player_id BIGINT;
    v_kicker_id BIGINT;
BEGIN
    -- Get invitation first to know which team/kicker we're dealing with
    SELECT * INTO v_invitation
    FROM kopecht.team_invitations
    WHERE id = p_invitation_id;
    
    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invitation not found');
    END IF;
    
    -- Get the kicker_id from the team
    SELECT kicker_id INTO v_kicker_id
    FROM kopecht.teams
    WHERE id = v_invitation.team_id;
    
    -- Get current user's player ID for this specific kicker
    SELECT id INTO v_user_player_id
    FROM kopecht.player
    WHERE user_id = auth.uid()
    AND kicker_id = v_kicker_id
    LIMIT 1;
    
    IF v_user_player_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Player not found for this kicker');
    END IF;
    
    -- Check if user is the invited player
    IF v_invitation.invited_player_id != v_user_player_id THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized');
    END IF;
    
    -- Check if invitation is still pending
    IF v_invitation.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Invitation already responded to');
    END IF;
    
    -- Update invitation status
    UPDATE kopecht.team_invitations
    SET status = 'declined', responded_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Delete the pending team
    DELETE FROM kopecht.teams
    WHERE id = v_invitation.team_id;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
