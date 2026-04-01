import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Download, Save, History, Trash2, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import ReadinessTrendChart from "@/components/ReadinessTrendChart";

const KCSE_GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"] as const;
type Grade = typeof KCSE_GRADES[number];

const gradePoints: Record<Grade, number> = {
  A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8, "C+": 7, C: 6, "C-": 5, "D+": 4, D: 3, "D-": 2, E: 1,
};

const ALL_SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Biology", "Chemistry", "Physics",
  "History", "Geography", "CRE", "IRE", "Business Studies", "Computer Studies",
  "Agriculture", "Home Science", "Art & Design", "Music", "French", "German",
];

interface Career {
  id: string;
  title: string;
  cluster: string;
  required_subjects: string[] | null;
  min_grade: string | null;
  salary_range: string | null;
  skills: string[] | null;
  description: string | null;
}

interface Props {
  careers: Career[];
}

export default function DreamSimulator({ careers }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState<string>("");
  const [myGrades, setMyGrades] = useState<Record<string, Grade>>({});
  const [showHistory, setShowHistory] = useState(false);

  // Fetch latest academic records per subject
  const { data: academicRecords = [] } = useQuery({
    queryKey: ["academic_records_latest", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_records")
        .select("*")
        .order("year", { ascending: false })
        .order("term", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Fetch saved simulations
  const { data: savedSimulations = [] } = useQuery({
    queryKey: ["simulation_results", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulation_results")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Save simulation mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      career_id: string;
      career_title: string;
      grades: Record<string, string>;
      met_count: number;
      total_required: number;
      readiness_percent: number;
      gaps: unknown[];
    }) => {
      const { error } = await supabase.from("simulation_results").insert([{
        user_id: user!.id,
        career_id: payload.career_id,
        career_title: payload.career_title,
        grades: JSON.parse(JSON.stringify(payload.grades)),
        met_count: payload.met_count,
        total_required: payload.total_required,
        readiness_percent: payload.readiness_percent,
        gaps: JSON.parse(JSON.stringify(payload.gaps)),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation_results"] });
      toast.success("Simulation saved!");
    },
    onError: () => toast.error("Failed to save simulation"),
  });

  // Delete simulation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simulation_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation_results"] });
      toast.success("Simulation deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  // Build a map of subject → latest grade from academic records
  const latestGradesBySubject = useMemo(() => {
    const map: Record<string, string> = {};
    for (const rec of academicRecords) {
      if (!map[rec.subject]) {
        map[rec.subject] = rec.grade;
      }
    }
    return map;
  }, [academicRecords]);

  const selectedCareer = careers.find((c) => c.id === selectedCareerId);
  const requiredSubjects = selectedCareer?.required_subjects ?? [];
  const minGrade = (selectedCareer?.min_grade ?? "C") as Grade;
  const minPoints = gradePoints[minGrade] ?? 6;

  const subjectsToRate = useMemo(() => {
    if (!requiredSubjects.length) return [];
    return ALL_SUBJECTS.filter((s) => requiredSubjects.includes(s));
  }, [requiredSubjects]);

  const handleCareerChange = (careerId: string) => {
    setSelectedCareerId(careerId);
    setMyGrades({});
  };

  const autoFillGrades = () => {
    const filled: Record<string, Grade> = {};
    let count = 0;
    for (const subject of subjectsToRate) {
      const grade = latestGradesBySubject[subject];
      if (grade && grade in gradePoints) {
        filled[subject] = grade as Grade;
        count++;
      }
    }
    setMyGrades((prev) => ({ ...prev, ...filled }));
    if (count > 0) {
      toast.success(`Auto-filled ${count} subject${count > 1 ? "s" : ""} from your Academic Tracker`);
    } else {
      toast.info("No matching grades found in your Academic Tracker. Add grades there first!");
    }
  };

  const hasRecordsForSubjects = subjectsToRate.some((s) => s in latestGradesBySubject);

  const gaps = useMemo(() => {
    if (!selectedCareer) return [];
    return subjectsToRate.map((subject) => {
      const myGrade = myGrades[subject];
      const myPoints = myGrade ? gradePoints[myGrade] : 0;
      const diff = myPoints - minPoints;
      return {
        subject,
        myGrade: myGrade ?? "—",
        myPoints,
        requiredGrade: minGrade,
        requiredPoints: minPoints,
        diff,
        status: !myGrade ? "missing" as const : diff >= 0 ? "met" as const : "gap" as const,
      };
    });
  }, [subjectsToRate, myGrades, minPoints, minGrade, selectedCareer]);

  const metCount = gaps.filter((g) => g.status === "met").length;
  const totalRequired = gaps.length;
  const overallPercent = totalRequired > 0 ? Math.round((metCount / totalRequired) * 100) : 0;

  const canSave = selectedCareer && gaps.every((g) => g.status !== "missing") && user;

  const handleSave = () => {
    if (!selectedCareer || !user) return;
    saveMutation.mutate({
      career_id: selectedCareer.id,
      career_title: selectedCareer.title,
      grades: myGrades,
      met_count: metCount,
      total_required: totalRequired,
      readiness_percent: overallPercent,
      gaps: gaps.map(({ subject, myGrade, diff, status }) => ({ subject, myGrade, diff, status })),
    });
  };

  const loadSimulation = (sim: typeof savedSimulations[0]) => {
    setSelectedCareerId(sim.career_id);
    const grades = sim.grades as Record<string, string>;
    const validGrades: Record<string, Grade> = {};
    for (const [k, v] of Object.entries(grades)) {
      if (v in gradePoints) validGrades[k] = v as Grade;
    }
    setMyGrades(validGrades);
    setShowHistory(false);
    toast.success(`Loaded simulation for ${sim.career_title}`);
  };

  return (
    <div className="space-y-6">
      {/* History toggle */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
          <History className="h-4 w-4" />
          {showHistory ? "Back to Simulator" : `Saved Results (${savedSimulations.length})`}
        </Button>
      </div>

      {showHistory ? (
        /* Saved simulations list */
        <div className="space-y-6">
          {savedSimulations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No saved simulations yet</p>
                <p className="text-sm mt-1">Run a simulation and save it to track your readiness over time.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Readiness Trend Chart */}
              <ReadinessTrendChart simulations={savedSimulations} />

              {/* Simulation cards */}
              <div className="space-y-3">
                {savedSimulations.map((sim) => (
                  <Card key={sim.id} className="card-hover">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{sim.career_title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge
                            variant={sim.readiness_percent === 100 ? "default" : "secondary"}
                            className={sim.readiness_percent === 100 ? "bg-green-600" : ""}
                          >
                            {sim.readiness_percent}% ready
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {sim.met_count}/{sim.total_required} subjects met
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(sim.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => loadSimulation(sim)}>Load</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(sim.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Career selector */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Dream Career Simulator
              </CardTitle>
              <CardDescription>
                Pick your dream career, enter your current grades, and see how you compare to KUCCPS requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCareerId} onValueChange={handleCareerChange}>
                <SelectTrigger className="w-full sm:w-[360px]">
                  <SelectValue placeholder="Select a career..." />
                </SelectTrigger>
                <SelectContent>
                  {careers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} — {c.cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedCareer && (
            <>
              {/* Career info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{selectedCareer.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="secondary">{selectedCareer.cluster}</Badge>
                    {selectedCareer.salary_range && (
                      <Badge variant="outline" className="gap-1">
                        <TrendingUp className="h-3 w-3" /> {selectedCareer.salary_range}
                      </Badge>
                    )}
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Min Grade: {minGrade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCareer.description && (
                    <p className="text-sm text-muted-foreground">{selectedCareer.description}</p>
                  )}
                  {selectedCareer.skills?.length ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Key Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCareer.skills.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Grade input & gap analysis */}
              {subjectsToRate.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">Your Grades vs Requirements</CardTitle>
                        <CardDescription>
                          Enter your current (or projected) grade for each required subject.
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {hasRecordsForSubjects && (
                          <Button variant="outline" size="sm" onClick={autoFillGrades} className="gap-1.5">
                            <Download className="h-4 w-4" />
                            Auto-fill
                          </Button>
                        )}
                        {canSave && (
                          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5">
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall readiness */}
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Overall Readiness</span>
                        <span className={overallPercent === 100 ? "text-green-600" : overallPercent >= 50 ? "text-yellow-600" : "text-red-600"}>
                          {metCount}/{totalRequired} subjects met — {overallPercent}%
                        </span>
                      </div>
                      <Progress value={overallPercent} className="h-3" />
                    </div>

                    {/* Subject rows */}
                    <div className="space-y-3">
                      {gaps.map((g) => (
                        <div key={g.subject} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {g.status === "met" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              ) : g.status === "gap" ? (
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-medium text-sm">{g.subject}</span>
                            </div>
                            {g.status === "gap" && (
                              <p className="text-xs text-red-600 ml-6 mt-0.5">
                                Need to improve by {Math.abs(g.diff)} grade point{Math.abs(g.diff) > 1 ? "s" : ""} (current {g.myGrade} → target {minGrade})
                              </p>
                            )}
                            {g.status === "met" && (
                              <p className="text-xs text-green-600 ml-6 mt-0.5">
                                {g.diff > 0 ? `${g.diff} point${g.diff > 1 ? "s" : ""} above requirement!` : "Exactly meets requirement"}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={myGrades[g.subject] ?? ""} onValueChange={(v) => setMyGrades((prev) => ({ ...prev, [g.subject]: v as Grade }))}>
                              <SelectTrigger className="w-[80px] h-9">
                                <SelectValue placeholder="Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {KCSE_GRADES.map((gr) => (
                                  <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              Need: {minGrade}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    {gaps.every((g) => g.status !== "missing") && (
                      <div className={`p-4 rounded-lg border-2 ${overallPercent === 100 ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"}`}>
                        {overallPercent === 100 ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <p className="font-medium text-green-700 dark:text-green-400">
                              You meet all requirements for {selectedCareer.title}! Keep it up! 🎉
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                                {totalRequired - metCount} subject{totalRequired - metCount > 1 ? "s" : ""} need{totalRequired - metCount === 1 ? "s" : ""} improvement
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground ml-7">
                              Focus on: {gaps.filter((g) => g.status === "gap").map((g) => g.subject).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No specific subject requirements listed for this career yet.
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
