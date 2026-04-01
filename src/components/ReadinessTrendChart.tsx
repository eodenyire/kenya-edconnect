import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

interface Simulation {
  id: string;
  career_id: string;
  career_title: string;
  readiness_percent: number;
  met_count: number;
  total_required: number;
  created_at: string;
}

interface Props {
  simulations: Simulation[];
}

export default function ReadinessTrendChart({ simulations }: Props) {
  const careerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const sim of simulations) {
      if (!map.has(sim.career_id)) map.set(sim.career_id, sim.career_title);
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [simulations]);

  const [selectedCareer, setSelectedCareer] = useState<string>("all");

  const chartData = useMemo(() => {
    const filtered = selectedCareer === "all"
      ? simulations
      : simulations.filter((s) => s.career_id === selectedCareer);

    return [...filtered]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((sim) => ({
        date: format(new Date(sim.created_at), "MMM d"),
        readiness: sim.readiness_percent,
        career: sim.career_title,
        met: sim.met_count,
        total: sim.total_required,
      }));
  }, [simulations, selectedCareer]);

  if (simulations.length < 2 && selectedCareer === "all") {
    return null; // Need at least 2 data points for a meaningful trend
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Readiness Trend
          </CardTitle>
          <Select value={selectedCareer} onValueChange={setSelectedCareer}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by career" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Careers</SelectItem>
              {careerOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Save at least 2 simulations{selectedCareer !== "all" ? " for this career" : ""} to see a trend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(value: number, _name: string, props: { payload: { career: string; met: number; total: number } }) => [
                  `${value}% (${props.payload.met}/${props.payload.total} subjects)`,
                  props.payload.career,
                ]}
              />
              <ReferenceLine y={100} stroke="hsl(var(--primary))" strokeDasharray="6 3" opacity={0.5} />
              <Line
                type="monotone"
                dataKey="readiness"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
