// ─── Core Domain Types ────────────────────────────────────────────────────────

export type UserRole = "admin" | "teacher" | "student";

export type SubscriptionTier = "free" | "starter" | "institution" | "campus";

export type BillingStatus = "free" | "active" | "past_due" | "canceled";

export type QuestionType = "mcq" | "text" | "true_false";

export type DifficultyLevel = "easy" | "medium" | "hard";

export type TestStatus = "draft" | "published" | "active" | "closed";

export type SubmissionStatus = "not_started" | "in_progress" | "submitted" | "graded";

export type ExamTrack = "ssc" | "upsc" | "jee" | "neet" | "cuet" | "general";

// ─── Institution & Admin ──────────────────────────────────────────────────────

export interface Institution {
  id: string;
  name: string;
  domain: string;
  adminEmail: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  subscriptionTier: SubscriptionTier;
  maxTeachers: number;
  maxStudents: number;
  createdAt: string;
  isActive: boolean;
  billingStatus: BillingStatus;
  currentPeriodEnd?: string;
  examTracks?: ExamTrack[];
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxTeachers: number;
  maxStudents: number;
  aiGenerationCredits: number;
  features: string[];
}

export interface Invoice {
  id: string;
  institutionId: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  description: string;
}

// ─── Teacher ──────────────────────────────────────────────────────────────────

export interface Teacher {
  id: string;
  institutionId: string;
  name: string;
  email: string;
  subject: string;
  avatarUrl?: string;
  isActive: boolean;
  joinedAt: string;
  studentCount: number;
  testCount: number;
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Batch {
  id: string;
  teacherId: string;
  institutionId: string;
  name: string;
  subject: string;
  studentCount: number;
  createdAt: string;
  examTrack?: ExamTrack;
}

export interface Student {
  id: string;
  institutionId: string;
  teacherId: string;
  batchId: string;
  name: string;
  email: string;
  rollNumber: string;
  avatarUrl?: string;
  isActive: boolean;
  enrolledAt: string;
  overallScore: number;
  testsAttempted: number;
  examTrack?: ExamTrack;
}

// ─── Test & Questions ─────────────────────────────────────────────────────────

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  testId: string;
  order: number;
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  options?: MCQOption[];       // for MCQ and true_false
  correctAnswer?: string;      // for text type (expected answer)
  explanation?: string;
  timeLimit?: number;          // seconds per question (optional)
  aiGenerated: boolean;
}

export interface MockTest {
  id: string;
  teacherId: string;
  institutionId: string;
  batchId: string;
  title: string;
  description: string;
  subject: string;
  status: TestStatus;
  totalMarks: number;
  durationMinutes: number;
  scheduledAt?: string;
  closesAt?: string;
  resultDelayMinutes: number;
  resultsDeclared: boolean;
  resultsDeclaredAt?: string;
  createdAt: string;
  questions: Question[];
  aiGenerated: boolean;
  attemptCount: number;
  avgScore: number;
  examTrack?: ExamTrack;
}

// ─── Question Bank ────────────────────────────────────────────────────────────
// Reusable, taggable questions independent of any test. `institutionId` is
// undefined for platform-wide shared content (e.g. a shared daily-quiz set).

export interface BankQuestion {
  id: string;
  institutionId?: string;
  createdByTeacherId?: string;
  examTrack: ExamTrack;
  topic: string;
  subject: string;
  relevantDate?: string;
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  options?: MCQOption[];
  correctAnswer?: string;
  explanation?: string;
  aiGenerated: boolean;
  createdAt: string;
}

export interface BankQuestionFilters {
  examTrack?: ExamTrack;
  topic?: string;
  subject?: string;
  relevantDate?: string;
  includesPlatformWide?: boolean;
}

export interface CreateBankQuestionData {
  examTrack: ExamTrack;
  topic: string;
  subject: string;
  relevantDate?: string;
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  options?: { text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
}

// ─── Submission & Answers ─────────────────────────────────────────────────────

export interface SubmissionAnswer {
  questionId: string;
  selectedOptionId?: string;   // for MCQ/true_false
  textAnswer?: string;         // for text type
  isCorrect?: boolean;
  marksAwarded?: number;
  teacherFeedback?: string;
  timeSpentSeconds: number;
}

export interface Submission {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  startedAt?: string;
  submittedAt?: string;
  gradedAt?: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeTakenMinutes: number;
  answers: SubmissionAnswer[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AdminAnalytics {
  institutionId: string;
  totalTeachers: number;
  activeTeachers: number;
  totalStudents: number;
  activeStudents: number;
  totalTestsCreated: number;
  testsThisMonth: number;
  avgInstitutionScore: number;
  aiGenerationsUsed: number;
  aiGenerationsLimit: number;
  teachersTrend: number;
  studentsTrend: number;
  testsTrend: number;
}

export interface TeacherAnalytics {
  teacherId: string;
  totalStudents: number;
  totalTestsCreated: number;
  totalSubmissions: number;
  pendingGrading: number;
  avgClassScore: number;
  topPerformer?: string;
  recentTestScores: { testTitle: string; avgScore: number; date: string }[];
}

export interface StudentAnalytics {
  studentId: string;
  overallScore: number;
  testsAttempted: number;
  testsPassed: number;
  avgTimePerTest: number;
  bestSubject: string;
  weakSubject: string;
  scoreHistory: { testTitle: string; score: number; maxScore: number; date: string }[];
  subjectBreakdown: { subject: string; avgScore: number }[];
}

// ─── Session / Role Context ───────────────────────────────────────────────────

export interface ActiveAdmin {
  role: "admin";
  user: Institution & { adminName: string };
}

export interface ActiveTeacher {
  role: "teacher";
  user: Teacher;
  institution: Institution;
}

export interface ActiveStudent {
  role: "student";
  user: Student;
  institution: Institution;
  teacher: Teacher;
}

export type ActiveSession = ActiveAdmin | ActiveTeacher | ActiveStudent;

// ─── Form / Wizard Step Types ─────────────────────────────────────────────────

export interface OnboardFormData {
  institutionName: string;
  domain: string;
  adminEmail: string;
  adminName: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
}

export interface CreateTestFormData {
  title: string;
  description: string;
  subject: string;
  batchId: string;
  durationMinutes: number;
  scheduledAt?: string;
  closesAt?: string;
  resultDelayMinutes?: number;
}

export interface AIGeneratorConfig {
  topic: string;
  subject: string;
  difficulty: DifficultyLevel;
  numQuestions: number;
  questionTypes: QuestionType[];
  marksPerQuestion: number;
  includeExplanations: boolean;
  gradeLevel: string;
  examTrack?: ExamTrack;
}

export interface BattleSession {
  id: string;
  cohortId: string;
  topic: string;
  status: 'waiting' | 'active' | 'completed';
  player1Id: string;
  player2Id?: string;
  player1Score: number;
  player2Score: number;
  questions: any[]; // JSON serialized questions array
  createdAt: string;
}

export interface BattleLog {
  battleId: string;
  playerId: string;
  questionIndex: number;
  selectedOption?: number;
  isCorrect: boolean;
  timeSpentMs?: number;
}
