"use client";

import { useState } from "react";
import { 
  BookOpen, 
  Search, 
  Filter, 
  FileText, 
  Play, 
  ArrowRight, 
  Bookmark, 
  HelpCircle,
  CheckCircle,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import PageHeader from "@/components/dashboards/PageHeader";

// Mock PYQ Bank questions
const MOCK_PYQS = [
  {
    id: "1",
    exam: "JEE Main",
    year: "2024",
    shift: "Session 1, Shift 2",
    subject: "Mathematics",
    topic: "Calculus",
    difficulty: "hard",
    question: "Let f(x) = ∫(3x² + 2x) dx from 0 to sin(x). Find the value of f'(π/2).",
    answer: "3",
    options: ["1", "2", "3", "0"],
  },
  {
    id: "2",
    exam: "SSC CGL",
    year: "2023",
    shift: "Tier 1, Shift 1",
    subject: "Quantitative Aptitude",
    topic: "Profit & Loss",
    difficulty: "medium",
    question: "A dealer buys an article marked at Rs 20,000 with 20% and 5% successive discounts. He spends Rs 1,000 on repair and sells it for Rs 20,000. Find his profit percentage.",
    answer: "23.45%",
    options: ["20.5%", "23.45%", "25.0%", "21.2%"],
  },
  {
    id: "3",
    exam: "UPSC Prelims",
    year: "2022",
    shift: "Paper 1",
    subject: "General Studies",
    topic: "Modern Indian History",
    difficulty: "hard",
    question: "With reference to Indian history, who of the following were known as 'Kulah-Daran'?",
    answer: "Sayyids",
    options: ["Arab Merchants", "Qalandars", "Persian scholars", "Sayyids"],
  },
  {
    id: "4",
    exam: "JEE Main",
    year: "2023",
    shift: "Session 2, Shift 1",
    subject: "Physics",
    topic: "Electrostatics",
    difficulty: "medium",
    question: "A charge Q is distributed uniformly on a ring of radius R. The electric field at the center of the ring is:",
    answer: "Zero",
    options: ["Q / 4πε₀R²", "Q / 2πε₀R²", "Zero", "Infinite"],
  },
  {
    id: "5",
    exam: "SSC CGL",
    year: "2022",
    shift: "Tier 2, Shift 1",
    subject: "English Comprehension",
    topic: "Synonyms & Antonyms",
    difficulty: "easy",
    question: "Choose the synonym for the word 'Tenacious':",
    answer: "Persistent",
    options: ["Weak", "Persistent", "Flexible", "Unstable"],
  }
];

export default function StudentPyqBankPage() {
  const [examFilter, setExamFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [topicSearch, setTopicSearch] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [showAnswerId, setShowAnswerId] = useState<string | null>(null);

  // Filter logic
  const filteredPyqs = MOCK_PYQS.filter((q) => {
    if (examFilter !== "all" && q.exam !== examFilter) return false;
    if (yearFilter !== "all" && q.year !== yearFilter) return false;
    if (topicSearch && !q.topic.toLowerCase().includes(topicSearch.toLowerCase()) && !q.subject.toLowerCase().includes(topicSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <PageHeader 
        title="Previous Year Question (PYQ) Bank" 
        subtitle="Access official solved previous year papers tagged by exam, shift, year, and subject."
      />

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search topics (e.g. Calculus, History)..." 
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-gray-200 text-sm"
          />
        </div>

        {/* Exam Select */}
        <div>
          <Select value={examFilter} onValueChange={setExamFilter}>
            <SelectTrigger className="rounded-xl h-10 border-gray-200">
              <SelectValue placeholder="Select Exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              <SelectItem value="JEE Main">JEE Main</SelectItem>
              <SelectItem value="SSC CGL">SSC CGL</SelectItem>
              <SelectItem value="UPSC Prelims">UPSC Prelims</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year Select */}
        <div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="rounded-xl h-10 border-gray-200">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Grid: PYQ List + Generator card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* PYQ List */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-black text-slate-900">
              Showing {filteredPyqs.length} PYQ Questions
            </h3>
            <span className="text-xs font-bold text-[#3B6FFF] bg-blue-50 px-2.5 py-0.5 rounded-full">
              Official Shift Keys Included
            </span>
          </div>

          <div className="space-y-4">
            {filteredPyqs.map((q) => (
              <Card key={q.id} className="rounded-3xl border border-gray-200/60 p-5 bg-white space-y-4 hover:border-[#3B6FFF]/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                      {q.exam} {q.year}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-500">{q.shift}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-bold text-[#3B6FFF] inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {q.topic}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-[#3B6FFF]">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm font-semibold leading-relaxed text-slate-800">
                  {q.question}
                </p>

                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border text-xs font-bold ${
                        showAnswerId === q.id && opt === q.answer
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "border-gray-100 bg-gray-50/50 text-slate-600"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAnswerId(showAnswerId === q.id ? null : q.id)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900"
                  >
                    <HelpCircle className="w-4 h-4 mr-1.5" />
                    {showAnswerId === q.id ? "Hide Answer" : "Reveal Answer & Explanation"}
                  </Button>

                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    q.difficulty === "easy" ? "bg-green-50 text-green-600" :
                    q.difficulty === "medium" ? "bg-amber-50 text-amber-600" :
                    "bg-red-50 text-red-600"
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Practice Generator */}
        <Card className="col-span-1 rounded-[2rem] border border-gray-200/60 p-6 bg-white space-y-5">
          <div className="space-y-2">
            <h3 className="font-black text-slate-950 text-lg">Generate PYQ Test</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Create a real timed exam dynamically from past papers to test your accuracy under pressure.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Target Exam</label>
              <Select defaultValue="JEE Main">
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JEE Main">JEE Main (Mocks)</SelectItem>
                  <SelectItem value="SSC CGL">SSC CGL (Tier 1/2)</SelectItem>
                  <SelectItem value="UPSC Prelims">UPSC General Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Total Questions</label>
              <Select defaultValue="30">
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Questions (10 mins)</SelectItem>
                  <SelectItem value="30">30 Questions (25 mins)</SelectItem>
                  <SelectItem value="90">90 Questions (Full test)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full rounded-full bg-[#3B6FFF] hover:bg-blue-600 font-bold py-4">
              <Play className="w-4 h-4 mr-2 fill-current" /> Start Practice Test
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
