"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Save, AlertTriangle, Upload, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/dashboards/PageHeader";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { updateInstitution, uploadInstitutionLogo } from "@/lib/supabase-service";

export default function AdminSettingsPage() {
  const { activeSession, initSession } = useAppStore();
  const inst = activeSession?.role === "admin" ? activeSession.user : null;

  const [name, setName] = useState(inst?.name ?? "");
  const [domain, setDomain] = useState(inst?.domain ?? "");
  const [email, setEmail] = useState(inst?.adminEmail ?? "");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [reportLanguage, setReportLanguage] = useState("hindi");
  const [selectedTracks, setSelectedTracks] = useState<string[]>(
    inst?.examTracks ?? ["general"]
  );
  const [savingTracks, setSavingTracks] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  async function handleSaveTracks() {
    if (!inst) return;
    setSavingTracks(true);
    try {
      await updateInstitution(inst.id, { examTracks: selectedTracks as any[] });
      await initSession();
      toast.success("Academic prep tracks updated successfully!");
    } catch {
      toast.error("Failed to save prep tracks. Please try again.");
    } finally {
      setSavingTracks(false);
    }
  }

  function handleToggleTrack(track: string) {
    setSelectedTracks((prev) =>
      prev.includes(track)
        ? prev.filter((t) => t !== track)
        : [...prev, track]
    );
  }

  const [primaryColor, setPrimaryColor] = useState(inst?.primaryColor ?? "#3B6FFF");
  const [secondaryColor, setSecondaryColor] = useState(inst?.secondaryColor ?? "#7C3AED");
  const [logoUrl, setLogoUrl] = useState(inst?.logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !inst) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }
    setUploadingLogo(true);
    try {
      const updated = await uploadInstitutionLogo(inst.id, file);
      setLogoUrl(updated.logoUrl);
      await initSession();
      toast.success("Logo updated.");
    } catch {
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveDetails() {
    if (!inst) return;
    setSavingDetails(true);
    try {
      await updateInstitution(inst.id, { name, domain, adminEmail: email });
      await initSession();
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSaveBranding() {
    if (!inst) return;
    setSavingBranding(true);
    try {
      await updateInstitution(inst.id, { primaryColor, secondaryColor });
      await initSession();
      toast.success("Brand colors saved — used on shareable rank cards.");
    } catch {
      toast.error("Failed to save brand colors. Please try again.");
    } finally {
      setSavingBranding(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your institution settings" />

      <div className="max-w-2xl space-y-6">
        {/* Institution Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Institution Details</CardTitle>
            <CardDescription>Update your institution&apos;s public information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Institution Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Admin Contact Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleSaveDetails} disabled={savingDetails}>
              {savingDetails ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savingDetails ? "Saving…" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Academic Prep Tracks Offered */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic Prep Tracks Offered</CardTitle>
            <CardDescription>
              Toggle which exam tracks are active at your institution. This determines the syllabus categories available for cohorts, tests, and student dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "jee", label: "Joint Entrance Exam (JEE Mains/Adv)", desc: "Physics, Chemistry, Mathematics prep" },
                { id: "neet", label: "NEET Prep (Biology, Chemistry, Physics)", desc: "Medical entrance track" },
                { id: "ssc", label: "SSC CGL & Banking Examinations", desc: "Aptitude, reasoning, general awareness" },
                { id: "upsc", label: "UPSC Civil Services & IAS Prep", desc: "General studies, policy, boards essays" },
                { id: "cuet", label: "CUET (Undergraduate Entrance Exam)", desc: "Syllabus practice for university entry" },
                { id: "general", label: "General & School Board Exams", desc: "General subject assessments" }
              ].map((track) => {
                const isActive = selectedTracks.includes(track.id);
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleToggleTrack(track.id)}
                    className={cn(
                      "flex items-start text-left p-4 rounded-2xl border transition-all hover:scale-[1.01]",
                      isActive 
                        ? "border-[#3B6FFF]/35 bg-[#3B6FFF]/5 text-slate-900" 
                        : "border-gray-150 bg-white text-slate-600 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        isActive ? "bg-[#3B6FFF] border-[#3B6FFF] text-white" : "border-slate-300"
                      )}>
                        {isActive && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-black leading-snug">{track.label}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{track.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button onClick={handleSaveTracks} disabled={savingTracks}>
              {savingTracks ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savingTracks ? "Saving…" : "Save Prep Tracks"}
            </Button>
          </CardContent>
        </Card>

        {/* Branding — logo + colors used on shareable rank cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
            <CardDescription>
              Your logo and brand colors appear on shareable student rank cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Institution Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Institution logo"
                    width={56}
                    height={56}
                    className="rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-muted-foreground">
                    None
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploadingLogo ? "Uploading…" : "Upload Logo"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP — up to 2MB.</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-9 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-9 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveBranding} disabled={savingBranding}>
              {savingBranding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {savingBranding ? "Saving…" : "Save Brand Colors"}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive alerts for important events</p>
              </div>
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Weekly Summary Report</p>
                <p className="text-xs text-muted-foreground">Get a weekly digest of institution activity</p>
              </div>
              <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Parent Trust Reports (Trojan Horse lever) */}
        <Card className="border-green-100/80">
          <CardHeader>
            <CardTitle className="text-base text-green-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              WhatsApp Parent Trust Reports
            </CardTitle>
            <CardDescription>
              Auto-dispatch scorecard, attendance metrics, and learning gap checklists directly to parents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Auto WhatsApp Dispatches</p>
                <p className="text-xs text-slate-400 font-semibold">Sends immediately when results are declared</p>
              </div>
              <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
            </div>

            <Separator />

            {/* Language & Template */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Report Language</Label>
                <Select value={reportLanguage} onValueChange={setReportLanguage}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hindi">Hindi (हिंदी)</SelectItem>
                    <SelectItem value="english">English (Global)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Report Template</Label>
                <Select defaultValue="detailed">
                  <SelectTrigger className="rounded-xl h-10 border-slate-200">
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Scorecard</SelectItem>
                    <SelectItem value="detailed">Scorecard + Weak Topics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Premium WhatsApp Smartphone Mockup Preview */}
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live Dispatch Preview</Label>
              <div className="mx-auto max-w-[280px] rounded-[2rem] border-[6px] border-slate-800 bg-slate-900 overflow-hidden shadow-lg aspect-[9/16] relative flex flex-col">
                {/* Smartphone Notch / Top Speaker */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center" />

                {/* WhatsApp Chat Header */}
                <div className="bg-[#075E54] text-white pt-5 pb-2 px-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-800 flex items-center justify-center font-bold text-xs">
                      F
                    </div>
                    <div>
                      <p className="text-[10px] font-bold leading-tight">Facultify Reports</p>
                      <p className="text-[8px] text-teal-100 font-medium">online</p>
                    </div>
                  </div>
                  <span className="text-[8px] bg-teal-600/50 px-1.5 py-0.5 rounded-full font-bold">Official</span>
                </div>

                {/* Chat Message Box */}
                <div className="flex-1 bg-[#ECE5DD] p-3 overflow-y-auto space-y-4 relative flex flex-col justify-end min-h-[220px]">
                  {/* WhatsApp Message Bubble */}
                  <div className="relative bg-white text-slate-800 p-2.5 rounded-xl shadow-sm text-[10px] font-medium max-w-[90%] self-start border border-gray-100 space-y-1.5">
                    {/* Tail indicator */}
                    <div className="absolute top-2 -left-1 w-2 h-2 bg-white rotate-45 border-l border-b border-gray-100" />
                    
                    {reportLanguage === "hindi" ? (
                      <>
                        <p className="font-extrabold text-[#075E54]">प्रिय अभिभावक,</p>
                        <p className="leading-relaxed font-semibold">
                          राहुल ने आज के <strong>JEE Advanced Mock 4</strong> में भाग लिया है।
                        </p>
                        <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-lg space-y-0.5 font-bold">
                          <p>📊 <strong>अंक:</strong> 245 / 300</p>
                          <p>🏆 <strong>AIR रैंक:</strong> #482 (96.24%)</p>
                          <p>📅 <strong>उपस्थिति:</strong> 100%</p>
                        </div>
                        <p className="leading-relaxed font-semibold">
                          ⚠️ <strong>कमजोर विषय:</strong> Integration bounds, Electrostatic flux.
                        </p>
                        <p className="text-[8px] text-[#075E54] font-bold">
                          — Facultify AI Learning Portal
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-extrabold text-[#075E54]">Dear Parent,</p>
                        <p className="leading-relaxed font-semibold">
                          Rahul has successfully completed today&apos;s <strong>JEE Advanced Mock 4</strong>.
                        </p>
                        <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-lg space-y-0.5 font-bold">
                          <p>📊 <strong>Score:</strong> 245 / 300</p>
                          <p>🏆 <strong>AIR Rank:</strong> #482 (96.24%)</p>
                          <p>📅 <strong>Attendance:</strong> 100%</p>
                        </div>
                        <p className="leading-relaxed font-semibold">
                          ⚠️ <strong>Weak Topics:</strong> Integration bounds, Electrostatic flux.
                        </p>
                        <p className="text-[8px] text-[#075E54] font-bold">
                          — Powered by Facultify Portal
                        </p>
                      </>
                    )}
                    
                    <span className="block text-right text-[8px] text-slate-400 font-bold mt-0.5">10:37 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
              <div>
                <p className="text-sm font-medium text-red-800">Delete Institution</p>
                <p className="text-xs text-red-600">This will permanently delete all data. Cannot be undone.</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => toast.error("Please contact support to delete your institution.")}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
