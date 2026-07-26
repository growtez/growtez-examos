import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    // Fetch all exams that are trashed and were updated before the cutoff date
    const { data: oldTrashedExams, error: fetchError } = await adminSupabase
      .from('exams')
      .select('id')
      .eq('is_trashed', true)
      .lt('updated_at', cutoffDate);

    if (fetchError) {
      console.error('Error fetching old trashed exams:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (oldTrashedExams && oldTrashedExams.length > 0) {
      const ids = oldTrashedExams.map(e => e.id);
      
      // Permanently delete them
      const { error: deleteError } = await adminSupabase
        .from('exams')
        .delete()
        .in('id', ids);
        
      if (deleteError) {
        console.error('Error deleting old trashed exams:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, deleted: ids.length, message: `Successfully deleted ${ids.length} old trashed exams.` });
    }

    return NextResponse.json({ success: true, deleted: 0, message: 'No old trashed exams found to delete.' });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
