import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Compass, BookOpen, MessageSquare, Newspaper, TrendingUp, Users, Award, Target } from "lucide-react";

const stats = [
  { label: "Career Matches", value: "12", icon: Target, color: "text-primary" },
  { label: "Resources Viewed", value: "47", icon: BookOpen, color: "text-accent" },
  { label: "Squads Joined", value: "3", icon: Users, color: "text-blue-500" },
  { label: "Blog Posts Read", value: "18", icon: TrendingUp, color: "text-purple-500" },
];

const modules = [
  { title: "DigiGuide", description: "Explore careers aligned with your CBC path. Get AI-powered recommendations.", icon: Compass, url: "/digiguide", color: "bg-primary/10 text-primary" },
  { title: "DigiLab", description: "Access learning resources, past papers, and video lessons.", icon: BookOpen, url: "/digilab", color: "bg-accent/10 text-accent-foreground" },
  { title: "DigiChat", description: "Connect with verified mentors and join study squads.", icon: MessageSquare, url: "/digichat", color: "bg-blue-500/10 text-blue-600" },
  { title: "DigiBlog", description: "Read study hacks, scholarship news, and CBC updates.", icon: Newspaper, url: "/digiblog", color: "bg-purple-500/10 text-purple-600" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-display font-bold">Welcome back, {name}! 👋</h1>
        <p className="text-muted-foreground mt-1">Here's your learning overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick access modules */}
      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Your Modules</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Card key={mod.title} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mod.color}`}>
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{mod.description}</p>
                <Button asChild variant="outline" size="sm">
                  <Link to={mod.url}>Explore →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Start exploring to earn your first achievements! 🎯</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
