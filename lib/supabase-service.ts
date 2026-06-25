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
import type {
  Institution,
  Teacher,
  Student,
  Batch,
  MockTest,
  Question,
  Submission,
  SubmissionAnswer,
  Invoice,
  AdminAnalytics,
  TeacherAnalytics,
  StudentAnalytics,
  OnboardFormData,
  AIGeneratorConfig,
} from '@/lib/types'

// ─── Plan limits ──────────────────────────────────────────────────────────────

const PLAN_LIMITS = {
  starter:    { maxTeachers: 5,   maxStudents: 100,  aiCredits: 20  },
  growth:     { maxTeachers: 25,  maxStudents: 500,  aiCredits: 100 },
  enterprise: { maxTeachers: 999, maxStudents: 9999, aiCredits: 999 },
}

// ─── Row → Domain type mappers ────────────────────────────────────────────────

function toInstitution(row: Record<string, unknown>): Institution {
  return {
    id:               row.id as string,
    name:             row.name as string,
    domain:           row.domain as string,
    adminEmail:       row.admin_email as string,
    logoUrl:          (row.logo_url as string) ?? undefined,
    subscriptionTier: row.subscription_tier as Institution['subscriptionTier'],
    maxTeachers:      row.max_teachers as number,
    maxStudents:      row.max_students as number,
    createdAt:        row.created_at as string,
    isActive:         row.is_active as boolean,
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

  const plan = PLAN_LIMITS[data.subscriptionTier]
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
      subscription_tier:    data.subscriptionTier,
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
  patch: Partial<Pick<Institution, 'name' | 'domain' | 'logoUrl'>>
): Promise<Institution> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('institutions')
    .update({
      ...(patch.name    !== undefined && { name:     patch.name }),
      ...(patch.domain  !== undefined && { domain:   patch.domain }),
      ...(patch.logoUrl !== undefined && { logo_url: patch.logoUrl }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toInstitution(data as Record<string, unknown>)
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
  const { data: teacher, error } = await supabase
    .from('teachers')
    .insert({
      institution_id: institutionId,
      name:           data.name,
      email:          data.email,
      subject:        data.subject,
      is_active:      true,
    })
    .select()
    .single()
  if (error) throw error
  // Note: to send an invite email use the admin client in a Server Action:
  //   await createAdminClient().auth.admin.inviteUserByEmail(data.email)
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
  if (error) throw error
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
      id, test_id, max_score,
      tests!inner(
        total_marks,
        questions(id, type, marks, question_options(id, is_correct))
      )
    `)
    .eq('id', submissionId)
    .single()

  if (subErr || !sub) throw new Error('Submission not found')

  const testsArr = (sub as unknown as { tests: Array<{ questions: Record<string, unknown>[] }> }).tests
  const questions = testsArr[0]?.questions ?? []
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
  const { data, error } = await supabase
    .from('submissions')
    .update({
      status:             'submitted',
      submitted_at:       new Date().toISOString(),
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
    .select('marks_awarded')
    .eq('submission_id', submissionId)

  const { data: sub } = await supabase
    .from('submissions')
    .select('max_score')
    .eq('id', submissionId)
    .single()

  const total = (answers ?? []).reduce(
    (acc, a) => acc + ((a.marks_awarded as number | null) ?? 0), 0
  )
  const maxScore = (sub?.max_score as number) ?? 1
  const pct = Math.round((total / maxScore) * 100)

  const { data, error } = await supabase
    .from('submissions')
    .update({
      total_score: total,
      percentage:  pct,
      status:      'graded',
      graded_at:   new Date().toISOString(),
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
    supabase.from('teachers').select('id, is_active').eq('institution_id', institutionId),
    supabase.from('students').select('id, is_active').eq('institution_id', institutionId),
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

  return {
    institutionId,
    totalTeachers:       teachers.length,
    activeTeachers:      teachers.filter(t => t.is_active).length,
    totalStudents:       students.length,
    activeStudents:      students.filter(s => s.is_active).length,
    totalTestsCreated:   tests.length,
    testsThisMonth:      tests.filter(t => new Date(t.created_at) >= thisMonthStart).length,
    avgInstitutionScore: avgScore,
    aiGenerationsUsed:   inst?.ai_generations_used ?? 0,
    aiGenerationsLimit:  inst?.ai_generations_limit ?? 20,
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
      tests!inner(title, subject)
    `)
    .eq('student_id', studentId)
    .in('status', ['submitted', 'graded'])
    .order('submitted_at', { ascending: false })
    .limit(50)

  const rows = (subs ?? []) as unknown as Array<{
    total_score: number
    max_score: number
    percentage: number
    submitted_at: string
    time_taken_minutes: number
    status: string
    tests: Array<{ title: string; subject: string }>
  }>

  const scoreHistory = rows.map(r => ({
    testTitle: r.tests[0]?.title ?? '',
    score:     r.total_score,
    maxScore:  r.max_score,
    date:      r.submitted_at,
  }))

  // subject → percentages
  const subjectMap = new Map<string, number[]>()
  rows.forEach(r => {
    const sub = r.tests[0]?.subject ?? 'Unknown'
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
