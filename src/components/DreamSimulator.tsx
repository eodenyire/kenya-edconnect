import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

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
  const [selectedCareerId, setSelectedCareerId] = useState<string>("");
  const [myGrades, setMyGrades] = useState<Record<string, Grade>>({});

  const selectedCareer = careers.find((c) => c.id === selectedCareerId);
  const requiredSubjects = selectedCareer?.required_subjects ?? [];
  const minGrade = (selectedCareer?.min_grade ?? "C") as Grade;
  const minPoints = gradePoints[minGrade] ?? 6;

  // Determine which subjects to show grade inputs for
  const subjectsToRate = useMemo(() => {
    if (!requiredSubjects.length) return [];
    return ALL_SUBJECTS.filter((s) => requiredSubjects.includes(s));
  }, [requiredSubjects]);

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

  return (
    <div className="space-y-6">
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
          <Select value={selectedCareerId} onValueChange={(v) => { setSelectedCareerId(v); setMyGrades({}); }}>
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
                <CardTitle className="text-lg">Your Grades vs Requirements</CardTitle>
                <CardDescription>
                  Enter your current (or projected) grade for each required subject.
                </CardDescription>
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
    </div>
  );
}