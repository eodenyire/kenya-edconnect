import { motion } from "framer-motion";
import { Shield, Wifi, BarChart3, Globe, Users, Lock } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "AI Predictions",
    description: "Projects Grade 12 performance based on Grade 7–9 trajectory with gap analysis.",
  },
  {
    icon: Wifi,
    title: "Offline Ready",
    description: "PWA capabilities ensure learning continues even in low-connectivity areas.",
  },
  {
    icon: Shield,
    title: "Child Safety",
    description: "Keyword flagging, verified mentors, and full audit logs for safe interactions.",
  },
  {
    icon: Globe,
    title: "KUCCPS Mapped",
    description: "Career recommendations mapped to Kenya's university placement requirements.",
  },
  {
    icon: Users,
    title: "Mentorship Network",
    description: "Connect with verified professionals, teachers, and counselors with badges.",
  },
  {
    icon: Lock,
    title: "Data Compliant",
    description: "Full compliance with Kenya Data Protection Act 2019, including parental consent.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-warm-gradient">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary tracking-wider uppercase">
            Why DigiStudentPro
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3 text-foreground">
            Built for Kenyan Learners
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 bg-card rounded-xl p-6 border border-border card-hover"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-card-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
