import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data: lineup, error } = await supabase
      .from('lineups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lineup:', error);
      return Response.json({ error: 'Failed to fetch lineup' }, { status: 500 });
    }

    if (!lineup) {
      return Response.json({ error: 'Lineup not found' }, { status: 404 });
    }

    return Response.json(lineup);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, players, captain_id, wicketkeeper_id, first_bowler_id, second_bowler_id, is_main } = body;

    if (!name || !players || !captain_id || !wicketkeeper_id || !first_bowler_id || !second_bowler_id) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (players.length !== 11) {
      return Response.json({ error: 'Exactly 11 players must be selected' }, { status: 400 });
    }

    // Get the current lineup to check if it's the main lineup
    const { data: currentLineup, error: fetchError } = await supabase
      .from('lineups')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current lineup:', fetchError);
      return Response.json({ error: 'Failed to fetch lineup' }, { status: 500 });
    }

    // If this is being set as main lineup, unset any existing main lineup
    if (is_main && !currentLineup.is_main) {
      await supabase
        .from('lineups')
        .update({ is_main: false })
        .eq('user_id', currentLineup.user_id)
        .eq('is_main', true);
    }

    const { data: lineup, error } = await supabase
      .from('lineups')
      .update({
        name,
        players,
        captain_id,
        wicketkeeper_id,
        first_bowler_id,
        second_bowler_id,
        is_main
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lineup:', error);
      return Response.json({ error: 'Failed to update lineup' }, { status: 500 });
    }

    return Response.json(lineup);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // First, get the lineup to check if it's the main lineup
    const { data: lineup, error: fetchError } = await supabase
      .from('lineups')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching lineup:', fetchError);
      return Response.json({ error: 'Failed to fetch lineup' }, { status: 500 });
    }

    if (!lineup) {
      return Response.json({ error: 'Lineup not found' }, { status: 404 });
    }

    // Prevent deletion of main lineup
    if (lineup.is_main) {
      return Response.json({ error: 'Cannot delete main lineup. Please set another lineup as main first.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('lineups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lineup:', error);
      return Response.json({ error: 'Failed to delete lineup' }, { status: 500 });
    }

    return Response.json({ message: 'Lineup deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
