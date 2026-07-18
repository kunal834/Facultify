/**
 * Supabase service layer — drop-in replacement for lib/mock-service.ts.
 * All function signatures are identical; swap the import in your pages.
 *
 * Used from Client Components (browser Supabase client).
 * For Server Actions / Route Handlers, import createClient from lib/supabase/server.ts instead.
 */

import { createBrowserClient } from '@supabase/ssr'

// Untyped client — our mapper functions already provide domain-level type safety
const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const getSupabaseBrowserClient = () => createClient()
import type {
  Institution,
  Teacher,
  Student,
  Batch,
  MockTest,
  Question,
  BankQuestion,
  BankQuestionFilters,
  CreateBankQuestionData,
  Submission,
  SubmissionAnswer,
  Invoice,
  AdminAnalytics,
  TeacherAnalytics,
  StudentAnalytics,
  OnboardFormData,
  AIGeneratorConfig,
  ExamTrack,
  BattleSession,
  BattleLog,
} from '@/lib/types'

// ─── Plan limits ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free:       { maxTeachers: 1,   maxStudents: 20,   aiCredits: 10     },
  starter:    { maxTeachers: 5,   maxStudents: 200,  aiCredits: 50     },
  institution:{ maxTeachers: 25,  maxStudents: 1000, aiCredits: 999999 },
  campus:     { maxTeachers: 999999, maxStudents: 3000, aiCredits: 999999 },
}

// ─── Row → Domain type mappers ────────────────────────────────────────────────

function toInstitution(row: Record<string, unknown>): Institution {
  return {
    id:               row.id as string,
    name:             row.name as string,
    domain:           row.domain as string,
    adminEmail:       row.admin_email as string,
    logoUrl:          (row.logo_url as string) ?? undefined,
    primaryColor:     (row.primary_color as string) ?? '#3B6FFF',
    secondaryColor:   (row.secondary_color as string) ?? '#7C3AED',
    subscriptionTier: row.subscription_tier as Institution['subscriptionTier'],
    maxTeachers:      row.max_teachers as number,
    maxStudents:      row.max_students as number,
    createdAt:        row.created_at as string,
    isActive:         row.is_active as boolean,
    billingStatus:    (row.billing_status as Institution['billingStatus']) ?? 'free',
    currentPeriodEnd: (row.current_period_end as string) ?? undefined,
    examTracks:       (row.exam_tracks as ExamTrack[]) ?? ['general'],
  }
}

function toTeacher(row: Record<string, unknown>): Teacher {
  return {
    id:            row.id as string,
    institutionId: row.institution_id as string,
    name:          row.name as string,
    email:         row.email as string,
    subject:       row.subject as string,
    avatarUrl:     (row.avatar_url as string) ?? undefined,
    isActive:      row.is_active as boolean,
    joinedAt:      row.joined_at as string,
    studentCount:  (row.student_count as number) ?? 0,
    testCount:     (row.test_count as number) ?? 0,
  }
}

function toStudent(row: Record<string, unknown>): Student {
  return {
    id:             row.id as string,
    institutionId:  row.institution_id as string,
    teacherId:      row.teacher_id as string,
    batchId:        row.batch_id as string,
    name:           row.name as string,
    email:          row.email as string,
    rollNumber:     row.roll_number as string,
    avatarUrl:      (row.avatar_url as string) ?? undefined,
    isActive:       row.is_active as boolean,
    enrolledAt:     row.enrolled_at as string,
    overallScore:   (row.overall_score as number) ?? 0,
    testsAttempted: (row.tests_attempted as number) ?? 0,
    examTrack:      (row.exam_track as ExamTrack) ?? 'general',
  }
}

function toBatch(row: Record<string, unknown>): Batch {
  return {
    id:            row.id as string,
    teacherId:     row.teacher_id as string,
    institutionId: row.institution_id as string,
    name:          row.name as string,
    subject:       row.subject as string,
    studentCount:  (row.student_count as number) ?? 0,
    createdAt:     row.created_at as string,
    examTrack:     (row.exam_track as ExamTrack) ?? 'general',
  }
}

function toQuestion(row: Record<string, unknown>): Question {
  const rawOpts = (row.question_options as Record<string, unknown>[] | null) ?? []
  return {
    id:            row.id as string,
    testId:        row.test_id as string,
    order:         row.order as number,
    type:          row.type as Question['type'],
    text:          row.text as string,
    marks:         row.marks as number,
    difficulty:    row.difficulty as Question['difficulty'],
    options:       rawOpts.map(o => ({
      id:        o.id as string,
      text:      o.text as string,
      isCorrect: o.is_correct as boolean,
    })),
    correctAnswer: (row.correct_answer as string) ?? undefined,
    explanation:   (row.explanation as string) ?? undefined,
    timeLimit:     (row.time_limit as number) ?? undefined,
    aiGenerated:   row.ai_generated as boolean,
  }
}

function toBankQuestion(row: Record<string, unknown>): BankQuestion {
  const rawOpts = (row.question_bank_options as Record<string, unknown>[] | null) ?? []
  return {
    id:                 row.id as string,
    institutionId:      (row.institution_id as string) ?? undefined,
    createdByTeacherId: (row.created_by_teacher_id as string) ?? undefined,
    examTrack:          row.exam_track as BankQuestion['examTrack'],
    topic:              row.topic as string,
    subject:            row.subject as string,
    relevantDate:       (row.relevant_date as string) ?? undefined,
    type:               row.type as BankQuestion['type'],
    text:               row.text as string,
    marks:              row.marks as number,
    difficulty:         row.difficulty as BankQuestion['difficulty'],
    options:            rawOpts.map(o => ({
      id:        o.id as string,
      text:      o.text as string,
      isCorrect: o.is_correct as boolean,
    })),
    correctAnswer:      (row.correct_answer as string) ?? undefined,
    explanation:        (row.explanation as string) ?? undefined,
    aiGenerated:        row.ai_generated as boolean,
    createdAt:          row.created_at as string,
  }
}

function toTest(row: Record<string, unknown>): MockTest {
  const rawQs = (row.questions as Record<string, unknown>[] | null) ?? []
  return {
    id:              row.id as string,
    teacherId:       row.teacher_id as string,
    institutionId:   row.institution_id as string,
    batchId:         row.batch_id as string,
    title:           row.title as string,
    description:     row.description as string,
    subject:         row.subject as string,
    status:          row.status as MockTest['status'],
    totalMarks:      row.total_marks as number,
    durationMinutes: row.duration_minutes as number,
    scheduledAt:     (row.scheduled_at as string) ?? undefined,
    closesAt:        (row.closes_at as string) ?? undefined,
    resultDelayMinutes: (row.result_delay_minutes as number) ?? 2,
    resultsDeclared:    (row.results_declared as boolean) ?? false,
    resultsDeclaredAt:  (row.results_declared_at as string) ?? undefined,
    createdAt:       row.created_at as string,
    aiGenerated:     row.ai_generated as boolean,
    attemptCount:    (row.attempt_count as number) ?? 0,
    avgScore:        (row.avg_score as number) ?? 0,
    questions:       rawQs.map(toQuestion),
  }
}

function toSubmissionAnswer(row: Record<string, unknown>): SubmissionAnswer {
  return {
    questionId:       row.question_id as string,
    selectedOptionId: (row.selected_option_id as string) ?? undefined,
    textAnswer:       (row.text_answer as string) ?? undefined,
    isCorrect:        (row.is_correct as boolean) ?? undefined,
    marksAwarded:     (row.marks_awarded as number) ?? undefined,
    teacherFeedback:  (row.teacher_feedback as string) ?? undefined,
    timeSpentSeconds: (row.time_spent_seconds as number) ?? 0,
  }
}

// A student's result becomes visible once the teacher explicitly declares it,
// or `resultDelayMinutes` after they submitted — whichever comes first.
export function isResultVisible(
  test: Pick<MockTest, 'resultsDeclared' | 'resultDelayMinutes'>,
  submission: Pick<Submission, 'submittedAt'>
): boolean {
  if (test.resultsDeclared) return true
  if (!submission.submittedAt) return false
  const revealAt = new Date(submission.submittedAt).getTime() + test.resultDelayMinutes * 60_000
  return Date.now() >= revealAt
}

function toSubmission(row: Record<string, unknown>): Submission {
  const rawAnswers = (row.submission_answers as Record<string, unknown>[] | null) ?? []
  return {
    id:               row.id as string,
    testId:           row.test_id as string,
    studentId:        row.student_id as string,
    studentName:      (row.student_name as string) ?? '',
    status:           row.status as Submission['status'],
    startedAt:        (row.started_at as string) ?? undefined,
    submittedAt:      (row.submitted_at as string) ?? undefined,
    gradedAt:         (row.graded_at as string) ?? undefined,
    totalScore:       (row.total_score as number) ?? 0,
    maxScore:         (row.max_score as number) ?? 0,
    percentage:       (row.percentage as number) ?? 0,
    timeTakenMinutes: (row.time_taken_minutes as number) ?? 0,
    answers:          rawAnswers.map(toSubmissionAnswer),
  }
}

function toInvoice(row: Record<string, unknown>): Invoice {
  return {
    id:            row.id as string,
    institutionId: row.institution_id as string,
    amount:        row.amount as number,
    currency:      row.currency as string,
    status:        row.status as Invoice['status'],
    issuedAt:      row.issued_at as string,
    dueAt:         row.due_at as string,
    paidAt:        (row.paid_at as string) ?? undefined,
    description:   row.description as string,
  }
}

// ─── Nested select fragments ──────────────────────────────────────────────────

const QUESTION_SELECT = `
  id, test_id, "order", type, text, marks, difficulty,
  correct_answer, explanation, time_limit, ai_generated,
  question_options(id, text, is_correct)
`

const TEST_SELECT = `
  *,
  questions(${QUESTION_SELECT})
`

// ─── Institution Services ─────────────────────────────────────────────────────

export async function getInstitution(id: string): Promise<Institution | undefined> {
  const supabase = createClient()
  const { data } = await supabase
    .from('institutions')
    .select('*')
    .eq('id', id)
    .single()
  return data ? toInstitution(data as Record<string, unknown>) : undefined
}

export async function onboardInstitution(data: OnboardFormData): Promise<Institution> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Every new institute starts on the free plan — no plan is ever chosen at signup.
  const plan = PLAN_LIMITS.free
  // Generate the UUID upfront so we can create the profile before selecting the institution.
  // This avoids an RLS chicken-and-egg problem: the institutions SELECT policy checks
  // auth_institution_id() which queries profiles — if the profile doesn't exist yet,
  // a chained .insert().select() would return no rows and throw.
  const institutionId = crypto.randomUUID()

  const { error: instErr } = await supabase
    .from('institutions')
    .insert({
      id:                   institutionId,
      name:                 data.institutionName,
      domain:               data.domain,
      admin_email:          data.adminEmail,
      subscription_tier:    'free',
      max_teachers:         plan.maxTeachers,
      max_students:         plan.maxStudents,
      ai_generations_limit: plan.aiCredits,
    })

  if (instErr) throw instErr

  // Create admin profile first — this lets auth_institution_id() resolve on the next SELECT
  const { error: profileErr } = await supabase.from('profiles').insert({
    id:             user.id,
    institution_id: institutionId,
    role:           'admin',
    entity_id:      institutionId,
  })
  console.log('Created admin profile for user', user.id, 'in institution', institutionId)
  if (profileErr) throw profileErr

  // Now the SELECT policy works because the profile exists
  const { data: inst, error: fetchErr } = await supabase
    .from('institutions')
    .select('*')
    .eq('id', institutionId)
    .single()

  if (fetchErr) throw fetchErr

  return toInstitution(inst as Record<string, unknown>)
}

export async function updateInstitution(
  id: string,
  patch: Partial<Pick<Institution, 'name' | 'domain' | 'adminEmail' | 'logoUrl' | 'primaryColor' | 'secondaryColor' | 'examTracks'>>
): Promise<Institution> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('institutions')
    .update({
      ...(patch.name          !== undefined && { name:            patch.name }),
      ...(patch.domain        !== undefined && { domain:          patch.domain }),
      ...(patch.adminEmail    !== undefined && { admin_email:     patch.adminEmail }),
      ...(patch.logoUrl       !== undefined && { logo_url:        patch.logoUrl }),
      ...(patch.primaryColor  !== undefined && { primary_color:   patch.primaryColor }),
      ...(patch.secondaryColor !== undefined && { secondary_color: patch.secondaryColor }),
      ...(patch.examTracks    !== undefined && { exam_tracks:     patch.examTracks }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toInstitution(data as Record<string, unknown>)
}

// Uploads a logo to the public `institution-assets` bucket at a stable path
// (so re-uploading replaces the old file instead of accumulating orphans),
// then persists the resulting public URL onto the institution row.
export async function uploadInstitutionLogo(institutionId: string, file: File): Promise<Institution> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${institutionId}/logo.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('institution-assets')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadErr) throw uploadErr

  const { data: { publicUrl } } = supabase.storage.from('institution-assets').getPublicUrl(path)

  // Cache-bust so the new logo shows immediately even though the path is stable.
  return updateInstitution(institutionId, { logoUrl: `${publicUrl}?v=${Date.now()}` })
}

// ─── Teacher Services ─────────────────────────────────────────────────────────

export async function getTeachers(institutionId: string): Promise<Teacher[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('teachers_with_stats')
    .select('*')
    .eq('institution_id', institutionId)
    .order('joined_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => toTeacher(r as Record<string, unknown>))
}

export async function inviteTeacher(
  institutionId: string,
  data: { name: string; email: string; subject: string }
): Promise<Teacher> {
  const supabase = createClient()
  const email = data.email.toLowerCase().trim()

  // Enforce global email uniqueness before inserting
  const { data: existing } = await supabase
    .from('teachers')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) throw new Error('A teacher with this email already exists.')

  const { data: teacher, error } = await supabase
    .from('teachers')
    .insert({
      institution_id: institutionId,
      name:           data.name.trim(),
      email,
      subject:        data.subject.trim(),
      is_active:      true,
    })
    .select()
    .single()
  if (error) {
    if (error.message.includes('LIMIT_TEACHERS_EXCEEDED')) throw new Error('LIMIT_TEACHERS_EXCEEDED')
    throw error
  }
  return toTeacher({ ...teacher as Record<string, unknown>, student_count: 0, test_count: 0 })
}

export async function removeTeacher(teacherId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('teachers').delete().eq('id', teacherId)
  if (error) throw error
}

export async function toggleTeacherStatus(teacherId: string): Promise<Teacher> {
  const supabase = createClient()
  const { data: current, error: fetchErr } = await supabase
    .from('teachers_with_stats')
    .select('*')
    .eq('id', teacherId)
    .single()
  if (fetchErr || !current) throw new Error('Teacher not found')

  const { data, error } = await supabase
    .from('teachers')
    .update({ is_active: !(current as Record<string, unknown>).is_active })
    .eq('id', teacherId)
    .select()
    .single()
  if (error) throw error
  return toTeacher({ ...data as Record<string, unknown>, student_count: (current as Record<string, unknown>).student_count, test_count: (current as Record<string, unknown>).test_count })
}

// ─── Student Services ─────────────────────────────────────────────────────────

export async function getStudents(teacherId: string): Promise<Student[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('enrolled_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => toStudent(r as Record<string, unknown>))
}

export async function getStudentsByBatch(batchId: string): Promise<Student[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('batch_id', batchId)
    .order('name')
  if (error) throw error
  return (data ?? []).map(r => toStudent(r as Record<string, unknown>))
}

export async function addStudent(
  data: Omit<Student, 'id' | 'enrolledAt' | 'overallScore' | 'testsAttempted'>
): Promise<Student> {
  const supabase = createClient()
  const { data: student, error } = await supabase
    .from('students')
    .insert({
      institution_id: data.institutionId,
      teacher_id:     data.teacherId,
      batch_id:       data.batchId,
      name:           data.name,
      email:          data.email,
      roll_number:    data.rollNumber,
      avatar_url:     data.avatarUrl ?? null,
      is_active:      data.isActive,
    })
    .select()
    .single()
  if (error) {
    if (error.message.includes('LIMIT_STUDENTS_EXCEEDED')) throw new Error('LIMIT_STUDENTS_EXCEEDED')
    throw error
  }
  return toStudent({ ...student as Record<string, unknown>, overall_score: 0, tests_attempted: 0 })
}

export async function removeStudent(studentId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('students').delete().eq('id', studentId)
  if (error) throw error
}

// ─── Batch Services ───────────────────────────────────────────────────────────

export async function getBatches(teacherId: string): Promise<Batch[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => toBatch(r as Record<string, unknown>))
}

export async function createBatch(
  data: Omit<Batch, 'id' | 'createdAt' | 'studentCount'>
): Promise<Batch> {
  const supabase = createClient()
  const { data: batch, error } = await supabase
    .from('batches')
    .insert({
      teacher_id:     data.teacherId,
      institution_id: data.institutionId,
      name:           data.name,
      subject:        data.subject,
      exam_track:     data.examTrack || 'general',
    })
    .select()
    .single()
  if (error) throw error
  return toBatch(batch as Record<string, unknown>)
}

// ─── Test Services ────────────────────────────────────────────────────────────

export async function getTests(teacherId: string): Promise<MockTest[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tests')
    .select(TEST_SELECT)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => toTest(r as Record<string, unknown>))
}

export async function getTest(testId: string): Promise<MockTest | undefined> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tests')
    .select(TEST_SELECT)
    .eq('id', testId)
    .single()
  if (error) return undefined
  return toTest(data as Record<string, unknown>)
}

export async function getStudentTests(studentId: string): Promise<MockTest[]> {
  const supabase = createClient()

  const { data: student } = await supabase
    .from('students')
    .select('batch_id')
    .eq('id', studentId)
    .single()

  if (!student) return []

  const { data, error } = await supabase
    .from('tests')
    .select(TEST_SELECT)
    .eq('batch_id', student.batch_id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(r => toTest(r as Record<string, unknown>))
}

export async function createTest(
  data: Omit<MockTest, 'id' | 'createdAt' | 'attemptCount' | 'avgScore' | 'questions'>
): Promise<MockTest> {
  const supabase = createClient()
  const { data: test, error } = await supabase
    .from('tests')
    .insert({
      teacher_id:       data.teacherId,
      institution_id:   data.institutionId,
      batch_id:         data.batchId,
      title:            data.title,
      description:      data.description,
      subject:          data.subject,
      status:           data.status,
      total_marks:      data.totalMarks,
      duration_minutes: data.durationMinutes,
      scheduled_at:     data.scheduledAt ?? null,
      closes_at:        data.closesAt ?? null,
      result_delay_minutes: data.resultDelayMinutes ?? 2,
      ai_generated:     data.aiGenerated,
    })
    .select()
    .single()
  if (error) throw error
  return toTest({ ...test as Record<string, unknown>, questions: [] })
}

export async function addQuestionToTest(
  testId: string,
  question: Omit<Question, 'id' | 'testId'>
): Promise<Question> {
  const supabase = createClient()

  const { data: q, error: qErr } = await supabase
    .from('questions')
    .insert({
      test_id:        testId,
      order:          question.order,
      type:           question.type,
      text:           question.text,
      marks:          question.marks,
      difficulty:     question.difficulty,
      correct_answer: question.correctAnswer ?? null,
      explanation:    question.explanation ?? null,
      time_limit:     question.timeLimit ?? null,
      ai_generated:   question.aiGenerated,
    })
    .select()
    .single()
  if (qErr) throw qErr

  // Insert options for MCQ / true_false
  if (question.options?.length) {
    const { error: optErr } = await supabase
      .from('question_options')
      .insert(
        question.options.map(opt => ({
          question_id: q.id,
          text:        opt.text,
          is_correct:  opt.isCorrect,
        }))
      )
    if (optErr) throw optErr
  }

  // Bump test total_marks
  const { data: current } = await supabase
    .from('tests')
    .select('total_marks')
    .eq('id', testId)
    .single()

  if (current) {
    await supabase
      .from('tests')
      .update({ total_marks: (current.total_marks as number) + question.marks })
      .eq('id', testId)
  }

  // Return question with options
  const { data: fullQ } = await supabase
    .from('questions')
    .select(`*, question_options(*)`)
    .eq('id', q.id)
    .single()

  return toQuestion(fullQ as Record<string, unknown>)
}

// ─── Question Bank ────────────────────────────────────────────────────────────
// Reusable, taggable questions independent of any test. RLS already scopes
// `select` to platform-wide (institution_id is null) + the caller's own
// institution, so no manual institution filter is required here — but we
// still narrow explicitly where useful for clearer intent at the call site.

export async function getBankQuestions(
  institutionId: string,
  filters: BankQuestionFilters = {}
): Promise<BankQuestion[]> {
  const supabase = createClient()
  let query = supabase
    .from('question_bank')
    .select('*, question_bank_options(*)')
    .order('created_at', { ascending: false })

  query = filters.includesPlatformWide === false
    ? query.eq('institution_id', institutionId)
    : query.or(`institution_id.eq.${institutionId},institution_id.is.null`)

  if (filters.examTrack) query = query.eq('exam_track', filters.examTrack)
  if (filters.topic) query = query.eq('topic', filters.topic)
  if (filters.subject) query = query.eq('subject', filters.subject)
  if (filters.relevantDate) query = query.eq('relevant_date', filters.relevantDate)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(row => toBankQuestion(row as Record<string, unknown>))
}

export async function createBankQuestion(
  institutionId: string,
  teacherId: string,
  data: CreateBankQuestionData
): Promise<BankQuestion> {
  const supabase = createClient()
  const { data: q, error: qErr } = await supabase
    .from('question_bank')
    .insert({
      institution_id:        institutionId,
      created_by_teacher_id: teacherId,
      exam_track:            data.examTrack,
      topic:                 data.topic,
      subject:               data.subject,
      relevant_date:         data.relevantDate ?? null,
      type:                  data.type,
      text:                  data.text,
      marks:                 data.marks,
      difficulty:            data.difficulty,
      correct_answer:        data.correctAnswer ?? null,
      explanation:           data.explanation ?? null,
      ai_generated:          false,
    })
    .select()
    .single()
  if (qErr) throw qErr

  if (data.options?.length) {
    const { error: optErr } = await supabase
      .from('question_bank_options')
      .insert(
        data.options.map(opt => ({
          question_bank_id: q.id,
          text:             opt.text,
          is_correct:       opt.isCorrect,
        }))
      )
    if (optErr) throw optErr
  }

  const { data: fullQ, error: fetchErr } = await supabase
    .from('question_bank')
    .select('*, question_bank_options(*)')
    .eq('id', q.id)
    .single()
  if (fetchErr) throw fetchErr
  return toBankQuestion(fullQ as Record<string, unknown>)
}

export async function deleteBankQuestion(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('question_bank').delete().eq('id', id)
  if (error) throw error
}

// Copies bank questions into a test's own `questions`/`question_options` rows
// — a one-time "materialize" so the test keeps a frozen copy at creation
// time, and grading/submissions never need to know the bank exists. Reuses
// addQuestionToTest so the total_marks bump and insert shape stay identical
// to the manual test-authoring path.
export async function materializeBankQuestions(
  testId: string,
  bankQuestions: BankQuestion[]
): Promise<Question[]> {
  const created: Question[] = []
  for (const [i, bq] of bankQuestions.entries()) {
    const question = await addQuestionToTest(testId, {
      order:         i + 1,
      type:          bq.type,
      text:          bq.text,
      marks:         bq.marks,
      difficulty:    bq.difficulty,
      options:       bq.options,
      correctAnswer: bq.correctAnswer,
      explanation:   bq.explanation,
      aiGenerated:   bq.aiGenerated,
    })
    created.push(question)
  }
  return created
}

export async function publishTest(testId: string): Promise<MockTest> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tests')
    .update({ status: 'published' })
    .eq('id', testId)
    .select(TEST_SELECT)
    .single()
  if (error) throw error
  return toTest(data as Record<string, unknown>)
}

// Teacher-triggered override: reveal results to students immediately,
// regardless of each submission's resultDelayMinutes timer.
export async function declareResults(testId: string): Promise<MockTest> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tests')
    .update({ results_declared: true, results_declared_at: new Date().toISOString() })
    .eq('id', testId)
    .select(TEST_SELECT)
    .single()
  if (error) throw error
  return toTest(data as Record<string, unknown>)
}

// Lets a teacher change how many minutes after submission a result auto-reveals,
// even after the test has already been created/published.
export async function updateResultDelayMinutes(testId: string, minutes: number): Promise<MockTest> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tests')
    .update({ result_delay_minutes: minutes })
    .eq('id', testId)
    .select(TEST_SELECT)
    .single()
  if (error) throw error
  return toTest(data as Record<string, unknown>)
}

export async function deleteTest(testId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tests').delete().eq('id', testId)
  if (error) throw error
}

// ─── AI Test Generation ───────────────────────────────────────────────────────
// Calls a Supabase Edge Function at supabase/functions/generate-test/index.ts
// The edge function calls your AI provider and returns a MockTest payload.

export async function generateAITest(
  config: AIGeneratorConfig,
  teacherId: string,
  institutionId: string,
  batchId: string
): Promise<MockTest> {
  const supabase = createClient()

  const { data, error } = await supabase.functions.invoke<MockTest>('generate-test', {
    body: { config, teacherId, institutionId, batchId },
  })
  if (error) throw error
  if (!data) throw new Error('No data returned from AI generator')
  return data
}

// ─── Submission Services ──────────────────────────────────────────────────────

export async function getSubmissions(testId: string): Promise<Submission[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*, submission_answers(*)')
    .eq('test_id', testId)
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => toSubmission(r as Record<string, unknown>))
}

export async function getStudentSubmissions(studentId: string): Promise<Submission[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*, submission_answers(*)')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => toSubmission(r as Record<string, unknown>))
}

export async function getSubmission(submissionId: string): Promise<Submission | undefined> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*, submission_answers(*)')
    .eq('id', submissionId)
    .single()
  if (error) return undefined
  return toSubmission(data as Record<string, unknown>)
}

export async function startTest(testId: string, studentId: string): Promise<Submission> {
  const supabase = createClient()

  // Return existing in-progress submission if one exists
  const { data: existing } = await supabase
    .from('submissions')
    .select('*, submission_answers(*)')
    .eq('test_id', testId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing) return toSubmission(existing as Record<string, unknown>)

  const { data: student } = await supabase
    .from('students')
    .select('name')
    .eq('id', studentId)
    .single()

  const { data: test } = await supabase
    .from('tests')
    .select('total_marks')
    .eq('id', testId)
    .single()

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      test_id:      testId,
      student_id:   studentId,
      student_name: student?.name ?? 'Unknown',
      status:       'in_progress',
      started_at:   new Date().toISOString(),
      max_score:    test?.total_marks ?? 0,
    })
    .select('*, submission_answers(*)')
    .single()

  if (error) throw error
  return toSubmission(data as Record<string, unknown>)
}

export async function submitTest(
  submissionId: string,
  answers: SubmissionAnswer[],
  timeTakenMinutes: number
): Promise<Submission> {
  const supabase = createClient()

  // Fetch submission + questions + options for auto-grading
  const { data: sub, error: subErr } = await supabase
    .from('submissions')
    .select(`
      id, test_id, status, max_score,
      tests!inner(
        total_marks,
        questions(id, type, marks, question_options(id, is_correct))
      )
    `)
    .eq('id', submissionId)
    .single()

  if (subErr || !sub) throw new Error('Submission not found')

  const subStatus = (sub as { status: string }).status
  if (subStatus === 'submitted' || subStatus === 'graded') {
    throw new Error('This test has already been submitted.')
  }

  const testRel = (sub as unknown as { tests: { questions: Record<string, unknown>[] } }).tests
  const questions = testRel?.questions ?? []
  let autoScore = 0

  const gradedAnswers = answers.map(a => {
    const q = questions.find((q) => q.id === a.questionId)
    if (!q) return a
    if (q.type === 'mcq' || q.type === 'true_false') {
      const opts = (q.question_options as { id: string; is_correct: boolean }[]) ?? []
      const correct = opts.find(o => o.is_correct)
      const isCorrect = correct?.id === a.selectedOptionId
      if (isCorrect) autoScore += q.marks as number
      return { ...a, isCorrect, marksAwarded: isCorrect ? q.marks as number : 0 }
    }
    return a
  })

  // Upsert all answers
  const answerRows = gradedAnswers.map(a => ({
    submission_id:      submissionId,
    question_id:        a.questionId,
    selected_option_id: a.selectedOptionId ?? null,
    text_answer:        a.textAnswer ?? null,
    is_correct:         a.isCorrect ?? null,
    marks_awarded:      a.marksAwarded ?? null,
    teacher_feedback:   a.teacherFeedback ?? null,
    time_spent_seconds: a.timeSpentSeconds,
  }))

  await supabase
    .from('submission_answers')
    .upsert(answerRows, { onConflict: 'submission_id,question_id' })

  const maxScore = (sub as { max_score: number }).max_score
  const hasTextQuestions = questions.some((q) => q.type === 'text')
  const { data, error } = await supabase
    .from('submissions')
    .update({
      status:             hasTextQuestions ? 'submitted' : 'graded',
      submitted_at:       new Date().toISOString(),
      ...(hasTextQuestions ? {} : { graded_at: new Date().toISOString() }),
      total_score:        autoScore,
      percentage:         Math.round((autoScore / maxScore) * 100),
      time_taken_minutes: timeTakenMinutes,
    })
    .eq('id', submissionId)
    .select('*, submission_answers(*)')
    .single()

  if (error) throw error
  return toSubmission(data as Record<string, unknown>)
}

export async function gradeTextAnswer(
  submissionId: string,
  questionId: string,
  marksAwarded: number,
  feedback: string
): Promise<Submission> {
  const supabase = createClient()

  await supabase
    .from('submission_answers')
    .update({
      marks_awarded:    marksAwarded,
      teacher_feedback: feedback,
      is_correct:       marksAwarded > 0,
    })
    .eq('submission_id', submissionId)
    .eq('question_id', questionId)

  // Recalculate total score from all answers
  const { data: answers } = await supabase
    .from('submission_answers')
    .select('question_id, marks_awarded')
    .eq('submission_id', submissionId)

  const { data: sub } = await supabase
    .from('submissions')
    .select('max_score, test_id')
    .eq('id', submissionId)
    .single()

  const total = (answers ?? []).reduce(
    (acc, a) => acc + ((a.marks_awarded as number | null) ?? 0), 0
  )
  const maxScore = (sub?.max_score as number) ?? 1
  const pct = Math.round((total / maxScore) * 100)

  const { data: textQuestions } = await supabase
    .from('questions')
    .select('id')
    .eq('test_id', sub?.test_id)
    .eq('type', 'text')

  const allTextGraded = (textQuestions ?? []).every((q) => {
    const ans = (answers ?? []).find((a) => a.question_id === q.id)
    return ans && ans.marks_awarded !== null
  })

  const { data, error } = await supabase
    .from('submissions')
    .update({
      total_score: total,
      percentage:  pct,
      status:      allTextGraded ? 'graded' : 'submitted',
      ...(allTextGraded ? { graded_at: new Date().toISOString() } : {}),
    })
    .eq('id', submissionId)
    .select('*, submission_answers(*)')
    .single()

  if (error) throw error
  return toSubmission(data as Record<string, unknown>)
}

// ─── Invoice Services ─────────────────────────────────────────────────────────

export async function getInvoices(institutionId: string): Promise<Invoice[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('institution_id', institutionId)
    .order('issued_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => toInvoice(r as Record<string, unknown>))
}

// ─── Analytics Services ───────────────────────────────────────────────────────

export async function getAdminAnalytics(institutionId: string): Promise<AdminAnalytics> {
  const supabase = createClient()

  const [teachersRes, studentsRes, testsRes, instRes] = await Promise.all([
    supabase.from('teachers').select('id, is_active, joined_at').eq('institution_id', institutionId),
    supabase.from('students').select('id, is_active, enrolled_at').eq('institution_id', institutionId),
    supabase.from('tests').select('id, created_at').eq('institution_id', institutionId),
    supabase.from('institutions').select('ai_generations_used, ai_generations_limit').eq('id', institutionId).single(),
  ])

  const teachers = teachersRes.data ?? []
  const students = studentsRes.data ?? []
  const tests    = testsRes.data ?? []
  const inst     = instRes.data

  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)

  const lastMonthStart = new Date(thisMonthStart)
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)

  const allSubs = await supabase
    .from('submissions')
    .select('percentage')
    .in('test_id', tests.map(t => t.id))

  const avgScore = (allSubs.data?.length ?? 0) > 0
    ? Math.round(
        (allSubs.data ?? []).reduce((s, r) => s + (r.percentage as number), 0) /
        allSubs.data!.length
      )
    : 0

  const teachersThisMonth = teachers.filter(t => new Date(t.joined_at) >= thisMonthStart).length
  const teachersLastMonth = teachers.filter(t => {
    const d = new Date(t.joined_at)
    return d >= lastMonthStart && d < thisMonthStart
  }).length

  const studentsThisMonth = students.filter(s => new Date(s.enrolled_at) >= thisMonthStart).length
  const studentsLastMonth = students.filter(s => {
    const d = new Date(s.enrolled_at)
    return d >= lastMonthStart && d < thisMonthStart
  }).length

  const testsThisMonth = tests.filter(t => new Date(t.created_at) >= thisMonthStart).length
  const testsLastMonth = tests.filter(t => {
    const d = new Date(t.created_at)
    return d >= lastMonthStart && d < thisMonthStart
  }).length

  return {
    institutionId,
    totalTeachers:       teachers.length,
    activeTeachers:      teachers.filter(t => t.is_active).length,
    totalStudents:       students.length,
    activeStudents:      students.filter(s => s.is_active).length,
    totalTestsCreated:   tests.length,
    testsThisMonth,
    avgInstitutionScore: avgScore,
    aiGenerationsUsed:   inst?.ai_generations_used ?? 0,
    aiGenerationsLimit:  inst?.ai_generations_limit ?? 20,
    teachersTrend:       teachersThisMonth - teachersLastMonth,
    studentsTrend:       studentsThisMonth - studentsLastMonth,
    testsTrend:          testsThisMonth - testsLastMonth,
  }
}

export async function getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics> {
  const supabase = createClient()

  const [studentsRes, testsRes] = await Promise.all([
    supabase.from('students').select('id').eq('teacher_id', teacherId),
    supabase.from('tests').select('id, title, created_at, avg_score').eq('teacher_id', teacherId),
  ])

  const tests = testsRes.data ?? []

  const subsRes = await supabase
    .from('submissions')
    .select('id, status, percentage')
    .in('test_id', tests.map(t => t.id))

  const subs = subsRes.data ?? []
  const pendingGrading = subs.filter(s => s.status === 'submitted').length
  const avgClassScore  = subs.length
    ? Math.round(subs.reduce((a, s) => a + (s.percentage as number), 0) / subs.length)
    : 0

  // Top performer
  const topPerRes = await supabase
    .from('submissions')
    .select('student_id, percentage, students!inner(name)')
    .in('test_id', tests.map(t => t.id))
    .eq('status', 'graded')
    .order('percentage', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    teacherId,
    totalStudents:    studentsRes.data?.length ?? 0,
    totalTestsCreated: tests.length,
    totalSubmissions:  subs.length,
    pendingGrading,
    avgClassScore,
    topPerformer:     (topPerRes.data as Record<string, { name: string }> | null)?.students?.name,
    recentTestScores: tests.slice(0, 5).map(t => ({
      testTitle: t.title,
      avgScore:  t.avg_score as number,
      date:      t.created_at,
    })),
  }
}

export async function getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
  const supabase = createClient()

  const { data: subs } = await supabase
    .from('submissions')
    .select(`
      total_score, max_score, percentage, submitted_at, time_taken_minutes, status,
      tests!inner(title, subject, result_delay_minutes, results_declared)
    `)
    .eq('student_id', studentId)
    .in('status', ['submitted', 'graded'])
    .order('submitted_at', { ascending: false })
    .limit(50)

  const allRows = (subs ?? []) as unknown as Array<{
    total_score: number
    max_score: number
    percentage: number
    submitted_at: string
    time_taken_minutes: number
    status: string
    tests: { title: string; subject: string; result_delay_minutes: number; results_declared: boolean }
  }>

  // Hide scores that haven't been declared yet — same rule as isResultVisible().
  const rows = allRows.filter(r => {
    const t = r.tests
    if (!t) return false
    return isResultVisible(
      { resultsDeclared: t.results_declared, resultDelayMinutes: t.result_delay_minutes },
      { submittedAt: r.submitted_at }
    )
  })

  const scoreHistory = rows.map(r => ({
    testTitle: r.tests?.title ?? '',
    score:     r.total_score,
    maxScore:  r.max_score,
    date:      r.submitted_at,
  }))

  // subject → percentages
  const subjectMap = new Map<string, number[]>()
  rows.forEach(r => {
    const sub = r.tests?.subject ?? 'Unknown'
    if (!subjectMap.has(sub)) subjectMap.set(sub, [])
    subjectMap.get(sub)!.push(r.percentage)
  })

  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, scores]) => ({
    subject,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }))

  const sorted = subjectBreakdown.sort((a, b) => b.avgScore - a.avgScore)
  const bestSubject = sorted[0]?.subject ?? ''
  const weakSubject = sorted[sorted.length - 1]?.subject ?? ''

  const overall = rows.length
    ? Math.round(rows.reduce((a, r) => a + r.percentage, 0) / rows.length)
    : 0

  const avgTime = rows.length
    ? Math.round(rows.reduce((a, r) => a + r.time_taken_minutes, 0) / rows.length)
    : 0

  return {
    studentId,
    overallScore:    overall,
    testsAttempted:  rows.length,
    testsPassed:     rows.filter(r => r.percentage >= 50).length,
    avgTimePerTest:  avgTime,
    bestSubject,
    weakSubject,
    scoreHistory,
    subjectBreakdown,
  }
}

export async function updateStudentExamTrack(
  studentId: string,
  examTrack: ExamTrack
): Promise<Student> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .update({ exam_track: examTrack })
    .eq('id', studentId)
    .select()
    .single()
  if (error) throw error
  return toStudent(data as Record<string, unknown>)
}

function toBattleSession(row: Record<string, unknown>): BattleSession {
  return {
    id:             row.id as string,
    cohortId:       row.cohort_id as string,
    topic:          row.topic as string,
    status:         row.status as 'waiting' | 'active' | 'completed',
    player1Id:      row.player_1_id as string,
    player2Id:      (row.player_2_id as string) ?? undefined,
    player1Score:   row.player_1_score as number,
    player2Score:   row.player_2_score as number,
    questions:      (row.questions as any[]) ?? [],
    createdAt:      row.created_at as string,
  }
}

export async function createBattleSession(data: {
  cohortId: string
  topic: string
  player1Id: string
  questions: any[]
}): Promise<BattleSession> {
  const supabase = createClient()
  const { data: res, error } = await supabase
    .from('battle_sessions')
    .insert({
      cohort_id:     data.cohortId,
      topic:         data.topic,
      player_1_id:   data.player1Id,
      questions:     data.questions,
      status:        'waiting',
    })
    .select()
    .single()
  if (error) throw error
  return toBattleSession(res as Record<string, unknown>)
}

export async function joinBattleSession(
  battleId: string,
  player2Id: string
): Promise<BattleSession> {
  const supabase = createClient()
  const { data: res, error } = await supabase
    .from('battle_sessions')
    .update({
      player_2_id: player2Id,
      status:      'active',
    })
    .eq('id', battleId)
    .select()
    .single()
  if (error) throw error
  return toBattleSession(res as Record<string, unknown>)
}

export async function getBattleSession(
  battleId: string
): Promise<BattleSession | undefined> {
  const supabase = createClient()
  const { data: res, error } = await supabase
    .from('battle_sessions')
    .select('*')
    .eq('id', battleId)
    .single()
  if (error) return undefined
  return toBattleSession(res as Record<string, unknown>)
}

export async function updateBattleScore(
  battleId: string,
  playerId: string,
  isPlayer1: boolean,
  score: number
): Promise<void> {
  const supabase = createClient()
  const payload = isPlayer1
    ? { player_1_score: score }
    : { player_2_score: score }
  const { error } = await supabase
    .from('battle_sessions')
    .update(payload)
    .eq('id', battleId)
  if (error) throw error
}

export async function addBattleLog(
  log: BattleLog
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('battle_logs')
    .insert({
      battle_id:       log.battleId,
      player_id:       log.playerId,
      question_index:  log.questionIndex,
      selected_option: log.selectedOption,
      is_correct:      log.isCorrect,
      time_spent_ms:   log.timeSpentMs,
    })
  if (error) throw error
}
