// Auto-regenerate with: npx supabase gen types typescript --local > lib/database.types.ts
// This is the bootstrap version — keep in sync with supabase/schema.sql

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type SubscriptionTier = 'starter' | 'growth' | 'enterprise'
export type UserRole          = 'admin' | 'teacher' | 'student'
export type QuestionType      = 'mcq' | 'text' | 'true_false'
export type DifficultyLevel   = 'easy' | 'medium' | 'hard'
export type TestStatus        = 'draft' | 'published' | 'active' | 'closed'
export type SubmissionStatus  = 'not_started' | 'in_progress' | 'submitted' | 'graded'
export type InvoiceStatus     = 'paid' | 'pending' | 'overdue'

// ─── Row types (what SELECT returns) ─────────────────────────────────────────

export interface InstitutionRow {
  id: string; name: string; domain: string; admin_email: string; logo_url: string | null
  subscription_tier: SubscriptionTier; max_teachers: number; max_students: number
  ai_generations_used: number; ai_generations_limit: number; is_active: boolean
  created_at: string; updated_at: string
}
export interface ProfileRow {
  id: string; institution_id: string; role: UserRole; entity_id: string; created_at: string
}
export interface TeacherRow {
  id: string; user_id: string | null; institution_id: string; name: string; email: string
  subject: string; avatar_url: string | null; is_active: boolean; joined_at: string
}
export interface TeacherWithStatsRow extends TeacherRow { student_count: number; test_count: number }
export interface BatchRow {
  id: string; teacher_id: string; institution_id: string; name: string; subject: string
  student_count: number; created_at: string
}
export interface StudentRow {
  id: string; user_id: string | null; institution_id: string; teacher_id: string
  batch_id: string; name: string; email: string; roll_number: string; avatar_url: string | null
  is_active: boolean; enrolled_at: string
}
export interface TestRow {
  id: string; teacher_id: string; institution_id: string; batch_id: string; title: string
  description: string; subject: string; status: TestStatus; total_marks: number
  duration_minutes: number; scheduled_at: string | null; closes_at: string | null
  ai_generated: boolean; attempt_count: number; avg_score: number; created_at: string
}
export interface QuestionRow {
  id: string; test_id: string; order: number; type: QuestionType; text: string; marks: number
  difficulty: DifficultyLevel; correct_answer: string | null; explanation: string | null
  time_limit: number | null; ai_generated: boolean
}
export interface QuestionOptionRow { id: string; question_id: string; text: string; is_correct: boolean }
export interface SubmissionRow {
  id: string; test_id: string; student_id: string; student_name: string; status: SubmissionStatus
  started_at: string | null; submitted_at: string | null; graded_at: string | null
  total_score: number; max_score: number; percentage: number; time_taken_minutes: number
}
export interface SubmissionAnswerRow {
  id: string; submission_id: string; question_id: string; selected_option_id: string | null
  text_answer: string | null; is_correct: boolean | null; marks_awarded: number | null
  teacher_feedback: string | null; time_spent_seconds: number
}
export interface InvoiceRow {
  id: string; institution_id: string; amount: number; currency: string; status: InvoiceStatus
  issued_at: string; due_at: string; paid_at: string | null; description: string
}

// ─── Insert types ─────────────────────────────────────────────────────────────

export interface InstitutionInsert {
  id?: string; name: string; domain: string; admin_email: string; logo_url?: string | null
  subscription_tier: SubscriptionTier; max_teachers: number; max_students: number
  ai_generations_used?: number; ai_generations_limit?: number; is_active?: boolean
  created_at?: string; updated_at?: string
}
export interface ProfileInsert {
  id: string; institution_id: string; role: UserRole; entity_id: string; created_at?: string
}
export interface TeacherInsert {
  id?: string; user_id?: string | null; institution_id: string; name: string; email: string
  subject: string; avatar_url?: string | null; is_active?: boolean; joined_at?: string
}
export interface BatchInsert {
  id?: string; teacher_id: string; institution_id: string; name: string; subject: string
  student_count?: number; created_at?: string
}
export interface StudentInsert {
  id?: string; user_id?: string | null; institution_id: string; teacher_id: string
  batch_id: string; name: string; email: string; roll_number: string; avatar_url?: string | null
  is_active?: boolean; enrolled_at?: string
}
export interface TestInsert {
  id?: string; teacher_id: string; institution_id: string; batch_id: string; title: string
  description?: string; subject: string; status?: TestStatus; total_marks?: number
  duration_minutes: number; scheduled_at?: string | null; closes_at?: string | null
  ai_generated?: boolean; attempt_count?: number; avg_score?: number; created_at?: string
}
export interface QuestionInsert {
  id?: string; test_id: string; order: number; type: QuestionType; text: string; marks?: number
  difficulty?: DifficultyLevel; correct_answer?: string | null; explanation?: string | null
  time_limit?: number | null; ai_generated?: boolean
}
export interface QuestionOptionInsert { id?: string; question_id: string; text: string; is_correct?: boolean }
export interface SubmissionInsert {
  id?: string; test_id: string; student_id: string; student_name?: string; status?: SubmissionStatus
  started_at?: string | null; submitted_at?: string | null; graded_at?: string | null
  total_score?: number; max_score?: number; percentage?: number; time_taken_minutes?: number
}
export interface SubmissionAnswerInsert {
  id?: string; submission_id: string; question_id: string; selected_option_id?: string | null
  text_answer?: string | null; is_correct?: boolean | null; marks_awarded?: number | null
  teacher_feedback?: string | null; time_spent_seconds?: number
}
export interface InvoiceInsert {
  id?: string; institution_id: string; amount: number; currency?: string; status?: InvoiceStatus
  issued_at?: string; due_at: string; paid_at?: string | null; description?: string
}

// ─── Database type (for typed Supabase client) ────────────────────────────────

export interface Database {
  public: {
    Tables: {
      institutions:       { Row: InstitutionRow;      Insert: InstitutionInsert;      Update: Partial<InstitutionInsert>      }
      profiles:           { Row: ProfileRow;           Insert: ProfileInsert;          Update: Partial<ProfileInsert>          }
      teachers:           { Row: TeacherRow;           Insert: TeacherInsert;          Update: Partial<TeacherInsert>          }
      batches:            { Row: BatchRow;             Insert: BatchInsert;            Update: Partial<BatchInsert>            }
      students:           { Row: StudentRow;           Insert: StudentInsert;          Update: Partial<StudentInsert>          }
      tests:              { Row: TestRow;              Insert: TestInsert;             Update: Partial<TestInsert>             }
      questions:          { Row: QuestionRow;          Insert: QuestionInsert;         Update: Partial<QuestionInsert>         }
      question_options:   { Row: QuestionOptionRow;    Insert: QuestionOptionInsert;   Update: Partial<QuestionOptionInsert>   }
      submissions:        { Row: SubmissionRow;        Insert: SubmissionInsert;       Update: Partial<SubmissionInsert>       }
      submission_answers: { Row: SubmissionAnswerRow;  Insert: SubmissionAnswerInsert; Update: Partial<SubmissionAnswerInsert> }
      invoices:           { Row: InvoiceRow;           Insert: InvoiceInsert;          Update: Partial<InvoiceInsert>          }
    }
    Views: {
      teachers_with_stats: { Row: TeacherWithStatsRow }
    }
    Functions: {
      auth_institution_id: { Args: Record<never, never>; Returns: string }
      auth_role:           { Args: Record<never, never>; Returns: UserRole }
      auth_entity_id:      { Args: Record<never, never>; Returns: string }
    }
    Enums: {
      subscription_tier: SubscriptionTier; user_role: UserRole; question_type: QuestionType
      difficulty_level: DifficultyLevel; test_status: TestStatus
      submission_status: SubmissionStatus; invoice_status: InvoiceStatus
    }
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
