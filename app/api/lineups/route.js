import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: lineups, error } = await supabase
      .from('lineups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lineups:', error);
      return Response.json({ error: 'Failed to fetch lineups' }, { status: 500 });
    }

    return Response.json(lineups);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, players, captain_id, wicketkeeper_id, first_bowler_id, second_bowler_id, is_main, user_id } = body;

    if (!name || !players || !captain_id || !wicketkeeper_id || !first_bowler_id || !second_bowler_id || !user_id) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (players.length !== 11) {
      return Response.json({ error: 'Exactly 11 players must be selected' }, { status: 400 });
    }

    // If this is set as main lineup, unset any existing main lineup
    if (is_main) {
      await supabase
        .from('lineups')
        .update({ is_main: false })
        .eq('user_id', user_id)
        .eq('is_main', true);
    }

    const lineupId = randomUUID();

    const { data: lineup, error } = await supabase
      .from('lineups')
      .insert([{
        id: lineupId,
        name,
        players,
        captain_id,
        wicketkeeper_id,
        first_bowler_id,
        second_bowler_id,
        is_main,
        user_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating lineup:', error);
      return Response.json({ error: 'Failed to create lineup' }, { status: 500 });
    }

    return Response.json(lineup);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
