import { motion } from "framer-motion";
import { Brain, BookOpen, MessageCircle, Newspaper, ArrowUpRight } from "lucide-react";

const modules = [
  {
    id: "digiguide",
    icon: Brain,
    title: "DigiGuide",
    subtitle: "The Intelligence Engine",
    description:
      "AI-powered career guidance with predictive analytics. Tracks student profiles, maps KUCCPS clusters, and simulates career roadmaps.",
    features: ["Student Golden Record", "Career Database", "AI Predictions", "Gap Analysis", "Dream Simulator"],
    color: "primary" as const,
  },
  {
    id: "digilab",
    icon: BookOpen,
    title: "DigiLab",
    subtitle: "The Knowledge Repository",
    description:
      "Comprehensive content library aligned to CBC learning outcomes with text, video, audio, PDFs, and interactive assessments.",
    features: ["CBC-Aligned Content", "Video Lessons", "Interactive Quizzes", "Offline Support", "Progress Tracking"],
    color: "accent" as const,
  },
  {
    id: "digichat",
    icon: MessageCircle,
    title: "DigiChat",
    subtitle: "The Mentorship Hub",
    description:
      "Secure platform connecting students with verified mentors through direct messaging, group squads, and Q&A forums.",
    features: ["Verified Mentors", "Squad Groups", "Q&A Forums", "Child Safety", "Audit Logs"],
    color: "primary" as const,
  },
  {
    id: "digiblog",
    icon: Newspaper,
    title: "DigiBlog",
    subtitle: "The Community Feed",
    description:
      "Educational content platform with study hacks, mental health resources, scholarship news, and CBC updates.",
    features: ["Study Hacks", "Scholarship News", "CBC Updates", "Creator Profiles", "Curated Feeds"],
    color: "accent" as const,
  },
];

const colorMap = {
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
    badge: "bg-primary/10 text-primary",
    border: "border-primary/20",
  },
  accent: {
    bg: "bg-accent/10",
    icon: "text-accent",
    badge: "bg-accent/15 text-accent-foreground",
    border: "border-accent/20",
  },
};

const ModulesSection = () => {
  return (
    <section id="modules" className="py-24 bg-warm-gradient">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary tracking-wider uppercase">
            Core Modules
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3 text-foreground">
            Four Pillars of Digital Learning
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            An integrated ecosystem combining intelligence, content, mentorship,
            and community for Kenya's CBC framework.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((mod, i) => {
            const c = colorMap[mod.color];
            return (
              <motion.div
                key={mod.id}
                id={mod.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group bg-card rounded-2xl p-8 border ${c.border} card-hover cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <mod.icon className={`w-6 h-6 ${c.icon}`} />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-display font-bold text-card-foreground">
                  {mod.title}
                </h3>
                <p className="text-sm text-primary font-medium mt-1">{mod.subtitle}</p>
                <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                  {mod.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {mod.features.map((f) => (
                    <span
                      key={f}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.badge}`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
