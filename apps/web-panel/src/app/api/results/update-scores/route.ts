import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define our own admin client creator to avoid importing from non-existent paths if it doesn't exist
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function POST(request: Request) {
  try {
    const { updates } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates array' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const promises = updates.map((update: any) => 
      supabaseAdmin
        .from('results')
        .update({ 
          total_marks: update.total_marks, 
          section_scores: update.section_scores 
        })
        .eq('id', update.id)
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating scores:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
