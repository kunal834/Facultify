"use client";

import { create } from "zustand";
import { createBrowserClient } from "@supabase/ssr";

const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
import type { ActiveSession, Institution, Teacher, Student } from "@/lib/types";

// ─── Row → Domain type mappers (inline to avoid circular imports) ─────────────

function toInstitution(r: Record<string, unknown>): Institution {
  return {
    id:               r.id as string,
    name:             r.name as string,
    domain:           r.domain as string,
    adminEmail:       r.admin_email as string,
    logoUrl:          (r.logo_url as string) ?? undefined,
    primaryColor:     (r.primary_color as string) ?? "#3B6FFF",
    secondaryColor:   (r.secondary_color as string) ?? "#7C3AED",
    subscriptionTier: r.subscription_tier as Institution["subscriptionTier"],
    maxTeachers:      r.max_teachers as number,
    maxStudents:      r.max_students as number,
    createdAt:        r.created_at as string,
    isActive:         r.is_active as boolean,
    billingStatus:    (r.billing_status as Institution["billingStatus"]) ?? "free",
    currentPeriodEnd: (r.current_period_end as string) ?? undefined,
  };
}

function toTeacher(r: Record<string, unknown>): Teacher {
  return {
    id:            r.id as string,
    institutionId: r.institution_id as string,
    name:          r.name as string,
    email:         r.email as string,
    subject:       r.subject as string,
    avatarUrl:     (r.avatar_url as string) ?? undefined,
    isActive:      r.is_active as boolean,
    joinedAt:      r.joined_at as string,
    studentCount:  (r.student_count as number) ?? 0,
    testCount:     (r.test_count as number) ?? 0,
  };
}

function toStudent(r: Record<string, unknown>): Student {
  return {
    id:             r.id as string,
    institutionId:  r.institution_id as string,
    teacherId:      r.teacher_id as string,
    batchId:        r.batch_id as string,
    name:           r.name as string,
    email:          r.email as string,
    rollNumber:     r.roll_number as string,
    avatarUrl:      (r.avatar_url as string) ?? undefined,
    isActive:       r.is_active as boolean,
    enrolledAt:     r.enrolled_at as string,
    overallScore:   (r.overall_score as number) ?? 0,
    testsAttempted: (r.tests_attempted as number) ?? 0,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AppState {
  activeSession: ActiveSession | null;
  sessionLoading: boolean;
  initSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

let _initInFlight = false;

export const useAppStore = create<AppState>()((set) => ({
  activeSession: null,
  sessionLoading: true,

  initSession: async () => {
    // Prevent concurrent init calls (e.g. multiple layouts mounting at once)
    if (_initInFlight) return;
    _initInFlight = true;

    const supabase = createClient();
    set({ sessionLoading: true });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ activeSession: null, sessionLoading: false });
        _initInFlight = false;
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        console.warn("[initSession] no profile for user:", user.id, user.email);
        set({ activeSession: null, sessionLoading: false });
        _initInFlight = false;
        return;
      }

      if (profile.role === "admin") {
        const { data: inst } = await supabase
          .from("institutions")
          .select("*")
          .eq("id", profile.institution_id)
          .single();

        if (!inst) { set({ activeSession: null, sessionLoading: false }); _initInFlight = false; return; }

        set({
          activeSession: {
            role: "admin",
            user: {
              ...toInstitution(inst as Record<string, unknown>),
              adminName:
                (user.user_metadata?.full_name as string) ??
                (inst as Record<string, unknown>).admin_email as string,
            },
          },
          sessionLoading: false,
        });

      } else if (profile.role === "teacher") {
        // Try the stats view first; fall back to the base table so a missing view
        // doesn't silently block the teacher from reaching their dashboard.
        const [viewResult, instResult] = await Promise.all([
          supabase.from("teachers_with_stats").select("*").eq("id", profile.entity_id).single(),
          supabase.from("institutions").select("*").eq("id", profile.institution_id).single(),
        ]);

        let teacherRow = viewResult.data;

        if (!teacherRow) {
          // Fallback: query base table directly (stats will be 0 until page refreshes)
          const { data: base, error: baseErr } = await supabase
            .from("teachers")
            .select("*")
            .eq("id", profile.entity_id)
            .single();
          if (baseErr || !base) {
            console.error("[initSession] teacher row not found:", viewResult.error, baseErr);
            set({ activeSession: null, sessionLoading: false });
            _initInFlight = false;
            return;
          }
          teacherRow = { ...base, student_count: 0, test_count: 0 };
        }

        const inst = instResult.data;
        if (!inst) {
          console.error("[initSession] institution not found:", instResult.error);
          set({ activeSession: null, sessionLoading: false });
          _initInFlight = false;
          return;
        }

        set({
          activeSession: {
            role: "teacher",
            user: toTeacher(teacherRow as Record<string, unknown>),
            institution: toInstitution(inst as Record<string, unknown>),
          },
          sessionLoading: false,
        });

      } else if (profile.role === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("id", profile.entity_id)
          .single();

        if (!student) { set({ activeSession: null, sessionLoading: false }); _initInFlight = false; return; }

        const [{ data: inst }, { data: teacher }] = await Promise.all([
          supabase.from("institutions").select("*").eq("id", profile.institution_id).single(),
          supabase.from("teachers").select("*").eq("id", (student as Record<string, unknown>).teacher_id as string).single(),
        ]);

        if (!inst || !teacher) { set({ activeSession: null, sessionLoading: false }); _initInFlight = false; return; }

        set({
          activeSession: {
            role: "student",
            user: toStudent(student as Record<string, unknown>),
            institution: toInstitution(inst as Record<string, unknown>),
            teacher: toTeacher(teacher as Record<string, unknown>),
          },
          sessionLoading: false,
        });
      }
    } catch (err) {
      console.error("[initSession] unexpected error:", err);
      set({ activeSession: null, sessionLoading: false });
    } finally {
      _initInFlight = false;
    }
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ activeSession: null, sessionLoading: false });
  },
}));
