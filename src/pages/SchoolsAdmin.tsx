import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Plug, Trash2, Upload, RefreshCw } from "lucide-react";

type School = {
  id: string;
  name: string;
  logo_url: string | null;
  motto: string | null;
  principal_name: string | null;
  registration_number: string | null;
  physical_address: string | null;
  postal_address: string | null;
  county: string | null;
  sub_county: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
};

type ErpConn = {
  id: string;
  school_id: string;
  provider: "nemis" | "generic_rest" | "custom";
  display_name: string;
  base_url: string | null;
  api_key_last4: string | null;
  status: "active" | "inactive" | "error";
  last_sync_at: string | null;
  last_error: string | null;
  sync_students: boolean;
  sync_grades: boolean;
};

const empty: Partial<School> = { name: "" };

export default function SchoolsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [erpBySchool, setErpBySchool] = useState<Record<string, ErpConn[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<School> | null>(null);
  const [erpEditing, setErpEditing] = useState<{ schoolId: string; conn: Partial<ErpConn> & { api_key?: string } } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from("schools").select("*").order("name"),
      supabase.from("school_erp_connections").select("*"),
    ]);
    setSchools((s as School[]) || []);
    const grouped: Record<string, ErpConn[]> = {};
    ((e as ErpConn[]) || []).forEach((c) => {
      grouped[c.school_id] = [...(grouped[c.school_id] || []), c];
    });
    setErpBySchool(grouped);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (isAdmin === null) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const saveSchool = async () => {
    if (!editing?.name?.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    const payload = { ...editing, name: editing.name.trim() };
    const { error } = editing.id
      ? await supabase.from("schools").update(payload).eq("id", editing.id)
      : await supabase.from("schools").insert(payload as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const removeSchool = async (id: string) => {
    if (!confirm("Delete this school?")) return;
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const uploadLogo = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("school-logos").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("school-logos").getPublicUrl(path);
    setEditing({ ...editing, logo_url: data.publicUrl });
    setUploading(false);
  };

  const saveErp = async () => {
    if (!erpEditing) return;
    const c = erpEditing.conn;
    if (!c.display_name || !c.provider) { toast.error("Name + provider required"); return; }
    setSaving(true);
    const payload: any = {
      school_id: erpEditing.schoolId,
      provider: c.provider,
      display_name: c.display_name,
      base_url: c.base_url || null,
      sync_students: c.sync_students ?? true,
      sync_grades: c.sync_grades ?? true,
      status: c.status || "inactive",
      created_by: user?.id,
    };
    if (c.api_key) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(c.api_key));
      payload.api_key_hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      payload.api_key_last4 = c.api_key.slice(-4);
    }
    const { error } = c.id
      ? await supabase.from("school_erp_connections").update(payload).eq("id", c.id)
      : await supabase.from("school_erp_connections").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("ERP connection saved");
    setErpEditing(null);
    load();
  };

  const removeErp = async (id: string) => {
    if (!confirm("Remove this ERP connection?")) return;
    const { error } = await supabase.from("school_erp_connections").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  const testErp = async (conn: ErpConn) => {
    if (!conn.base_url) { toast.error("No base URL configured"); return; }
    toast.info("Testing connection…");
    try {
      const res = await fetch(conn.base_url, { method: "HEAD", mode: "no-cors" });
      const ok = res.type === "opaque" || res.ok;
      await supabase.from("school_erp_connections").update({
        status: ok ? "active" : "error",
        last_sync_at: new Date().toISOString(),
        last_error: ok ? null : `HTTP ${res.status}`,
      }).eq("id", conn.id);
      toast.success(ok ? "Reachable" : "Unreachable");
      load();
    } catch (e: any) {
      await supabase.from("school_erp_connections").update({ status: "error", last_error: e.message }).eq("id", conn.id);
      toast.error("Connection failed");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Schools</h1>
          <p className="text-muted-foreground">Manage school profiles and ERP integrations</p>
        </div>
        <Button onClick={() => setEditing(empty)}><Plus className="h-4 w-4" /> Add school</Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : schools.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No schools yet. Add your first one.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {schools.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} className="h-14 w-14 rounded-md object-cover border" />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xl font-bold">{s.name[0]}</div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-xl">{s.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{[s.county, s.sub_county].filter(Boolean).join(" · ")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => removeSchool(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Principal:</span> {s.principal_name || "—"}</div>
                  <div><span className="text-muted-foreground">Reg #:</span> {s.registration_number || "—"}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {s.phone || "—"}</div>
                  <div><span className="text-muted-foreground">Email:</span> {s.email || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Postal:</span> {s.postal_address || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {s.physical_address || "—"}</div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2"><Plug className="h-4 w-4" /> ERP connections</h3>
                    <Button size="sm" variant="outline" onClick={() => setErpEditing({ schoolId: s.id, conn: { provider: "generic_rest", display_name: "", sync_students: true, sync_grades: true } })}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  {(erpBySchool[s.id] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ERP connections.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last sync</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {erpBySchool[s.id].map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.display_name}</TableCell>
                            <TableCell>{c.provider}</TableCell>
                            <TableCell>
                              <Badge variant={c.status === "active" ? "default" : c.status === "error" ? "destructive" : "secondary"}>{c.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : "Never"}</TableCell>
                            <TableCell className="space-x-1">
                              <Button size="sm" variant="ghost" onClick={() => testErp(c)}><RefreshCw className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setErpEditing({ schoolId: s.id, conn: c })}><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => removeErp(c.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* School edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit school" : "Add school"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {editing.logo_url ? <img src={editing.logo_url} className="h-20 w-20 rounded-md border object-cover" alt="" /> : <div className="h-20 w-20 rounded-md bg-muted" />}
                <div>
                  <Label htmlFor="logo" className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted text-sm">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload logo
                    </span>
                    <input id="logo" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name *" v={editing.name} on={(v) => setEditing({ ...editing, name: v })} />
                <Field label="Motto" v={editing.motto} on={(v) => setEditing({ ...editing, motto: v })} />
                <Field label="Principal" v={editing.principal_name} on={(v) => setEditing({ ...editing, principal_name: v })} />
                <Field label="Registration #" v={editing.registration_number} on={(v) => setEditing({ ...editing, registration_number: v })} />
                <Field label="County" v={editing.county} on={(v) => setEditing({ ...editing, county: v })} />
                <Field label="Sub-county" v={editing.sub_county} on={(v) => setEditing({ ...editing, sub_county: v })} />
                <Field label="Phone" v={editing.phone} on={(v) => setEditing({ ...editing, phone: v })} />
                <Field label="Email" v={editing.email} on={(v) => setEditing({ ...editing, email: v })} />
                <Field label="Website" v={editing.website} on={(v) => setEditing({ ...editing, website: v })} />
                <Field label="Postal address" v={editing.postal_address} on={(v) => setEditing({ ...editing, postal_address: v })} />
              </div>
              <div>
                <Label>Physical address</Label>
                <Textarea value={editing.physical_address || ""} onChange={(e) => setEditing({ ...editing, physical_address: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveSchool} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ERP edit dialog */}
      <Dialog open={!!erpEditing} onOpenChange={(o) => !o && setErpEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{erpEditing?.conn.id ? "Edit ERP connection" : "Add ERP connection"}</DialogTitle></DialogHeader>
          {erpEditing && (
            <div className="space-y-3">
              <Field label="Display name *" v={erpEditing.conn.display_name} on={(v) => setErpEditing({ ...erpEditing, conn: { ...erpEditing.conn, display_name: v } })} />
              <div>
                <Label>Provider *</Label>
                <Select value={erpEditing.conn.provider} onValueChange={(v: any) => setErpEditing({ ...erpEditing, conn: { ...erpEditing.conn, provider: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nemis">NEMIS</SelectItem>
                    <SelectItem value="generic_rest">Generic REST</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Base URL" v={erpEditing.conn.base_url} on={(v) => setErpEditing({ ...erpEditing, conn: { ...erpEditing.conn, base_url: v } })} placeholder="https://erp.school.ac.ke/api" />
              <div>
                <Label>API Key {erpEditing.conn.id && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}</Label>
                <Input type="password" value={erpEditing.conn.api_key || ""} onChange={(e) => setErpEditing({ ...erpEditing, conn: { ...erpEditing.conn, api_key: e.target.value } })} placeholder={erpEditing.conn.api_key_last4 ? `••••${erpEditing.conn.api_key_last4}` : ""} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setErpEditing(null)}>Cancel</Button>
            <Button onClick={saveErp} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, v, on, placeholder }: { label: string; v: any; on: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={v || ""} onChange={(e) => on(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
