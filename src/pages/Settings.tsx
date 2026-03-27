import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Lock, Bell, Shield, Loader2, Trash2 } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    mentorMessages: true,
    squadUpdates: true,
    blogPosts: false,
  });

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "Your password has been changed successfully." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (confirmed) {
      toast({ title: "Account deletion", description: "Please contact support to delete your account.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Account</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Account Created</Label>
            <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
          <CardDescription>Choose what updates you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "mentorMessages", label: "Mentor Messages", desc: "Notifications when mentors respond" },
            { key: "squadUpdates", label: "Squad Updates", desc: "New messages in your squads" },
            { key: "blogPosts", label: "Blog Posts", desc: "New articles in your interests" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>Delete</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Sign Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
