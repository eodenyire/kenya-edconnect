import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Briefcase, TrendingUp, GraduationCap, Loader2, Target } from "lucide-react";
import DreamSimulator from "@/components/DreamSimulator";

const clusters = [
  "All Clusters", "Applied Sciences", "Business & Commerce", "Engineering & Technology",
  "Health Sciences", "Humanities & Social Sciences", "Law", "Pure Sciences",
  "Agriculture & Environment", "Education"
];

export default function DigiGuide() {
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cluster, setCluster] = useState("All Clusters");

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    const { data } = await supabase.from("careers").select("*").order("title");
    setCareers(data || []);
    setLoading(false);
  };

  const filtered = careers.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCluster = cluster === "All Clusters" || c.cluster === cluster;
    return matchSearch && matchCluster;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" /> DigiGuide
        </h1>
        <p className="text-muted-foreground mt-1">Explore careers aligned with Kenya's KUCCPS clusters</p>
      </div>

      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList>
          <TabsTrigger value="explore" className="gap-1.5"><Briefcase className="h-4 w-4" /> Explore Careers</TabsTrigger>
          <TabsTrigger value="simulator" className="gap-1.5"><Target className="h-4 w-4" /> Dream Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search careers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={cluster} onValueChange={setCluster}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clusters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Career cards */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">No careers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {careers.length === 0 ? "Career data will be added soon. Check back later!" : "Try adjusting your search or filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((career) => (
            <Card key={career.id} className="card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{career.title}</CardTitle>
                <Badge variant="secondary" className="w-fit">{career.cluster}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{career.description}</p>
                {career.salary_range && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>{career.salary_range}</span>
                  </div>
                )}
                {career.required_subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {career.required_subjects.map((s: string) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
                {career.outlook && (
                  <p className="text-xs text-muted-foreground">Outlook: {career.outlook}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="simulator">
          <DreamSimulator careers={careers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
