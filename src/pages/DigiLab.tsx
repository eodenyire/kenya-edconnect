import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, FileText, Video, Headphones, FileCheck, Loader2 } from "lucide-react";

const typeIcons: Record<string, any> = {
  text: FileText, video: Video, audio: Headphones, pdf: FileText, assessment: FileCheck,
};

const typeColors: Record<string, string> = {
  text: "bg-blue-500/10 text-blue-600",
  video: "bg-red-500/10 text-red-600",
  audio: "bg-purple-500/10 text-purple-600",
  pdf: "bg-orange-500/10 text-orange-600",
  assessment: "bg-green-500/10 text-green-600",
};

export default function DigiLab() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data } = await supabase.from("learning_resources").select("*").order("created_at", { ascending: false });
    setResources(data || []);
    setLoading(false);
  };

  const filtered = resources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.resource_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-accent" /> DigiLab
        </h1>
        <p className="text-muted-foreground mt-1">Browse CBC-aligned learning resources</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search resources..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="assessment">Assessment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">No resources found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {resources.length === 0 ? "Learning resources will be added soon!" : "Try adjusting your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource) => {
            const Icon = typeIcons[resource.resource_type] || FileText;
            const color = typeColors[resource.resource_type] || "bg-muted text-muted-foreground";
            return (
              <Card key={resource.id} className="card-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2">{resource.title}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs capitalize">{resource.resource_type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {resource.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{resource.description}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {resource.strand && <span>{resource.strand}</span>}
                    {resource.difficulty && <Badge variant="secondary" className="text-xs capitalize">{resource.difficulty}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
