import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching player:', error);
      return Response.json({ error: 'Failed to fetch player' }, { status: 500 });
    }

    if (!player) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    return Response.json(player);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      age,
      batting,
      bowling,
      keeping,
      technique,
      fielding,
      endurance,
      power,
      captaincy,
      experience,
      form,
      fatigue,
      wage,
      rating,
      nationality,
      batting_style,
      bowler_type,
      talents,
      squad_type,
      market_value,
      is_for_sale,
      sale_price
    } = body;

    const { data: player, error } = await supabase
      .from('players')
      .update({
        name,
        age,
        batting,
        bowling,
        keeping,
        technique,
        fielding,
        endurance,
        power,
        captaincy,
        experience,
        form,
        fatigue,
        wage,
        rating,
        nationality,
        batting_style,
        bowler_type,
        talents,
        squad_type,
        market_value,
        is_for_sale,
        sale_price
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating player:', error);
      return Response.json({ error: 'Failed to update player' }, { status: 500 });
    }

    return Response.json(player);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting player:', error);
      return Response.json({ error: 'Failed to delete player' }, { status: 500 });
    }

    return Response.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
