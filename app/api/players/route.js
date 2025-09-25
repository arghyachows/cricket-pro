import { createClient } from '@supabase/supabase-js';

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

    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching players:', error);
      return Response.json({ error: 'Failed to fetch players' }, { status: 500 });
    }

    return Response.json(players);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
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

    if (!user_id || !name) {
      return Response.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    const { data: player, error } = await supabase
      .from('players')
      .insert([{
        user_id,
        name,
        age: age || 25,
        batting: batting || 50,
        bowling: bowling || 50,
        keeping: keeping || 50,
        technique: technique || 50,
        fielding: fielding || 50,
        endurance: endurance || 50,
        power: power || 50,
        captaincy: captaincy || 50,
        experience: experience || 0,
        form: form || 'Average',
        fatigue: fatigue || 'Fresh',
        wage: wage || 10000,
        rating: rating || 50,
        nationality: nationality || 'England',
        batting_style: batting_style || 'Right-handed',
        bowler_type: bowler_type || 'Right-arm medium',
        talents: talents || [],
        squad_type: squad_type || 'senior',
        market_value: market_value || 10000,
        is_for_sale: is_for_sale || false,
        sale_price: sale_price || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating player:', error);
      return Response.json({ error: 'Failed to create player' }, { status: 500 });
    }

    return Response.json(player);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
