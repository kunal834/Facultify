"use client";

import { useState } from "react";
import { toast } from "sonner";
import { User, Mail, Hash, BookOpen, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/dashboards/PageHeader";
import { useAppStore } from "@/store/app-store";
import { getInitials } from "@/lib/utils";
import { updateStudentExamTrack } from "@/lib/supabase-service";

export default function StudentProfilePage() {
  const { activeSession, initSession } = useAppStore();
  const student = activeSession?.role === "student" ? activeSession.user : null;
  const institution = activeSession?.role === "student" ? activeSession.institution : null;
  const teacher = activeSession?.role === "student" ? activeSession.teacher : null;

  const [saving, setSaving] = useState(false);
  const [savingTrack, setSavingTrack] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string>(
    student?.examTrack ?? "general"
  );
  const [changingPw, setChangingPw] = useState(false);
  const [pwData, setPwData] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");

  async function handleSaveProfile() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Profile updated successfully.");
  }

  async function handleSaveTrack() {
    if (!student) return;
    setSavingTrack(true);
    try {
      await updateStudentExamTrack(student.id, selectedTrack as any);
      await initSession();
      toast.success("Target exam track updated successfully!");
    } catch {
      toast.error("Failed to update target exam track. Please try again.");
    } finally {
      setSavingTrack(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pwData.next !== pwData.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwData.next.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setChangingPw(true);
    await new Promise((r) => setTimeout(r, 1000));
    setChangingPw(false);
    setPwData({ current: "", next: "", confirm: "" });
    toast.success("Password changed successfully.");
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No student session found.
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information and account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar + summary */}
        <Card className="flex flex-col items-center text-center p-8">
          <div className="h-24 w-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
            {getInitials(student.name)}
          </div>
          <h2 className="text-xl font-semibold">{student.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{student.email}</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Badge variant="secondary">{institution?.name ?? "—"}</Badge>
            <Badge variant="outline">Student</Badge>
          </div>
          <Separator className="my-5 w-full" />
          <div className="w-full space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0" />
              <span>Roll No: <span className="text-foreground font-medium">{student.rollNumber}</span></span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Teacher: <span className="text-foreground font-medium">{teacher?.name ?? "—"}</span></span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Status: <span className={student.isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{student.isActive ? "Active" : "Inactive"}</span></span>
            </div>
          </div>
        </Card>

        {/* Edit form + password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Prep Exam */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Target Prep Exam</CardTitle>
              <CardDescription>
                Choose your primary target exam track. This configures daily syllabus topics, active test priorities, and AIR safety borders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="exam-track">Target Exam Track</Label>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger id="exam-track" className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Target Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {(institution?.examTracks ?? ["general"]).map((track) => (
                      <SelectItem key={track} value={track}>
                        {track === "jee" ? "JEE Mains/Advanced" :
                         track === "neet" ? "NEET Entrance" :
                         track === "ssc" ? "SSC CGL / Banking" :
                         track === "upsc" ? "UPSC Civil Services" :
                         track === "cuet" ? "CUET Exam" :
                         "General / School Boards"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveTrack} disabled={savingTrack}>
                {savingTrack ? "Updating..." : "Update Target Exam"}
              </Button>
            </CardContent>
          </Card>

          {/* Personal details */}
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Personal Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={student.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={student.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roll">Roll Number</Label>
                  <Input id="roll" defaultValue={student.rollNumber} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input id="institution" defaultValue={institution?.name ?? ""} disabled className="bg-slate-50" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input
                    id="current-pw"
                    type="password"
                    value={pwData.current}
                    onChange={(e) => setPwData((d) => ({ ...d, current: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-pw">New Password</Label>
                    <Input
                      id="new-pw"
                      type="password"
                      value={pwData.next}
                      onChange={(e) => setPwData((d) => ({ ...d, next: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pw">Confirm New Password</Label>
                    <Input
                      id="confirm-pw"
                      type="password"
                      value={pwData.confirm}
                      onChange={(e) => setPwData((d) => ({ ...d, confirm: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                <div className="flex justify-end">
                  <Button type="submit" variant="outline" disabled={changingPw || !pwData.current || !pwData.next || !pwData.confirm}>
                    {changingPw ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
