
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('student', 'mentor', 'parent', 'admin');

-- Create education_level enum
CREATE TYPE public.education_level AS ENUM ('pre_primary', 'lower_primary', 'upper_primary', 'junior_secondary', 'senior_secondary', 'university');

-- Create resource_type enum
CREATE TYPE public.resource_type AS ENUM ('text', 'video', 'audio', 'pdf', 'assessment');

-- Create blog_category enum
CREATE TYPE public.blog_category AS ENUM ('study_hacks', 'mental_health', 'scholarships', 'cbc_updates', 'tech_in_schools', 'career_guidance');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  county TEXT,
  school TEXT,
  education_level public.education_level,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Careers table (DigiGuide)
CREATE TABLE public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cluster TEXT NOT NULL,
  min_grade TEXT,
  salary_range TEXT,
  outlook TEXT,
  required_subjects TEXT[],
  skills TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  education_level public.education_level NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Learning resources table (DigiLab)
CREATE TABLE public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id),
  resource_type public.resource_type NOT NULL DEFAULT 'text',
  content_url TEXT,
  thumbnail_url TEXT,
  education_level public.education_level,
  grade TEXT,
  strand TEXT,
  sub_strand TEXT,
  difficulty TEXT DEFAULT 'intermediate',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Squads table (DigiChat)
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Squad memberships
CREATE TABLE public.squad_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (squad_id, user_id)
);

-- Messages (DigiChat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blog posts (DigiBlog)
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category public.blog_category NOT NULL DEFAULT 'study_hacks',
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blog comments
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.blog_comments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blog likes
CREATE TABLE public.blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_resources_updated_at BEFORE UPDATE ON public.learning_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: users can read own, admins can manage
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Careers: public read, admin write
CREATE POLICY "Careers are public" ON public.careers FOR SELECT USING (true);
CREATE POLICY "Admins manage careers" ON public.careers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Subjects: public read
CREATE POLICY "Subjects are public" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Learning resources: public read
CREATE POLICY "Resources are public" ON public.learning_resources FOR SELECT USING (true);
CREATE POLICY "Admins manage resources" ON public.learning_resources FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Squads: public read, authenticated create
CREATE POLICY "Squads are viewable by everyone" ON public.squads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create squads" ON public.squads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Squad creators can update" ON public.squads FOR UPDATE USING (auth.uid() = created_by);

-- Squad memberships
CREATE POLICY "Members can view memberships" ON public.squad_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join squads" ON public.squad_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave squads" ON public.squad_memberships FOR DELETE USING (auth.uid() = user_id);

-- Messages: squad members can read and send
CREATE POLICY "Squad members can read messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.squad_memberships WHERE squad_id = messages.squad_id AND user_id = auth.uid())
);
CREATE POLICY "Squad members can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.squad_memberships WHERE squad_id = messages.squad_id AND user_id = auth.uid())
);

-- Blog posts: public read, authenticated create
CREATE POLICY "Blog posts are public" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.blog_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.blog_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.blog_posts FOR DELETE USING (auth.uid() = author_id);

-- Blog comments: public read, authenticated create
CREATE POLICY "Comments are public" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.blog_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON public.blog_comments FOR DELETE USING (auth.uid() = author_id);

-- Blog likes
CREATE POLICY "Likes are public" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.blog_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.blog_likes FOR DELETE USING (auth.uid() = user_id);
