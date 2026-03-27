import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Newspaper, Heart, MessageCircle, Plus, Loader2 } from "lucide-react";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "study_hacks", label: "📚 Study Hacks" },
  { value: "mental_health", label: "🧠 Mental Health" },
  { value: "scholarships", label: "💰 Scholarships" },
  { value: "cbc_updates", label: "📋 CBC Updates" },
  { value: "tech_in_schools", label: "💻 Tech in Schools" },
  { value: "career_guidance", label: "🎓 Career Guidance" },
];

export default function DigiBlog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("study_hacks");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const createPost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("blog_posts").insert({
      title: newTitle, content: newContent, category: newCategory, author_id: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post published!" });
      setNewTitle(""); setNewContent(""); setDialogOpen(false);
      fetchPosts();
    }
    setCreating(false);
  };

  const likePost = async (postId: string) => {
    const { error } = await supabase.from("blog_likes").insert({ post_id: postId, user_id: user?.id });
    if (error?.code === "23505") {
      await supabase.from("blog_likes").delete().eq("post_id", postId).eq("user_id", user?.id);
    }
  };

  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || p.category === category;
    return matchSearch && matchCategory;
  });

  const categoryLabel = (cat: string) => categories.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-purple-500" /> DigiBlog
          </h1>
          <p className="text-muted-foreground mt-1">Community content and educational articles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Write Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Write a Blog Post</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Your post title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.value !== "all").map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea placeholder="Share your thoughts..." className="min-h-[150px]" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              </div>
              <Button onClick={createPost} disabled={creating} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Publish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share something with the community!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <Card key={post.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-xs">{categoryLabel(post.category)}</Badge>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                  </div>
                  {post.is_featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3 mb-4">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <button onClick={() => likePost(post.id)} className="flex items-center gap-1 hover:text-destructive transition-colors">
                    <Heart className="h-4 w-4" /> {post.like_count}
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" /> {post.comment_count}
                  </span>
                  <span className="ml-auto text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
