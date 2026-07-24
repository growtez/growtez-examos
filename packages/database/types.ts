// TypeScript types for Growtez ExamOS database tables (multi-table schema)

export interface School {
  id: string;
  name: string;
  domain: string | null;

  is_active: boolean;

  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student';

export interface SuperAdmin {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
}

export interface SchoolAdmin {
  id: string;
  school_id: string;
  full_name: string;
  email: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  full_name: string;
  email: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  full_name: string;
  email: string | null;
  roll_number: string;
  date_of_birth: string;
  created_at: string;
}

export type ExamStatus = 'draft' | 'published' | 'active' | 'completed';

export interface MarkingScheme {
  mcq_correct: number;
  mcq_wrong: number;
  nat_correct: number;
  nat_wrong: number;
  msq_correct?: number;
  msq_partial?: number;
  msq_wrong?: number;
  msq_partial_enabled?: boolean;
  msq_enabled?: boolean;
}

export interface Exam {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  status: ExamStatus;
  marking_scheme: MarkingScheme;
  total_marks: number | null;
  created_by: string | null;
  created_at: string;
}

export interface ExamSubject {
  id: string;
  exam_id: string;
  subject_name: string;
  question_count: number;
  sort_order: number;
  created_at: string;
}

export interface ExamSubjectTeacher {
  id: string;
  exam_subject_id: string;
  teacher_id: string;
  created_at: string;
}

export type QuestionType = 'mcq' | 'msq' | 'nat';

export interface McqOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  id: string;
  exam_id: string;
  school_id: string;
  exam_subject_id: string | null;
  question_text: string;
  question_type: QuestionType;
  options: McqOptions | null;
  correct_option: string;
  positive_marks: number;
  negative_marks: number;
  question_number: number | null;
  marks: number;
  created_at: string;
}

export type ExamStudentStatus = 'assigned' | 'in_progress' | 'submitted';

export interface ExamStudent {
  id: string;
  exam_id: string;
  student_id: string;
  status: ExamStudentStatus;
  started_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface SectionScore {
  subject_name: string;
  correct: number;
  wrong: number;
  unanswered: number;
  marks: number;
}

export interface StudentAnswer {
  question_id: string;
  answer: string | null;
  marked_for_review: boolean;
  time_spent_seconds: number;
}

export interface Result {
  id: string;
  exam_id: string;
  student_id: string;
  school_id: string;
  answers: Record<string, StudentAnswer>;
  total_marks: number | null;
  section_scores: SectionScore[];
  time_taken_seconds: number | null;
  submitted_at: string;
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School;
        Insert: Omit<School, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<School, 'id'>>;
      };
      super_admins: {
        Row: SuperAdmin;
        Insert: Omit<SuperAdmin, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<SuperAdmin, 'id'>>;
      };
      school_admins: {
        Row: SchoolAdmin;
        Insert: Omit<SchoolAdmin, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<SchoolAdmin, 'id'>>;
      };
      teachers: {
        Row: Teacher;
        Insert: Omit<Teacher, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Teacher, 'id'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Student, 'id'>>;
      };
      exams: {
        Row: Exam;
        Insert: Omit<Exam, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Exam, 'id'>>;
      };
      exam_subjects: {
        Row: ExamSubject;
        Insert: Omit<ExamSubject, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ExamSubject, 'id'>>;
      };
      exam_subject_teachers: {
        Row: ExamSubjectTeacher;
        Insert: Omit<ExamSubjectTeacher, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ExamSubjectTeacher, 'id'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Question, 'id'>>;
      };
      exam_students: {
        Row: ExamStudent;
        Insert: Omit<ExamStudent, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ExamStudent, 'id'>>;
      };
      results: {
        Row: Result;
        Insert: Omit<Result, 'id' | 'submitted_at'> & { id?: string; submitted_at?: string };
        Update: Partial<Omit<Result, 'id'>>;
      };
    };
  };
}
