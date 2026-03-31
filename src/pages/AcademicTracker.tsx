import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, BookOpen, BarChart3 } from "lucide-react";

const GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"] as const;
const TERMS = ["Term 1", "Term 2", "Term 3"] as const;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Biology", "Physics", "Chemistry",
  "History", "Geography", "CRE", "IRE", "Business Studies", "Agriculture",
  "Computer Studies", "Home Science", "Art & Design", "Music", "French", "German",
];

const gradePoints: Record<string, number> = {
  A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8, "C+": 7, C: 6, "C-": 5,
  "D+": 4, D: 3, "D-": 2, E: 1,
};

type AcademicRecord = {
  id: string;
  user_id: string;
  subject: string;
  grade: string;
  term: string;
  year: number;
  points: number;
  created_at: string;
};

export default function AcademicTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR.toString());

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["academic_records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_records")
        .select("*")
        .order("year", { ascending: true })
        .order("term", { ascending: true });
      if (error) throw error;
      return data as AcademicRecord[];
    },
    enabled: !!user,
  });

  const addRecord = useMutation({
    mutationFn: async () => {
      if (!subject || !grade || !term || !year) throw new Error("All fields required");
      const { error } = await supabase.from("academic_records").insert({
        user_id: user!.id,
        subject,
        grade,
        term,
        year: parseInt(year),
        points: gradePoints[grade] || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic_records"] });
      toast.success("Grade recorded!");
      setSubject("");
      setGrade("");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academic_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic_records"] });
      toast.success("Record deleted");
    },
  });

  // Trend data: average points per term/year
  const trendData = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    records.forEach((r) => {
      const key = `${r.year} ${r.term}`;
      if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
      grouped[key].total += r.points;
      grouped[key].count += 1;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, { total, count }]) => ({
        period,
        average: Math.round((total / count) * 10) / 10,
        total: Math.round(total),
      }));
  }, [records]);

  // Per-subject averages
  const subjectData = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    records.forEach((r) => {
      if (!grouped[r.subject]) grouped[r.subject] = { total: 0, count: 0 };
      grouped[r.subject].total += r.points;
      grouped[r.subject].count += 1;
    });
    return Object.entries(grouped)
      .map(([subject, { total, count }]) => ({
        subject,
        average: Math.round((total / count) * 10) / 10,
      }))
      .sort((a, b) => b.average - a.average);
  }, [records]);

  const overallAvg = records.length
    ? Math.round((records.reduce((s, r) => s + r.points, 0) / records.length) * 10) / 10
    : 0;

  const chartConfig = {
    average: { label: "Avg Points", color: "hsl(var(--primary))" },
    total: { label: "Total Points", color: "hsl(var(--accent))" },
  };

  const barConfig = {
    average: { label: "Avg Points", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          Academic Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Record your grades and track performance trends</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{records.length}</p>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{overallAvg}</p>
            <p className="text-xs text-muted-foreground">Average Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{new Set(records.map((r) => r.subject)).size}</p>
            <p className="text-xs text-muted-foreground">Subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {records.length ? GRADES[12 - Math.round(overallAvg)] || "—" : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Mean Grade</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input" className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Grades
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> Trends
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> By Subject
          </TabsTrigger>
        </TabsList>

        {/* INPUT TAB */}
        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record a Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>{g} ({gradePoints[g]} pts)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
                    <SelectContent>
                      {TERMS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="mt-4"
                onClick={() => addRecord.mutate()}
                disabled={!subject || !grade || !term || addRecord.isPending}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Record
              </Button>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Records</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : records.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No records yet. Add your first grade above!</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.subject}</TableCell>
                          <TableCell>{r.grade}</TableCell>
                          <TableCell>{r.points}</TableCell>
                          <TableCell>{r.term}</TableCell>
                          <TableCell>{r.year}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRecord.mutate(r.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRENDS TAB */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length < 2 ? (
                <p className="text-muted-foreground text-center py-12">
                  Add grades from at least 2 terms to see trends
                </p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="period" className="text-xs" />
                    <YAxis domain={[0, 12]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="var(--color-average)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBJECTS TAB */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Average Performance by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectData.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No records yet</p>
              ) : (
                <ChartContainer config={barConfig} className="h-[350px] w-full">
                  <BarChart data={subjectData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="subject" angle={-45} textAnchor="end" height={80} className="text-xs" />
                    <YAxis domain={[0, 12]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="average" fill="var(--color-average)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
