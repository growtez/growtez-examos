import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type TypedSupabaseClient = SupabaseClient<Database>;

export const createSupabaseClient = (
  supabaseUrl: string,
  supabaseAnonKey: string
): TypedSupabaseClient => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export type {
  Database,
  School,
  SuperAdmin,
  SchoolAdmin,
  Teacher,
  Student,
  UserRole,
  Exam,
  ExamStatus,
  ExamSubject,
  ExamSubjectTeacher,
  Question,
  QuestionType,
  McqOptions,
  ExamStudent,
  ExamStudentStatus,
  Result,
  SectionScore,
  StudentAnswer,
  MarkingScheme,
} from './types';
