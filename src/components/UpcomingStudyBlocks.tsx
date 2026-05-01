import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarClock, Clock } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Block = {
  id: string;
  subject: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const minutesUntil = (day: number, time: string) => {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const target = new Date(now);
  let diff = (day - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + diff);
  target.setHours(h, m, 0, 0);
  if (diff === 0 && target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 7);
  }
  return Math.round((target.getTime() - now.getTime()) / 60000);
};

const formatIn = (mins: number) => {
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `in ${h}h`;
  return `in ${Math.floor(h / 24)}d`;
};

export default function UpcomingStudyBlocks() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("study_sessions")
      .select("id, subject, title, day_of_week, start_time, end_time")
      .then(({ data }) => {
        const list = (data as Block[]) || [];
        const sorted = list
          .map((b) => ({ ...b, _mins: minutesUntil(b.day_of_week, b.start_time) }))
          .sort((a, b) => a._mins - b._mins)
          .slice(0, 4);
        setBlocks(sorted);
        setLoading(false);
      });
  }, [user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-primary" /> Upcoming study blocks
        </CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link to="/study-planner">Open planner</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No study blocks yet. Create one in the planner.
          </p>
        ) : (
          <div className="space-y-2">
            {blocks.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between border rounded-md p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {b.subject} · {DAYS[b.day_of_week]} {b.start_time.slice(0, 5)}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" /> {formatIn(b._mins)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
