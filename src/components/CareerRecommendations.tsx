import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { recommendCareers, type Career } from "@/lib/careerMatch";

interface Props {
  careers?: Career[];
  limit?: number;
  compact?: boolean;
}

export default function CareerRecommendations({ careers: careersProp, limit = 6, compact = false }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [careers, setCareers] = useState<Career[]>(careersProp || []);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const profilePromise = supabase
        .from("profiles")
        .select("subjects, interests")
        .eq("user_id", user.id)
        .maybeSingle();
      const careersPromise = careersProp
        ? Promise.resolve({ data: careersProp })
        : supabase.from("careers").select("*");
      const [{ data: profile }, { data: careerData }] = await Promise.all([profilePromise, careersPromise]);
      setSubjects((profile as any)?.subjects || []);
      setInterests((profile as any)?.interests || []);
      if (!careersProp) setCareers((careerData as Career[]) || []);
      setLoading(false);
    })();
  }, [user, careersProp]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (subjects.length === 0 && interests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 space-y-3">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Tell us your subjects & interests to unlock personalized career matches</p>
          <Button asChild><Link to="/onboarding">Complete your profile</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const matches = recommendCareers(careers, subjects, interests, limit);

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No strong matches yet. Try adding more subjects or interests in your profile.</p>
        </CardContent>
      </Card>
    );
  }

  const max = matches[0].score || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-accent" />
        <span>Based on {subjects.length} subjects and {interests.length} interests from your profile</span>
      </div>
      <div className={compact ? "grid sm:grid-cols-2 gap-3" : "grid md:grid-cols-2 lg:grid-cols-3 gap-4"}>
        {matches.map(({ career, score }) => {
          const pct = Math.min(100, Math.round((score / (max + 2)) * 100));
          const matchedSubs = (career.required_subjects || []).filter((r) =>
            subjects.some((s) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
          );
          return (
            <Card key={career.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{career.title}</CardTitle>
                  <Badge className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20">
                    <TrendingUp className="h-3 w-3 mr-1" />{pct}%
                  </Badge>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">{career.cluster}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {!compact && career.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{career.description}</p>
                )}
                {matchedSubs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {matchedSubs.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs border-primary/40 text-primary">{s}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {compact && (
        <Button variant="outline" asChild className="w-full">
          <Link to="/digiguide">Explore all careers <ArrowRight className="h-4 w-4 ml-2" /></Link>
        </Button>
      )}
    </div>
  );
}
