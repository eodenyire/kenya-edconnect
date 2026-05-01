import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Bell, BellOff, Clock, BookOpen } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COLORS = [
  { value: "primary", className: "bg-primary/15 text-primary border-primary/30" },
  { value: "accent", className: "bg-accent/15 text-accent-foreground border-accent/30" },
  { value: "blue", className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300" },
  { value: "purple", className: "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300" },
  { value: "green", className: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-300" },
  { value: "orange", className: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300" },
];

type StudySession = {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  notes: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string | null;
  reminder_enabled: boolean | null;
};

const colorClass = (c?: string | null) =>
  COLORS.find((x) => x.value === c)?.className ?? COLORS[0].className;

const fmtTime = (t: string) => t.slice(0, 5);

export default function StudyPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"week" | "day">("week");
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const [form, setForm] = useState({
    subject: "",
    title: "",
    notes: "",
    day_of_week: new Date().getDay(),
    start_time: "16:00",
    end_time: "17:00",
    color: "primary",
    reminder_enabled: true,
  });

  const fetchSessions = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .order("day_of_week")
      .order("start_time");
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setSessions((data as StudySession[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  // Browser reminder scheduler — checks every 30s for sessions starting within the next minute
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const fired = new Set<string>();
    const tick = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const today = now.getDay();
      sessions
        .filter((s) => s.reminder_enabled && s.day_of_week === today)
        .forEach((s) => {
          const [h, m] = s.start_time.split(":").map(Number);
          const start = new Date();
          start.setHours(h, m, 0, 0);
          const diffMin = (start.getTime() - now.getTime()) / 60000;
          const key = `${s.id}-${now.toDateString()}`;
          if (diffMin > 0 && diffMin <= 5 && !fired.has(key)) {
            fired.add(key);
            new Notification(`Study reminder: ${s.title}`, {
              body: `${s.subject} starts at ${fmtTime(s.start_time)}`,
              icon: "/placeholder.svg",
            });
          }
        });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [sessions]);

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast({ title: "Not supported", description: "Browser notifications aren't available." });
      return;
    }
    const result = await Notification.requestPermission();
    setNotifyPermission(result);
    if (result === "granted") toast({ title: "Notifications enabled" });
  };

  const resetForm = () =>
    setForm({
      subject: "",
      title: "",
      notes: "",
      day_of_week: activeDay,
      start_time: "16:00",
      end_time: "17:00",
      color: "primary",
      reminder_enabled: true,
    });

  const handleCreate = async () => {
    if (!user) return;
    if (!form.subject || !form.title) {
      toast({ title: "Missing fields", description: "Subject and title are required.", variant: "destructive" });
      return;
    }
    if (form.end_time <= form.start_time) {
      toast({ title: "Invalid time", description: "End time must be after start time.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("study_sessions").insert({
      ...form,
      user_id: user.id,
    });
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Study block added" });
    setOpen(false);
    resetForm();
    fetchSessions();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("study_sessions").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleReminder = async (s: StudySession) => {
    const next = !s.reminder_enabled;
    const { error } = await supabase
      .from("study_sessions")
      .update({ reminder_enabled: next })
      .eq("id", s.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, reminder_enabled: next } : x)));
  };

  const byDay = useMemo(() => {
    const map: Record<number, StudySession[]> = {};
    DAYS.forEach((_, i) => (map[i] = []));
    sessions.forEach((s) => map[s.day_of_week].push(s));
    return map;
  }, [sessions]);

  const SessionCard = ({ s }: { s: StudySession }) => (
    <div className={`rounded-md border p-2 text-xs space-y-1 ${colorClass(s.color)}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="font-semibold leading-tight truncate">{s.title}</div>
        <button
          onClick={() => handleDelete(s.id)}
          className="opacity-60 hover:opacity-100 shrink-0"
          aria-label="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="opacity-80 truncate">{s.subject}</div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 opacity-80">
          <Clock className="h-3 w-3" /> {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
        </span>
        <button onClick={() => toggleReminder(s)} aria-label="Toggle reminder">
          {s.reminder_enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3 opacity-50" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" /> Study Planner
          </h1>
          <p className="text-muted-foreground mt-1">Plan weekly study blocks by subject</p>
        </div>
        <div className="flex gap-2">
          {notifyPermission !== "granted" && (
            <Button variant="outline" onClick={requestNotifications}>
              <Bell className="h-4 w-4 mr-2" /> Enable reminders
            </Button>
          )}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New block
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New study block</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Subject</Label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" />
                  </div>
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Algebra revision" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Day</Label>
                    <Select value={String(form.day_of_week)} onValueChange={(v) => setForm({ ...form, day_of_week: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => (
                          <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Start</Label>
                    <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>End</Label>
                    <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm({ ...form, color: c.value })}
                        className={`h-8 w-8 rounded-md border-2 ${c.className} ${form.color === c.value ? "ring-2 ring-ring" : ""}`}
                        aria-label={c.value}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What will you cover?" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Browser reminder 5 min before</Label>
                  <Switch checked={form.reminder_enabled} onCheckedChange={(v) => setForm({ ...form, reminder_enabled: v })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Save block</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "week" | "day")}>
        <TabsList>
          <TabsTrigger value="week">Weekly grid</TabsTrigger>
          <TabsTrigger value="day">Daily list</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((d, i) => (
                <Card key={i} className="min-h-[200px]">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{d.slice(0, 3)}</span>
                      <Badge variant="secondary" className="text-[10px]">{byDay[i].length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 space-y-2">
                    {byDay[i].length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-4">No blocks</p>
                    ) : (
                      byDay[i].map((s) => <SessionCard key={s.id} s={s} />)
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="day" className="mt-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d, i) => (
              <Button
                key={i}
                size="sm"
                variant={activeDay === i ? "default" : "outline"}
                onClick={() => setActiveDay(i)}
              >
                {d}
              </Button>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{DAYS[activeDay]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {byDay[activeDay].length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No blocks scheduled.</p>
              ) : (
                byDay[activeDay].map((s) => (
                  <div key={s.id} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${colorClass(s.color)}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-xs opacity-80">{s.subject}</p>
                      {s.notes && <p className="text-xs mt-1 opacity-80">{s.notes}</p>}
                    </div>
                    <div className="text-xs flex items-center gap-1 opacity-80">
                      <Clock className="h-3 w-3" /> {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                    </div>
                    <button onClick={() => toggleReminder(s)} aria-label="Toggle reminder">
                      {s.reminder_enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 opacity-50" />}
                    </button>
                    <button onClick={() => handleDelete(s.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
