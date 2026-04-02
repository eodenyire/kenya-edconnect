import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Flag, Trash2, CheckCircle, Loader2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

interface FlaggedMessage {
  id: string;
  content: string;
  sender_id: string;
  squad_id: string | null;
  created_at: string;
  is_flagged: boolean | null;
}

export default function ModerationPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [squads, setSquads] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) loadFlaggedMessages();
  }, [isAdmin]);

  const checkAdmin = async () => {
    const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
    setIsAdmin(!!data);
    if (!data) setLoading(false);
  };

  const loadFlaggedMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("is_flagged", true)
      .order("created_at", { ascending: false });

    const msgs = data || [];
    setMessages(msgs);

    // Load profiles and squads
    const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
    const squadIds = [...new Set(msgs.map((m) => m.squad_id).filter(Boolean))] as string[];

    if (senderIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", senderIds);
      const map: Record<string, string> = {};
      profileData?.forEach((p) => { map[p.user_id] = p.display_name || "User"; });
      setProfiles(map);
    }

    if (squadIds.length > 0) {
      const { data: squadData } = await supabase
        .from("squads")
        .select("id, name")
        .in("id", squadIds);
      const map: Record<string, string> = {};
      squadData?.forEach((s) => { map[s.id] = s.name; });
      setSquads(map);
    }

    setLoading(false);
  };

  const unflagMessage = async (msgId: string) => {
    setActionLoading(msgId);
    const { error } = await supabase.from("messages").update({ is_flagged: false }).eq("id", msgId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast({ title: "Cleared", description: "Message unflagged." });
    }
    setActionLoading(null);
  };

  const deleteMessage = async (msgId: string) => {
    setActionLoading(msgId);
    const { error } = await supabase.from("messages").delete().eq("id", msgId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast({ title: "Deleted", description: "Message removed." });
    }
    setActionLoading(null);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium">Admin Access Required</p>
          <p className="text-sm text-muted-foreground mt-1">You need admin privileges to view this panel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-destructive" /> Moderation
        </h1>
        <p className="text-muted-foreground mt-1">Review and manage flagged messages</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No flagged messages to review.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Flagged Messages
              <Badge variant="destructive">{messages.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Squad</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="max-w-[300px] truncate font-mono text-sm">
                      {msg.content}
                    </TableCell>
                    <TableCell>{profiles[msg.sender_id] || "Unknown"}</TableCell>
                    <TableCell>{msg.squad_id ? squads[msg.squad_id] || "Unknown" : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(msg.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unflagMessage(msg.id)}
                        disabled={actionLoading === msg.id}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMessage(msg.id)}
                        disabled={actionLoading === msg.id}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
