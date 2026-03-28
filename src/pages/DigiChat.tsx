import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, MessageSquare, Users, Plus, Loader2 } from "lucide-react";
import SquadChatRoom from "@/components/SquadChatRoom";

export default function DigiChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [squads, setSquads] = useState<any[]>([]);
  const [mySquadIds, setMySquadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newSquadName, setNewSquadName] = useState("");
  const [newSquadDesc, setNewSquadDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSquad, setActiveSquad] = useState<any | null>(null);

  useEffect(() => {
    fetchSquads();
    fetchMyMemberships();
  }, [user]);

  const fetchSquads = async () => {
    const { data } = await supabase.from("squads").select("*").order("created_at", { ascending: false });
    setSquads(data || []);
    setLoading(false);
  };

  const fetchMyMemberships = async () => {
    if (!user) return;
    const { data } = await supabase.from("squad_memberships").select("squad_id").eq("user_id", user.id);
    setMySquadIds(new Set((data || []).map((m) => m.squad_id)));
  };

  const createSquad = async () => {
    if (!newSquadName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from("squads").insert([{
      name: newSquadName, description: newSquadDesc, created_by: user?.id!, member_count: 1,
    }]).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      await supabase.from("squad_memberships").insert({ squad_id: data.id, user_id: user?.id, role: "admin" });
      toast({ title: "Squad created!", description: `${newSquadName} is ready.` });
      setNewSquadName(""); setNewSquadDesc(""); setDialogOpen(false);
      fetchSquads();
      fetchMyMemberships();
      setActiveSquad(data);
    }
    setCreating(false);
  };

  const joinSquad = async (squad: any) => {
    const { error } = await supabase.from("squad_memberships").insert({ squad_id: squad.id, user_id: user?.id });
    if (error?.code === "23505") {
      // Already a member, just open the chat
      setActiveSquad(squad);
    } else if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Joined!", description: "You're now part of this squad." });
      fetchMyMemberships();
      setActiveSquad(squad);
    }
  };

  const openChat = (squad: any) => {
    if (mySquadIds.has(squad.id)) {
      setActiveSquad(squad);
    } else {
      joinSquad(squad);
    }
  };

  const filtered = squads.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  if (activeSquad) {
    return <SquadChatRoom squad={activeSquad} onBack={() => { setActiveSquad(null); fetchSquads(); }} />;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" /> DigiChat
          </h1>
          <p className="text-muted-foreground mt-1">Join study squads and chat with peers in real-time</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Squad</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a Squad</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Squad Name</Label>
                <Input placeholder="e.g. Future Medics" value={newSquadName} onChange={(e) => setNewSquadName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="What's this squad about?" value={newSquadDesc} onChange={(e) => setNewSquadDesc(e.target.value)} />
              </div>
              <Button onClick={createSquad} disabled={creating} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Squad
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search squads..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">No squads yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to create a study squad!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((squad) => {
            const isMember = mySquadIds.has(squad.id);
            return (
              <Card key={squad.id} className="card-hover cursor-pointer" onClick={() => openChat(squad)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {squad.name}
                    {isMember && <Badge variant="default" className="text-[10px]">Joined</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {squad.description && <p className="text-sm text-muted-foreground line-clamp-2">{squad.description}</p>}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" /> {squad.member_count} members
                    </Badge>
                    <Button size="sm" variant={isMember ? "default" : "outline"} onClick={(e) => { e.stopPropagation(); openChat(squad); }}>
                      {isMember ? "Open Chat" : "Join & Chat"}
                    </Button>
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
