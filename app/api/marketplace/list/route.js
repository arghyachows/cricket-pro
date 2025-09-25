import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { player_id, sale_price } = body;

    if (!player_id || !sale_price) {
      return Response.json({ error: 'Player ID and sale price are required' }, { status: 400 });
    }

    // First, check if the player exists and belongs to the user
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', player_id)
      .single();

    if (playerError || !player) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    // Update the player to mark as for sale
    const { data: updatedPlayer, error: updateError } = await supabase
      .from('players')
      .update({
        is_for_sale: true,
        sale_price: parseInt(sale_price),
        market_value: parseInt(sale_price) // Update market value to sale price
      })
      .eq('id', player_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error listing player for sale:', updateError);
      return Response.json({ error: 'Failed to list player for sale' }, { status: 500 });
    }

    return Response.json({
      message: 'Player listed for sale successfully',
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('is_for_sale', true)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching players for sale:', error);
      return Response.json({ error: 'Failed to fetch players for sale' }, { status: 500 });
    }

    return Response.json(players);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
