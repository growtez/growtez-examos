'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function deleteExam(id: string) {
  const supabase = createClient();
  
  // Update the exam to be trashed instead of hard deleting
  const { error } = await supabase.from('exams').update({ is_trashed: true }).eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/super-admin/exams');
  return { success: true };
}

export async function getExamForRegistration(examId: string) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: examData, error: examError } = await supabaseAdmin
    .from('exams')
    .select('id, title, start_time, end_time, status, is_trashed, school_id')
    .eq('id', examId)
    .single();

  if (examError || !examData) {
    return { success: false, error: examError?.message || 'Exam not found' };
  }

  const { data: schoolData } = await supabaseAdmin
    .from('schools')
    .select('id, name')
    .eq('id', examData.school_id)
    .single();

  return { 
    success: true, 
    exam: examData, 
    school: schoolData 
  };
}

export async function getExamForResult(examId: string) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: examData, error: examError } = await supabaseAdmin
    .from('exams')
    .select('*, schools(name)')
    .eq('id', examId)
    .single();

  if (examError || !examData) {
    return { success: false, error: examError?.message || 'Exam not found' };
  }

  if (examData.status !== 'completed') {
    return { success: false, error: 'Results for this exam are not yet published' };
  }

  return { success: true, exam: examData };
}

export async function fetchStudentResult(examId: string, schoolId: string, rollNumber: string, dob: string) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id, full_name')
    .eq('roll_number', rollNumber.trim())
    .eq('date_of_birth', dob)
    .eq('exam_id', examId)
    .single();

  if (studentError || !student) {
    return { success: false, error: 'Invalid Roll Number or Date of Birth' };
  }

  const { data: res, error: resultError } = await supabaseAdmin
    .from('results')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', student.id)
    .single();

  if (resultError || !res) {
    return { success: false, error: 'No result found for this student in this exam' };
  }

  return { success: true, result: { ...res, studentName: student.full_name } };
}
