/**
 * Mock service layer — simulates database operations with realistic latency.
 * All state is held in memory and persisted to localStorage where appropriate.
 * Replace these functions with real Supabase/API calls when the backend is ready.
 */

import {
  INSTITUTIONS,
  TEACHERS,
  STUDENTS,
  BATCHES,
  MOCK_TESTS,
  SUBMISSIONS,
  INVOICES,
  ADMIN_ANALYTICS,
  TEACHER_ANALYTICS,
  STUDENT_ANALYTICS,
  AI_TEST_TEMPLATE,
  FREE_PLAN_LIMITS,
} from "./mock-data";

import type {
  Institution,
  Teacher,
  Student,
  Batch,
  MockTest,
  Submission,
  Invoice,
  AdminAnalytics,
  TeacherAnalytics,
  StudentAnalytics,
  OnboardFormData,
  AIGeneratorConfig,
  Question,
  SubmissionAnswer,
} from "./types";

// ─── In-memory mutable state ──────────────────────────────────────────────────

const _institutions = [...INSTITUTIONS];
let _teachers = [...TEACHERS];
let _students = [...STUDENTS];
const _batches = [...BATCHES];
let _tests = [...MOCK_TESTS];
const _submissions = [...SUBMISSIONS];
const _invoices = [...INVOICES];

// ─── Utility ──────────────────────────────────────────────────────────────────

const delay = (ms = 600) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const uid = () => Math.random().toString(36).slice(2, 10);

const now = () => new Date().toISOString();

// ─── Institution Services ─────────────────────────────────────────────────────

export async function getInstitution(id: string): Promise<Institution | undefined> {
  await delay(300);
  return _institutions.find((i) => i.id === id);
}

export async function onboardInstitution(data: OnboardFormData): Promise<Institution> {
  await delay(1200);

  // Every new institute starts on the free plan — no plan is ever chosen at signup.
  const institution: Institution = {
    id: `inst_${uid()}`,
    name: data.institutionName,
    domain: data.domain,
    adminEmail: data.adminEmail,
    primaryColor: "#3B6FFF",
    secondaryColor: "#7C3AED",
    subscriptionTier: "free",
    maxTeachers: FREE_PLAN_LIMITS.maxTeachers,
    maxStudents: FREE_PLAN_LIMITS.maxStudents,
    createdAt: now(),
    isActive: true,
    billingStatus: "free",
  };
  _institutions.push(institution);
  return institution;
}

// ─── Teacher Services ─────────────────────────────────────────────────────────

export async function getTeachers(institutionId: string): Promise<Teacher[]> {
  await delay(500);
  return _teachers.filter((t) => t.institutionId === institutionId);
}

export async function inviteTeacher(
  institutionId: string,
  data: { name: string; email: string; subject: string }
): Promise<Teacher> {
  await delay(800);
  const institution = _institutions.find((i) => i.id === institutionId);
  const currentCount = _teachers.filter((t) => t.institutionId === institutionId).length;
  if (institution && currentCount >= institution.maxTeachers) {
    throw new Error("LIMIT_TEACHERS_EXCEEDED");
  }
  const teacher: Teacher = {
    id: `teacher_${uid()}`,
    institutionId,
    name: data.name,
    email: data.email,
    subject: data.subject,
    isActive: true,
    joinedAt: now(),
    studentCount: 0,
    testCount: 0,
  };
  _teachers.push(teacher);
  return teacher;
}

export async function removeTeacher(teacherId: string): Promise<void> {
  await delay(600);
  _teachers = _teachers.filter((t) => t.id !== teacherId);
}

export async function toggleTeacherStatus(teacherId: string): Promise<Teacher> {
  await delay(400);
  const idx = _teachers.findIndex((t) => t.id === teacherId);
  if (idx === -1) throw new Error("Teacher not found");
  _teachers[idx] = { ..._teachers[idx], isActive: !_teachers[idx].isActive };
  return _teachers[idx];
}

// ─── Student Services ─────────────────────────────────────────────────────────

export async function getStudents(teacherId: string): Promise<Student[]> {
  await delay(500);
  return _students.filter((s) => s.teacherId === teacherId);
}

export async function getStudentsByBatch(batchId: string): Promise<Student[]> {
  await delay(400);
  return _students.filter((s) => s.batchId === batchId);
}

export async function addStudent(
  data: Omit<Student, "id" | "enrolledAt" | "overallScore" | "testsAttempted">
): Promise<Student> {
  await delay(700);
  const institution = _institutions.find((i) => i.id === data.institutionId);
  const currentCount = _students.filter((s) => s.institutionId === data.institutionId).length;
  if (institution && currentCount >= institution.maxStudents) {
    throw new Error("LIMIT_STUDENTS_EXCEEDED");
  }
  const student: Student = {
    ...data,
    id: `student_${uid()}`,
    enrolledAt: now(),
    overallScore: 0,
    testsAttempted: 0,
  };
  _students.push(student);
  return student;
}

export async function removeStudent(studentId: string): Promise<void> {
  await delay(500);
  _students = _students.filter((s) => s.id !== studentId);
}

// ─── Batch Services ───────────────────────────────────────────────────────────

export async function getBatches(teacherId: string): Promise<Batch[]> {
  await delay(400);
  return _batches.filter((b) => b.teacherId === teacherId);
}

export async function createBatch(
  data: Omit<Batch, "id" | "createdAt" | "studentCount">
): Promise<Batch> {
  await delay(600);
  const batch: Batch = {
    ...data,
    id: `batch_${uid()}`,
    studentCount: 0,
    createdAt: now(),
  };
  _batches.push(batch);
  return batch;
}

// ─── Test Services ────────────────────────────────────────────────────────────

export async function getTests(teacherId: string): Promise<MockTest[]> {
  await delay(500);
  return _tests.filter((t) => t.teacherId === teacherId);
}

export async function getTest(testId: string): Promise<MockTest | undefined> {
  await delay(300);
  return _tests.find((t) => t.id === testId);
}

export async function getStudentTests(studentId: string): Promise<MockTest[]> {
  await delay(500);
  const student = _students.find((s) => s.id === studentId);
  if (!student) return [];
  return _tests.filter(
    (t) => t.batchId === student.batchId && t.status !== "draft"
  );
}

export async function createTest(
  data: Omit<MockTest, "id" | "createdAt" | "attemptCount" | "avgScore" | "questions">
): Promise<MockTest> {
  await delay(800);
  const test: MockTest = {
    ...data,
    id: `test_${uid()}`,
    createdAt: now(),
    attemptCount: 0,
    avgScore: 0,
    questions: [],
  };
  _tests.push(test);
  return test;
}

export async function addQuestionToTest(
  testId: string,
  question: Omit<Question, "id" | "testId">
): Promise<Question> {
  await delay(400);
  const test = _tests.find((t) => t.id === testId);
  if (!test) throw new Error("Test not found");
  const newQuestion: Question = {
    ...question,
    id: `q_${uid()}`,
    testId,
  };
  test.questions.push(newQuestion);
  test.totalMarks += question.marks;
  return newQuestion;
}

export async function publishTest(testId: string): Promise<MockTest> {
  await delay(500);
  const idx = _tests.findIndex((t) => t.id === testId);
  if (idx === -1) throw new Error("Test not found");
  _tests[idx] = { ..._tests[idx], status: "published" };
  return _tests[idx];
}

export async function deleteTest(testId: string): Promise<void> {
  await delay(500);
  _tests = _tests.filter((t) => t.id !== testId);
}

// ─── AI Test Generation ───────────────────────────────────────────────────────

export async function generateAITest(
  config: AIGeneratorConfig,
  teacherId: string,
  institutionId: string,
  batchId: string
): Promise<MockTest> {
  // Simulate AI generation latency (2-4 seconds)
  await delay(2500 + Math.random() * 1500);

  const test: MockTest = {
    ...AI_TEST_TEMPLATE,
    id: `test_ai_${uid()}`,
    teacherId,
    institutionId,
    batchId,
    title: `${config.topic} - AI Generated`,
    description: `AI-generated ${config.difficulty} difficulty test on ${config.topic} covering ${config.numQuestions} questions.`,
    subject: config.subject,
    totalMarks: config.numQuestions * config.marksPerQuestion,
    createdAt: now(),
    questions: AI_TEST_TEMPLATE.questions
      .slice(0, config.numQuestions)
      .map((q, i) => ({
        ...q,
        id: `ai_q_${uid()}`,
        testId: `test_ai_${uid()}`,
        order: i + 1,
        marks: config.marksPerQuestion,
        difficulty: config.difficulty,
      })),
  };
  _tests.push(test);
  return test;
}

// ─── Submission Services ──────────────────────────────────────────────────────

export async function getSubmissions(testId: string): Promise<Submission[]> {
  await delay(500);
  return _submissions.filter((s) => s.testId === testId);
}

export async function getStudentSubmissions(studentId: string): Promise<Submission[]> {
  await delay(500);
  return _submissions.filter((s) => s.studentId === studentId);
}

export async function getSubmission(submissionId: string): Promise<Submission | undefined> {
  await delay(300);
  return _submissions.find((s) => s.id === submissionId);
}

export async function startTest(testId: string, studentId: string): Promise<Submission> {
  await delay(500);
  const existing = _submissions.find(
    (s) => s.testId === testId && s.studentId === studentId
  );
  if (existing) return existing;

  const student = _students.find((s) => s.id === studentId);
  const submission: Submission = {
    id: `sub_${uid()}`,
    testId,
    studentId,
    studentName: student?.name ?? "Unknown",
    status: "in_progress",
    startedAt: now(),
    totalScore: 0,
    maxScore: _tests.find((t) => t.id === testId)?.totalMarks ?? 0,
    percentage: 0,
    timeTakenMinutes: 0,
    answers: [],
  };
  _submissions.push(submission);
  return submission;
}

export async function submitTest(
  submissionId: string,
  answers: SubmissionAnswer[],
  timeTakenMinutes: number
): Promise<Submission> {
  await delay(800);
  const idx = _submissions.findIndex((s) => s.id === submissionId);
  if (idx === -1) throw new Error("Submission not found");

  const test = _tests.find((t) => t.id === _submissions[idx].testId);
  let autoScore = 0;

  const gradedAnswers = answers.map((a) => {
    const question = test?.questions.find((q) => q.id === a.questionId);
    if (!question) return a;

    if (question.type === "mcq" || question.type === "true_false") {
      const correct = question.options?.find((o) => o.isCorrect);
      const isCorrect = correct?.id === a.selectedOptionId;
      if (isCorrect) autoScore += question.marks;
      return { ...a, isCorrect, marksAwarded: isCorrect ? question.marks : 0 };
    }
    return a; // text questions need teacher grading
  });

  const hasTextQuestions = test?.questions.some((q) => q.type === "text") ?? false;

  _submissions[idx] = {
    ..._submissions[idx],
    status: hasTextQuestions ? "submitted" : "graded",
    submittedAt: now(),
    ...(hasTextQuestions ? {} : { gradedAt: now() }),
    answers: gradedAnswers,
    totalScore: autoScore,
    percentage: Math.round((autoScore / _submissions[idx].maxScore) * 100),
    timeTakenMinutes,
  };
  return _submissions[idx];
}

export async function gradeTextAnswer(
  submissionId: string,
  questionId: string,
  marksAwarded: number,
  feedback: string
): Promise<Submission> {
  await delay(400);
  const idx = _submissions.findIndex((s) => s.id === submissionId);
  if (idx === -1) throw new Error("Submission not found");

  const sub = _submissions[idx];
  const answerIdx = sub.answers.findIndex((a) => a.questionId === questionId);
  if (answerIdx === -1) throw new Error("Answer not found");

  sub.answers[answerIdx] = {
    ...sub.answers[answerIdx],
    marksAwarded,
    teacherFeedback: feedback,
    isCorrect: marksAwarded > 0,
  };

  const total = sub.answers.reduce((acc, a) => acc + (a.marksAwarded ?? 0), 0);
  const pct = Math.round((total / sub.maxScore) * 100);

  const test = _tests.find((t) => t.id === sub.testId);
  const textQuestionIds = (test?.questions ?? [])
    .filter((q) => q.type === "text")
    .map((q) => q.id);
  const allTextGraded = textQuestionIds.every((qid) => {
    const ans = sub.answers.find((a) => a.questionId === qid);
    return ans && ans.marksAwarded !== undefined && ans.marksAwarded !== null;
  });

  _submissions[idx] = {
    ...sub,
    totalScore: total,
    percentage: pct,
    status: allTextGraded ? "graded" : "submitted",
    ...(allTextGraded ? { gradedAt: now() } : {}),
  };
  return _submissions[idx];
}

// ─── Invoice Services ─────────────────────────────────────────────────────────

export async function getInvoices(institutionId: string): Promise<Invoice[]> {
  await delay(400);
  return _invoices.filter((i) => i.institutionId === institutionId);
}

// ─── Analytics Services ───────────────────────────────────────────────────────

export async function getAdminAnalytics(institutionId: string): Promise<AdminAnalytics> {
  await delay(600);
  const teachers = _teachers.filter((t) => t.institutionId === institutionId);
  const students = _students.filter((s) => s.institutionId === institutionId);
  const tests = _tests.filter((t) => t.institutionId === institutionId);
  return {
    ...ADMIN_ANALYTICS,
    institutionId,
    totalTeachers: teachers.length,
    activeTeachers: teachers.filter((t) => t.isActive).length,
    totalStudents: students.length,
    activeStudents: students.filter((s) => s.isActive).length,
    totalTestsCreated: tests.length,
  };
}

export async function getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics> {
  await delay(600);
  const students = _students.filter((s) => s.teacherId === teacherId);
  const tests = _tests.filter((t) => t.teacherId === teacherId);
  const allSubs = _submissions.filter((s) =>
    tests.map((t) => t.id).includes(s.testId)
  );
  return {
    ...TEACHER_ANALYTICS,
    teacherId,
    totalStudents: students.length,
    totalTestsCreated: tests.length,
    totalSubmissions: allSubs.length,
    pendingGrading: allSubs.filter((s) => s.status === "submitted").length,
  };
}

export async function getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
  await delay(500);
  return { ...STUDENT_ANALYTICS, studentId };
}
