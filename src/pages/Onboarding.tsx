import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";

const educationLevels = [
  { value: "pre_primary", label: "Pre-Primary (PP1-PP2)" },
  { value: "lower_primary", label: "Lower Primary (Grade 1-3)" },
  { value: "upper_primary", label: "Upper Primary (Grade 4-6)" },
  { value: "junior_secondary", label: "Junior Secondary (Grade 7-9)" },
  { value: "senior_secondary", label: "Senior Secondary (Grade 10-12)" },
  { value: "university", label: "University" },
];

const grades = [
  "PP1", "PP2",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  "Year 1", "Year 2", "Year 3", "Year 4",
];

const subjectOptions = [
  "Mathematics", "English", "Kiswahili", "Integrated Science", "Biology",
  "Chemistry", "Physics", "Geography", "History", "CRE", "Business Studies",
  "Computer Studies", "Agriculture", "Home Science", "Art & Design",
  "Music", "Physical Education", "French", "German",
];

const interestOptions = [
  "Engineering", "Medicine", "Technology", "Arts & Design", "Business",
  "Sports", "Music", "Writing", "Coding", "Robotics", "Environment",
  "Law", "Teaching", "Agriculture", "Media & Journalism", "Entrepreneurship",
];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [educationLevel, setEducationLevel] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.onboarding_completed) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    })();
  }, [user, authLoading, navigate]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSubmit = async () => {
    if (!educationLevel || !grade) {
      toast({ title: "Please complete required fields", description: "Education level and grade are required.", variant: "destructive" });
      return;
    }
    if (subjects.length === 0) {
      toast({ title: "Pick at least one subject", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        education_level: educationLevel as any,
        grade,
        subjects,
        interests,
        onboarding_completed: true,
      })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save profile", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "You're all set! 🎉", description: "Personalizing your dashboard..." });
    navigate("/dashboard", { replace: true });
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold">Let's personalize your experience</h1>
          <p className="text-muted-foreground">Tell us a bit about you so we can tailor recommendations.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your studies</CardTitle>
            <CardDescription>Select your current level and grade.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Education level *</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {educationLevels.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current grade *</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subjects you take *</CardTitle>
            <CardDescription>Select all that apply.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjectOptions.map((s) => (
                <label key={s} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent transition-colors">
                  <Checkbox checked={subjects.includes(s)} onCheckedChange={() => toggle(subjects, setSubjects, s)} />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Your interests</CardTitle>
            <CardDescription>We'll match careers and content to these.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((i) => {
                const active = interests.includes(i);
                return (
                  <Badge
                    key={i}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggle(interests, setInterests, i)}
                  >
                    {i}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>Skip for now</Button>
          <Button onClick={handleSubmit} disabled={saving} size="lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Finish setup
          </Button>
        </div>
      </div>
    </div>
  );
}
