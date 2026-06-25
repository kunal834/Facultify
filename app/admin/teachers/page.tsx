"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/dashboards/PageHeader";
import EmptyState from "@/components/dashboards/EmptyState";
import { useAppStore } from "@/store/app-store";
import {
  getTeachers,
  inviteTeacher,
  removeTeacher,
  toggleTeacherStatus,
} from "@/lib/supabase-service";
import { getInitials, formatDate } from "@/lib/utils";
import type { Teacher } from "@/lib/types";

// ─── Skeleton row shown while data loads ─────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[160, 100, 60, 60, 90, 70, 40].map((w, i) => (
        <TableCell key={i}>
          <div
            className="h-4 rounded bg-muted animate-pulse"
            style={{ width: w }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
      Active
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-600 border-red-200 hover:bg-red-100">
      Inactive
    </Badge>
  );
}

// ─── Capacity indicator ───────────────────────────────────────────────────────

function CapacityPill({
  used,
  max,
}: {
  used: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((used / max) * 100) : 0;
  const color =
    pct >= 90
      ? "text-red-600 bg-red-50 border-red-200"
      : pct >= 70
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}
    >
      <Users className="h-3 w-3" />
      {used} / {max} teachers
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const { activeSession } = useAppStore();

  const institutionId =
    activeSession?.role === "admin" ? activeSession.user.id : "";
  const maxTeachers =
    activeSession?.role === "admin" ? activeSession.user.maxTeachers : 25;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "" });
  const [submitting, setSubmitting] = useState(false);

  // ── Load teachers on mount ────────────────────────────────────────────────

  useEffect(() => {
    getTeachers(institutionId).then((list) => {
      setTeachers(list);
      setLoading(false);
    });
  }, [institutionId]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  // ── Invite ────────────────────────────────────────────────────────────────

  async function handleInvite() {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim()) {
      toast.error("All fields are required.");
      return;
    }
    if (teachers.length >= maxTeachers) {
      toast.error(
        `Your plan allows a maximum of ${maxTeachers} teachers. Upgrade to add more.`
      );
      return;
    }
    setSubmitting(true);
    try {
      const created = await inviteTeacher(institutionId, {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
      });

      // Send the invite email via the server-side route (uses service role key)
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:         created.email,
          name:          created.name,
          institutionId,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.warning(`Teacher added but invite email failed: ${error}`);
      } else {
        toast.success(`Invite email sent to ${created.email}.`);
      }

      setTeachers((prev) => [...prev, created]);
      setInviteOpen(false);
      setForm({ name: "", email: "", subject: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Toggle status ─────────────────────────────────────────────────────────

  async function handleToggle(teacher: Teacher) {
    try {
      const updated = await toggleTeacherStatus(teacher.id);
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacher.id ? updated : t))
      );
      toast.success(
        `${teacher.name} ${updated.isActive ? "activated" : "deactivated"}.`
      );
    } catch {
      toast.error("Could not update teacher status.");
    }
  }

  // ── Remove ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeTeacher(deleteTarget.id);
      setTeachers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} has been removed.`);
    } catch {
      toast.error("Could not remove teacher.");
    } finally {
      setDeleteTarget(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <PageHeader
        title="Teacher Management"
        subtitle="Manage faculty access, subjects, and account status."
      >
        <CapacityPill used={teachers.length} max={maxTeachers} />
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Teacher
        </Button>
      </PageHeader>

      {/* Search bar */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by name, email or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search teachers"
        />
      </div>

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Tests</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </TableBody>
            </Table>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={
                search
                  ? "No teachers match your search"
                  : "No teachers yet"
              }
              description={
                search
                  ? "Try a different name, email, or subject."
                  : "Invite your first teacher to get started."
              }
              action={
                search
                  ? { label: "Clear search", onClick: () => setSearch("") }
                  : { label: "Invite Teacher", onClick: () => setInviteOpen(true) }
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Tests</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((teacher) => (
                  <TableRow key={teacher.id}>
                    {/* Avatar + Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                            {getInitials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Subject */}
                    <TableCell className="text-sm text-muted-foreground">
                      {teacher.subject}
                    </TableCell>

                    {/* Students */}
                    <TableCell className="text-center text-sm font-medium tabular-nums">
                      {teacher.studentCount}
                    </TableCell>

                    {/* Tests */}
                    <TableCell className="text-center text-sm font-medium tabular-nums">
                      {teacher.testCount}
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(teacher.joinedAt)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge active={teacher.isActive} />
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${teacher.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => handleToggle(teacher)}
                          >
                            {teacher.isActive ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2 text-amber-500" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(teacher)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Invite Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) setForm({ name: "", email: "", subject: "" });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a teacher</DialogTitle>
            <DialogDescription>
              An invitation link will be sent to the provided email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Full name</Label>
              <Input
                id="invite-name"
                placeholder="Dr. Ananya Sharma"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teacher@institution.edu"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-subject">Subject</Label>
              <Input
                id="invite-subject"
                placeholder="Mathematics"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) handleInvite();
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={submitting}>
              {submitting ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the teacher and revoke their access.
              All data associated with their account — batches, tests, and
              submissions — will be unlinked. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove teacher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
