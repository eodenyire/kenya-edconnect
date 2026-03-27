import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Loader2, MapPin, School, GraduationCap } from "lucide-react";

const educationLevels = [
  { value: "pre_primary", label: "Pre-Primary (PP1-PP2)" },
  { value: "lower_primary", label: "Lower Primary (Grade 1-3)" },
  { value: "upper_primary", label: "Upper Primary (Grade 4-6)" },
  { value: "junior_secondary", label: "Junior Secondary (Grade 7-9)" },
  { value: "senior_secondary", label: "Senior Secondary (Grade 10-12)" },
  { value: "university", label: "University" },
];

const kenyanCounties = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
  "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
  "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos",
  "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a",
  "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia",
  "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    phone: "",
    county: "",
    school: "",
    education_level: "" as string,
    grade: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRoles();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      setProfile({
        display_name: data.display_name || "",
        bio: data.bio || "",
        phone: data.phone || "",
        county: data.county || "",
        school: data.school || "",
        education_level: data.education_level || "",
        grade: data.grade || "",
      });
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id);
    setRoles(data?.map((r) => r.role) || []);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name || null,
        bio: profile.bio || null,
        phone: profile.phone || null,
        county: profile.county || null,
        school: profile.school || null,
        education_level: (profile.education_level || null) as any,
        grade: profile.grade || null,
      })
      .eq("user_id", user!.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    }
  };

  const initials = profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <User className="h-8 w-8 text-primary" /> My Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      {/* Avatar & Roles */}
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{profile.display_name || user?.email}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              {roles.map((role) => (
                <Badge key={role} className="capitalize">{role}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+254 7XX XXX XXX" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself..." className="min-h-[80px]" />
          </div>
        </CardContent>
      </Card>

      {/* Education Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Education Level</Label>
              <Select value={profile.education_level} onValueChange={(v) => setProfile({ ...profile, education_level: v })}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {educationLevels.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Grade</Label>
              <Input value={profile.grade} onChange={(e) => setProfile({ ...profile, grade: e.target.value })} placeholder="e.g. Grade 9" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><School className="h-4 w-4" /> School</Label>
              <Input value={profile.school} onChange={(e) => setProfile({ ...profile, school: e.target.value })} placeholder="Your school name" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> County</Label>
              <Select value={profile.county} onValueChange={(v) => setProfile({ ...profile, county: v })}>
                <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                <SelectContent>
                  {kenyanCounties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}
