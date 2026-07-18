"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  Zap, 
  Users, 
  Sword, 
  CheckCircle2, 
  Play, 
  Search, 
  Sparkles, 
  Clock, 
  Check, 
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import PageHeader from "@/components/dashboards/PageHeader";
import {
  getSupabaseBrowserClient,
  getStudentsByBatch,
  createBattleSession,
  joinBattleSession,
  getBattleSession,
  updateBattleScore,
  addBattleLog
} from "@/lib/supabase-service";
import type { Student, BattleSession, BattleLog } from "@/lib/types";
import { toast } from "sonner";

// Mock Leaderboard Data
const LEADERBOARD = [
  { rank: 1, name: "Aarav Sharma", score: 980, streak: 14, active: true },
  { rank: 2, name: "Priya Patel", score: 910, streak: 8, active: false },
  { rank: 3, name: "Rahul Verma", score: 850, streak: 5, active: true },
  { rank: 4, name: "Ananya Iyer", score: 790, streak: 12, active: true },
  { rank: 5, name: "Vikram Singh", score: 720, streak: 3, active: false },
];

// Mock Batchmates for 1v1
const BATCHMATES = [
  { id: "1", name: "Ananya Iyer", online: true, rank: 4 },
  { id: "2", name: "Priya Patel", online: false, rank: 2 },
  { id: "3", name: "Aarav Sharma", online: true, rank: 1 },
  { id: "4", name: "Vikram Singh", online: true, rank: 5 },
  { id: "5", name: "Rohan Das", online: true, rank: 8 },
];

export default function StudentDailyArenaPage() {
  const { activeSession } = useAppStore();
  const studentName = activeSession?.user?.name ?? "Student";
  const student = activeSession?.role === "student" ? activeSession.user : null;
  const track = (student?.examTrack as string) ?? "general";

  const dailyQuizzes: Record<string, { category: string; duration: string; title: string; desc: string; points: string }[]> = {
    jee: [
      { category: "JEE Physics Focus", duration: "8 mins", title: "JEE Physics Capacitor & Charge Boost", desc: "10 conceptual questions covering capacitor series/parallel, Gauss' law, and numeric capacitor fields.", points: "+80 Streak Points" },
      { category: "JEE Mathematics Focus", duration: "10 mins", title: "JEE Calculus & Limits Challenge", desc: "10 rigorous calculus questions covering limits, derivatives, integration limits, and areas under curves.", points: "+100 Streak Points" }
    ],
    neet: [
      { category: "NEET Biology Focus", duration: "6 mins", title: "NEET Human Physiology Masterclass", desc: "10 NCERT-based biology questions covering circulation, nervous coordination, and endocrine glands.", points: "+70 Streak Points" },
      { category: "NEET Chemistry Focus", duration: "8 mins", title: "NEET Organic Chemistry mechanisms", desc: "10 questions covering electrophilic substitutions, stability orders, and IUPAC naming rules.", points: "+80 Streak Points" }
    ],
    ssc: [
      { category: "SSC CGL / Banking", duration: "5 mins", title: "SSC Quantitative Aptitude Speedrun", desc: "10 rapid-fire questions covering profit/loss, simple interest, speed/time, and ratio bounds.", points: "+60 Streak Points" },
      { category: "SSC General Awareness", duration: "4 mins", title: "SSC History & Polity Daily Quiz", desc: "10 questions covering constitutional articles, Mughal administration, and freedom struggles.", points: "+50 Streak Points" }
    ],
    upsc: [
      { category: "UPSC Civil Services", duration: "7 mins", title: "UPSC General Studies: Indian Polity", desc: "10 comprehensive questions covering federal structures, judicial review, and local panchayats.", points: "+80 Streak Points" },
      { category: "UPSC Current Affairs", duration: "5 mins", title: "UPSC Daily Editorial Analysis quiz", desc: "10 questions covering active global summits, bilateral treaties, and national economic indicators.", points: "+60 Streak Points" }
    ],
    general: [
      { category: "General Studies", duration: "5 mins", title: "Daily Current Affairs & General Awareness", desc: "10 questions covering latest updates, global summits, national policies, and sports events.", points: "+50 Streak Points" },
      { category: "CUET General Test", duration: "8 mins", title: "CUET Language & Reasoning Practice", desc: "10 conceptual questions covering verbal analogies, sequence completions, and logical reasoning.", points: "+60 Streak Points" }
    ]
  };

  const activeQuizzes = dailyQuizzes[track] ?? dailyQuizzes.general;

  // State
  const [streakDays] = useState([true, true, true, true, true, false, false]); // Mon-Sun checkmarks
  const [battleState, setBattleState] = useState<"idle" | "matchmaking" | "active" | "finished">("idle");
  const [battleTimer, setBattleTimer] = useState(60);
  const [battleScoreSelf, setBattleScoreSelf] = useState(0);
  const [battleScoreOpp, setBattleScoreOpp] = useState(0);
  const [battleQuestionIdx, setBattleQuestionIdx] = useState(0);
  const [selectedMateName, setSelectedMateName] = useState("");

  const [batchmates, setBatchmates] = useState<(Student & { online: boolean })[]>([]);
  const [onlineKeys, setOnlineKeys] = useState<string[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<{
    battleId: string;
    challengerId: string;
    challengerName: string;
    topic: string;
  } | null>(null);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);
  const [activeOpponentId, setActiveOpponentId] = useState<string | null>(null);

  const activeBattleIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeBattleIdRef.current = activeBattleId;
  }, [activeBattleId]);

  const [quizQuestions, setQuizQuestions] = useState<{ q: string; opts: string[]; ans: number }[]>([
    { q: "Which Indian state shares the longest border with Bhutan?", opts: ["Assam", "Arunachal Pradesh", "Sikkim", "West Bengal"], ans: 0 },
    { q: "In physics, what is the dimension of Planck's constant?", opts: ["[ML²T⁻¹]", "[MLT⁻¹]", "[ML²T⁻²]", "[MLT⁻²]"], ans: 0 },
    { q: "Who is the current chairperson of NITI Aayog?", opts: ["Narendra Modi", "Suman Bery", "Amitabh Kant", "Rajiv Kumar"], ans: 0 },
  ]);

  const TOPIC_QUESTIONS: Record<string, { q: string; opts: string[]; ans: number }[]> = {
    jee: [
      { q: "What is the work done by a conservative force along a closed path?", opts: ["Zero", "Positive", "Negative", "Depends on path"], ans: 0 },
      { q: "In JEE physics, what is the electric field inside a hollow spherical conductor?", opts: ["Infinite", "Zero", "kQ/r²", "kQ/R"], ans: 1 },
      { q: "If A and B are symmetric matrices of same order, then AB - BA is:", opts: ["Symmetric", "Skew-symmetric", "Zero matrix", "Identity matrix"], ans: 1 },
    ],
    neet: [
      { q: "Which hormone is responsible for the flight-or-fight response?", opts: ["Thyroxine", "Insulin", "Adrenaline", "Estrogen"], ans: 2 },
      { q: "The process of double fertilization is characteristic of:", opts: ["Gymnosperms", "Angiosperms", "Pteridophytes", "Bryophytes"], ans: 1 },
      { q: "Which organelle is known as the powerhouse of the cell?", opts: ["Lysosome", "Mitochondria", "Golgi apparatus", "Ribosome"], ans: 1 },
    ],
    ssc: [
      { q: "Who was the first female governor of an Indian state?", opts: ["Sarojini Naidu", "Sucheta Kripalani", "Indira Gandhi", "Pratibha Patil"], ans: 0 },
      { q: "Which article of the Indian Constitution deals with the Right to Equality?", opts: ["Article 21", "Article 19", "Article 14", "Article 32"], ans: 2 },
      { q: "What is the speed of sound in air at 0 degrees Celsius?", opts: ["332 m/s", "340 m/s", "1500 m/s", "300,000 km/s"], ans: 0 },
    ],
    upsc: [
      { q: "Consider the Ryotwari System: who introduced it first?", opts: ["Thomas Munro", "Lord Cornwallis", "Warren Hastings", "Holt Mackenzie"], ans: 0 },
      { q: "Which schedule of the Indian Constitution lists the official languages?", opts: ["Seventh Schedule", "Eighth Schedule", "Ninth Schedule", "Tenth Schedule"], ans: 1 },
      { q: "The term 'M-STrIPES' is sometimes seen in the news in context of:", opts: ["Tiger reserves", "Indigenous satellites", "Bio-remediation", "Cyber security"], ans: 0 },
    ],
    general: [
      { q: "Which Indian state shares the longest border with Bhutan?", opts: ["Assam", "Arunachal Pradesh", "Sikkim", "West Bengal"], ans: 0 },
      { q: "In physics, what is the dimension of Planck's constant?", opts: ["[ML²T⁻¹]", "[MLT⁻¹]", "[ML²T⁻²]", "[MLT⁻²]"], ans: 0 },
      { q: "Who is the current chairperson of NITI Aayog?", opts: ["Narendra Modi", "Suman Bery", "Amitabh Kant", "Rajiv Kumar"], ans: 0 },
    ]
  };

  // 1. Fetch Classmate student profiles in Batch
  useEffect(() => {
    if (!student?.batchId) return;
    getStudentsByBatch(student.batchId).then((res) => {
      const others = res.filter((s) => s.id !== student.id);
      setBatchmates(others.map((s) => ({ ...s, online: false })));
    });
  }, [student?.batchId, student?.id]);

  // 2. Subscribe to Presence state & Challenge broadcast handshakes
  useEffect(() => {
    if (!student?.batchId || !student?.id) return;
    const supabase = getSupabaseBrowserClient();
    const cohortChannel = supabase.channel(`presence:cohort:${student.batchId}`, {
      config: { presence: { key: student.id } }
    });

    cohortChannel
      .on("presence", { event: "sync" }, () => {
        const presenceState = cohortChannel.presenceState();
        const keys = Object.keys(presenceState);
        setOnlineKeys(keys);
      })
      .on("broadcast", { event: "challenge_invite" }, ({ payload }) => {
        if (payload.opponentId === student.id) {
          setIncomingChallenge({
            battleId: payload.battleId,
            challengerId: payload.challengerId,
            challengerName: payload.challengerName,
            topic: payload.topic,
          });
        }
      })
      .on("broadcast", { event: "challenge_accepted" }, ({ payload }) => {
        if (payload.challengerId === student.id && payload.battleId === activeBattleIdRef.current) {
          setBattleState("active");
          setBattleTimer(60);
          setBattleScoreSelf(0);
          setBattleScoreOpp(0);
          setBattleQuestionIdx(0);
          setSelectedMateName(payload.opponentName);
        }
      })
      .on("broadcast", { event: "challenge_declined" }, ({ payload }) => {
        if (payload.challengerId === student.id && payload.battleId === activeBattleIdRef.current) {
          toast.error("Challenge declined by classmate.");
          setBattleState("idle");
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await cohortChannel.track({
            name: student.name,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      cohortChannel.unsubscribe();
    };
  }, [student?.batchId, student?.id]);

  // 3. Map online state from presence tracker to batchmate lists
  const currentBatchmates = batchmates.map((mate) => ({
    ...mate,
    online: onlineKeys.includes(mate.id),
  }));

  // 4. Synchronization loop inside active battle
  useEffect(() => {
    if (battleState !== "active" || !activeBattleId) return;
    const supabase = getSupabaseBrowserClient();
    const gameChannel = supabase.channel(`battle:${activeBattleId}`);

    gameChannel
      .on("broadcast", { event: "score_update" }, ({ payload }) => {
        if (payload.playerId !== student?.id) {
          setBattleScoreOpp(payload.score);
        }
      })
      .subscribe();

    return () => {
      gameChannel.unsubscribe();
    };
  }, [battleState, activeBattleId, student?.id]);

  // 5. Active Battle Timer tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (battleState === "active" && battleTimer > 0) {
      timer = setInterval(() => {
        setBattleTimer(prev => {
          if (prev <= 1) {
            setBattleState("finished");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [battleState, battleTimer]);

  // 6. Matchmaking timeout -> Ghost match fallback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (battleState === "matchmaking") {
      timer = setTimeout(() => {
        toast.info("Classmate is busy. Engaging simulated battle run!");
        setBattleState("active");
        setBattleTimer(60);
        setBattleScoreSelf(0);
        setBattleScoreOpp(0);
        setBattleQuestionIdx(0);
        setActiveBattleId(null); // Triggers local ghost score updates
      }, 7000);
    }
    return () => clearTimeout(timer);
  }, [battleState]);

  // 7. Simulated ghost opponent score updates
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (battleState === "active" && battleTimer > 0 && !activeBattleId) {
      timer = setInterval(() => {
        if (Math.random() > 0.72 && battleScoreOpp < 30) {
          setBattleScoreOpp((o) => o + 10);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [battleState, battleTimer, activeBattleId, battleScoreOpp]);

  // Challenger triggers Battle invite
  async function startBattle(opponentId: string, opponentName: string) {
    if (!student || !student.batchId) return;
    setSelectedMateName(opponentName);
    setBattleState("matchmaking");
    setActiveOpponentId(opponentId);

    try {
      const questionsList = TOPIC_QUESTIONS[track] ?? TOPIC_QUESTIONS.general;
      setQuizQuestions(questionsList);

      const session = await createBattleSession({
        cohortId: student.batchId,
        topic: track === "jee" ? "JEE Calculus & Limits" : "UPSC Civil Services GS",
        player1Id: student.id,
        questions: questionsList,
      });

      setActiveBattleId(session.id);

      // Broadcast invite to opponent
      const supabase = getSupabaseBrowserClient();
      const cohortChannel = supabase.channel(`presence:cohort:${student.batchId}`);
      cohortChannel.send({
        type: "broadcast",
        event: "challenge_invite",
        payload: {
          battleId: session.id,
          challengerId: student.id,
          challengerName: student.name,
          opponentId,
          topic: session.topic,
        }
      });
    } catch {
      toast.error("Failed to initialize battle.");
      setBattleState("idle");
    }
  }

  // Opponent accepts battle invitation
  async function handleAcceptChallenge() {
    if (!incomingChallenge || !student) return;
    try {
      const session = await joinBattleSession(incomingChallenge.battleId, student.id);
      setActiveBattleId(session.id);
      setQuizQuestions(session.questions);
      setIncomingChallenge(null);
      setSelectedMateName(incomingChallenge.challengerName);
      setBattleState("active");
      setBattleTimer(60);
      setBattleScoreSelf(0);
      setBattleScoreOpp(0);
      setBattleQuestionIdx(0);

      // Broadcast acceptance back to challenger
      const supabase = getSupabaseBrowserClient();
      const cohortChannel = supabase.channel(`presence:cohort:${student.batchId}`);
      cohortChannel.send({
        type: "broadcast",
        event: "challenge_accepted",
        payload: {
          battleId: session.id,
          challengerId: incomingChallenge.challengerId,
          opponentId: student.id,
          opponentName: student.name,
        }
      });
    } catch {
      toast.error("Failed to join battle session.");
      setIncomingChallenge(null);
    }
  }

  // Opponent declines invitation
  function handleDeclineChallenge() {
    if (!incomingChallenge || !student) return;
    const supabase = getSupabaseBrowserClient();
    const cohortChannel = supabase.channel(`presence:cohort:${student.batchId}`);
    cohortChannel.send({
      type: "broadcast",
      event: "challenge_declined",
      payload: {
        battleId: incomingChallenge.battleId,
        challengerId: incomingChallenge.challengerId,
      }
    });
    setIncomingChallenge(null);
  }

  // Challenger cancels matchmaking
  function handleCancelChallenge() {
    if (activeBattleId && student) {
      const supabase = getSupabaseBrowserClient();
      const cohortChannel = supabase.channel(`presence:cohort:${student.batchId}`);
      cohortChannel.send({
        type: "broadcast",
        event: "challenge_declined",
        payload: {
          battleId: activeBattleId,
          challengerId: student.id,
        }
      });
    }
    setBattleState("idle");
    setActiveBattleId(null);
    setActiveOpponentId(null);
  }

  // Create WhatsApp Invite Share Link
  async function handleCreateShareLink() {
    if (!student || !student.batchId) return;
    try {
      const questionsList = TOPIC_QUESTIONS[track] ?? TOPIC_QUESTIONS.general;
      setQuizQuestions(questionsList);

      const session = await createBattleSession({
        cohortId: student.batchId,
        topic: track === "jee" ? "JEE Calculus & Limits" : "UPSC Civil Services GS",
        player1Id: student.id,
        questions: questionsList,
      });

      const inviteUrl = `${window.location.origin}/student/arena?action=battle&lobbyId=${session.id}`;
      await navigator.clipboard.writeText(inviteUrl);

      const text = `🔥 Challenge me to a 1v1 ${session.topic} Quiz Battle on Facultify! Click this link to play: ${inviteUrl}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");

      toast.success("Challenge link copied to clipboard and WhatsApp opened!");

      setSelectedMateName("Classmate via Link");
      setBattleState("matchmaking");
      setActiveBattleId(session.id);
    } catch {
      toast.error("Failed to create invite link.");
    }
  }

  // Listen for WhatsApp Invite URL triggers
  useEffect(() => {
    if (!student || !student.batchId) return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const lobbyId = params.get("lobbyId");

    if (action === "battle" && lobbyId) {
      window.history.replaceState({}, document.title, window.location.pathname);

      getBattleSession(lobbyId).then(async (session) => {
        if (!session) {
          toast.error("Lobby session not found or expired.");
          return;
        }
        if (session.cohortId !== student.batchId) {
          toast.error("You are not enrolled in the cohort matching this challenge.");
          return;
        }
        if (session.status !== "waiting") {
          toast.error("This quiz battle has already started or completed.");
          return;
        }

        try {
          const updated = await joinBattleSession(lobbyId, student.id);
          setActiveBattleId(updated.id);
          setQuizQuestions(updated.questions);
          setBattleState("active");
          setBattleTimer(60);
          setBattleScoreSelf(0);
          setBattleScoreOpp(0);
          setBattleQuestionIdx(0);
          setSelectedMateName("Classmate");

          // Broadcast accept event back to challenger
          const supabase = getSupabaseBrowserClient();
          const cohortChannel = supabase.channel(`presence:cohort:${student.batchId}`);
          cohortChannel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              cohortChannel.send({
                type: "broadcast",
                event: "challenge_accepted",
                payload: {
                  battleId: updated.id,
                  challengerId: updated.player1Id,
                  opponentId: student.id,
                  opponentName: student.name,
                }
              });
            }
          });
        } catch {
          toast.error("Failed to join battle lobby.");
        }
      });
    }
  }, [student?.batchId, student?.id]);

  // Submit Answer telemetry
  function handleSelectAnswer(isCorrect: boolean) {
    const nextScore = battleScoreSelf + (isCorrect ? 10 : 0);
    setBattleScoreSelf(nextScore);

    // Save battle log entry to DB
    if (activeBattleId && student) {
      addBattleLog({
        battleId: activeBattleId,
        playerId: student.id,
        questionIndex: battleQuestionIdx,
        isCorrect,
      }).catch(console.error);

      // Broadcast score to opponent
      const supabase = getSupabaseBrowserClient();
      const gameChannel = supabase.channel(`battle:${activeBattleId}`);
      gameChannel.send({
        type: "broadcast",
        event: "score_update",
        payload: {
          playerId: student.id,
          score: nextScore,
        }
      });
    }

    if (battleQuestionIdx < quizQuestions.length - 1) {
      setBattleQuestionIdx(i => i + 1);
    } else {
      setBattleState("finished");
    }
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <PageHeader 
        title="Daily Arena" 
        subtitle="Challenge your classmates, clear your streaks, and conquer the leaderboard."
      />

      {/* Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="bg-slate-100 rounded-full p-1 border border-gray-205 w-fit mb-6">
          <TabsTrigger value="daily" className="rounded-full px-6 py-2 font-bold data-[state=active]:bg-[#3B6FFF] data-[state=active]:text-white">
            Daily Streak & Quizzes
          </TabsTrigger>
          <TabsTrigger value="battle" className="rounded-full px-6 py-2 font-bold data-[state=active]:bg-[#3B6FFF] data-[state=active]:text-white">
            1v1 Quiz Battles
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Daily Streak & Quizzes */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Streak & Active Cards */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              {/* Daily Streak Banner */}
              <Card className="rounded-[2rem] border border-orange-100 bg-gradient-to-r from-orange-50/60 via-amber-50/20 to-white shadow-[0_12px_30px_rgba(249,115,22,0.04)] overflow-hidden relative">
                <div className="absolute right-6 top-6 animate-pulse shrink-0">
                  <Zap className="w-20 h-20 text-orange-500 opacity-20" />
                </div>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-orange-600">
                        Active Streak
                      </span>
                      <h2 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                        🔥 5 Days Consistent!
                      </h2>
                      <p className="text-sm text-slate-500 font-medium">
                        Complete today&apos;s daily quiz to lock in day 6 and keep your multiplier!
                      </p>
                    </div>
                    {/* Weekly tracker */}
                    <div className="flex gap-2">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1.5">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                            streakDays[idx]
                              ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/25"
                              : idx === 5
                              ? "bg-orange-100/60 border-orange-200 text-orange-600 border-dashed animate-pulse font-extrabold"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}>
                            {streakDays[idx] ? <Check className="w-4 h-4" /> : day}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Daily Quizzes */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900">Today&apos;s Daily Challenges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeQuizzes.map((quiz, qidx) => (
                    <Card key={qidx} className="rounded-3xl border border-gray-200/60 p-6 bg-white hover:border-[#3B6FFF]/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[220px]">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold bg-blue-50 text-[#3B6FFF] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {quiz.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                            <Clock className="w-3.5 h-3.5" /> {quiz.duration}
                          </span>
                        </div>
                        <h4 className="text-lg font-extrabold text-slate-950">{quiz.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {quiz.desc}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs font-bold text-[#3B6FFF]">{quiz.points}</span>
                        <Button size="sm" className="rounded-full bg-[#3B6FFF] hover:bg-[#3B6FFF]/90 font-bold px-4">
                          <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Play Quiz
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboard Panel */}
            <Card className="col-span-1 rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-slate-900 text-lg">Batch Leaderboard</h3>
                </div>
                <span className="text-xs font-bold text-[#3B6FFF] hover:underline cursor-pointer">Week 2</span>
              </div>
              <div className="space-y-4">
                {LEADERBOARD.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    item.rank === 3 
                      ? "bg-[#3B6FFF]/5 border-[#3B6FFF]/20 scale-[1.02] shadow-sm" 
                      : "border-transparent hover:bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        item.rank === 1 ? "bg-amber-100 text-amber-700" :
                        item.rank === 2 ? "bg-slate-100 text-slate-700" :
                        item.rank === 3 ? "bg-[#3B6FFF] text-white" :
                        "text-slate-400"
                      }`}>
                        {item.rank}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {item.name}
                          {item.rank === 3 && (
                            <span className="text-[10px] bg-[#3B6FFF] text-white px-1.5 py-0.5 rounded-full font-bold">You</span>
                          )}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400">🔥 {item.streak} days streak</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{item.score} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: 1v1 Quiz Battles */}
        <TabsContent value="battle" className="space-y-6">
          {battleState === "idle" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Challenge layout */}
              <div className="col-span-1 lg:col-span-2 space-y-6">
                <Card className="rounded-[2rem] border border-slate-900 bg-slate-950 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none bg-gradient-to-r from-blue-500 to-purple-600" />
                  <div className="relative z-10 flex-1 space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] bg-blue-600/30 text-blue-400 w-fit">
                      1v1 Battle Arena
                    </span>
                    <h2 className="text-2xl font-black leading-tight">Challenge a Batchmate instantly</h2>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-lg">
                      Challenge any online student in your batch to a 60-second quiz battle. 10 rapid-fire questions, real-time leaderboard update! Perfect for hostel study nights.
                    </p>
                    <div className="pt-2">
                      <Button onClick={handleCreateShareLink} className="rounded-full bg-[#3B6FFF] hover:bg-blue-600 font-bold text-xs py-2 px-5 shadow-lg shadow-blue-500/10 z-10 relative">
                        Create Invite Link
                      </Button>
                    </div>
                  </div>
                  <div className="relative z-10 shrink-0 w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sword className="w-12 h-12 text-[#3B6FFF] animate-bounce" />
                  </div>
                </Card>

                {/* Matchmaking online board */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">Online Batchmates</h3>
                    <div className="relative w-48">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <Input placeholder="Search classmate..." className="pl-8 h-8 text-xs rounded-full border-gray-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentBatchmates.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-slate-400 font-medium text-xs border border-dashed border-gray-100 rounded-3xl">
                        No batchmates found in this cohort.
                      </div>
                    ) : (
                      currentBatchmates.map((mate) => (
                        <Card key={mate.id} className="rounded-3xl border border-gray-200/60 p-4 bg-white hover:border-[#3B6FFF]/30 transition-all duration-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                                {mate.name[0]}
                              </div>
                              {mate.online && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-950">{mate.name}</p>
                              <p className="text-[10px] font-semibold text-slate-400">Roll No: {mate.rollNumber}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant={mate.online ? "default" : "outline"}
                            disabled={!mate.online}
                            onClick={() => startBattle(mate.id, mate.name)}
                            className="rounded-full font-bold text-xs"
                          >
                            <Sword className="w-3.5 h-3.5 mr-1" /> Challenge
                          </Button>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Arena Info Rules */}
              <Card className="col-span-1 rounded-[2rem] border border-gray-200/60 p-6 bg-white space-y-4">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#3B6FFF]" />
                  Battle Rules
                </h3>
                <div className="space-y-3.5 text-slate-600 font-medium text-xs leading-relaxed">
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#3B6FFF] font-bold flex items-center justify-center shrink-0">1</span>
                    <p>Challenge is sent to the classmate. Once accepted, the battle commences.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#3B6FFF] font-bold flex items-center justify-center shrink-0">2</span>
                    <p>10 rapid-fire questions covering the batch core syllabus.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#3B6FFF] font-bold flex items-center justify-center shrink-0">3</span>
                    <p>60 seconds total time. Speed matters — correct answers earn bonus multipliers.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#3B6FFF] font-bold flex items-center justify-center shrink-0">4</span>
                    <p>Winner gets +100 Rank Points, loser drops -50 Rank Points.</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Matchmaking Screen Simulation */}
          {battleState === "matchmaking" && (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-[#3B6FFF] border-t-transparent animate-spin flex items-center justify-center" />
                <Sword className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#3B6FFF] animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Setting up Battle...</h3>
                <p className="text-sm text-slate-500 font-medium">Waiting for {selectedMateName} to accept your challenge.</p>
              </div>
              <Button variant="outline" onClick={handleCancelChallenge} className="rounded-full border-gray-200">
                Cancel Challenge
              </Button>
            </div>
          )}

          {/* Active Battle Screen Simulation */}
          {battleState === "active" && (
            <Card className="rounded-[2.5rem] border border-gray-200 p-6 md:p-8 bg-white max-w-3xl mx-auto shadow-2xl space-y-6">
              {/* Battle Header scoreboard */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    Me
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{studentName}</p>
                    <p className="text-xs font-bold text-blue-600">{battleScoreSelf} pts</p>
                  </div>
                </div>

                <div className="text-center bg-red-50 border border-red-100 px-4 py-2 rounded-2xl shrink-0">
                  <p className="text-xs font-extrabold text-red-500 uppercase tracking-widest leading-none">Time Left</p>
                  <p className="text-2xl font-black text-red-600 tabular-nums mt-1">{battleTimer}s</p>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-sm font-black text-slate-900">{selectedMateName}</p>
                    <p className="text-xs font-bold text-red-500">{battleScoreOpp} pts</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">
                    {selectedMateName[0]}
                  </div>
                </div>
              </div>

              {/* Quiz Body */}
              <div className="space-y-6 py-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#3B6FFF]">Question {battleQuestionIdx + 1} of {quizQuestions.length}</span>
                  <h3 className="text-xl font-black text-slate-900 leading-snug">
                    {quizQuestions[battleQuestionIdx].q}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quizQuestions[battleQuestionIdx].opts.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx === quizQuestions[battleQuestionIdx].ans)}
                      className="text-left p-4 rounded-2xl border border-gray-200 hover:border-[#3B6FFF] hover:bg-blue-50/20 hover:text-slate-950 transition-all font-bold text-sm text-slate-700 hover:scale-[1.01]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Finished Battle Simulation */}
          {battleState === "finished" && (
            <Card className="rounded-[2.5rem] border border-gray-205 p-8 bg-white max-w-lg mx-auto shadow-2xl text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-yellow-600 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-950">
                  {battleScoreSelf >= battleScoreOpp ? "👑 Victory!" : "💔 Defeat"}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {battleScoreSelf >= battleScoreOpp 
                    ? `Great job! You defeated ${selectedMateName} in this match.` 
                    : `You lost to ${selectedMateName} by ${battleScoreOpp - battleScoreSelf} points.`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-8 py-2 bg-slate-50 border border-slate-100 rounded-3xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">My Score</p>
                  <p className="text-2xl font-black text-slate-800">{battleScoreSelf} pts</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Their Score</p>
                  <p className="text-2xl font-black text-slate-800">{battleScoreOpp} pts</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setBattleState("matchmaking")} className="flex-1 rounded-full font-bold">
                  Rematch
                </Button>
                <Button variant="outline" onClick={() => setBattleState("idle")} className="flex-1 rounded-full border-gray-200">
                  Exit Arena
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Incoming Challenge Real-time Modal */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm animate-fade-in p-4">
          <Card className="w-full max-w-md rounded-[2.5rem] border border-orange-100 bg-gradient-to-b from-orange-50/20 via-white to-white p-6 md:p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Sword className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-orange-600">
                1v1 Battle Invitation
              </span>
              <h3 className="text-xl font-black text-slate-950">
                {incomingChallenge.challengerName} has challenged you!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Topic: <strong className="text-slate-900 font-extrabold">{incomingChallenge.topic}</strong>. Do you accept this challenge?
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAcceptChallenge} className="flex-1 rounded-full bg-orange-500 hover:bg-orange-600 font-bold py-3">
                Accept Challenge
              </Button>
              <Button variant="outline" onClick={handleDeclineChallenge} className="flex-1 rounded-full border-gray-200 py-3">
                Decline
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
