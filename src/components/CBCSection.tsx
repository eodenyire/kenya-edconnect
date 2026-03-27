import { motion } from "framer-motion";

const levels = [
  { level: "Pre-Primary", grades: "PP1 – PP2", ages: "4–6 yrs", icon: "🌱" },
  { level: "Lower Primary", grades: "Grade 1–3", ages: "6–9 yrs", icon: "📚" },
  { level: "Upper Primary", grades: "Grade 4–6", ages: "9–12 yrs", icon: "✏️" },
  { level: "Junior Secondary", grades: "Grade 7–9", ages: "12–15 yrs", icon: "🔬" },
  { level: "Senior Secondary", grades: "Grade 10–12", ages: "15–18 yrs", icon: "🎓" },
  { level: "University", grades: "Year 1–4+", ages: "18+ yrs", icon: "🏛️" },
];

const CBCSection = () => {
  return (
    <section id="cbc" className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary tracking-wider uppercase">
            CBC Framework
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mt-3 text-foreground">
            Supporting Every Stage of Learning
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Full coverage of Kenya's Competency-Based Curriculum from Pre-Primary
            through University, with KUCCPS cluster integration.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {levels.map((l, i) => (
            <motion.div
              key={l.level}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5 text-center card-hover"
            >
              <div className="text-3xl mb-3">{l.icon}</div>
              <h3 className="font-display font-bold text-sm text-card-foreground">
                {l.level}
              </h3>
              <p className="text-xs text-primary font-medium mt-1">{l.grades}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{l.ages}</p>
            </motion.div>
          ))}
        </div>

        {/* Grading system */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-card border border-border rounded-2xl p-8"
        >
          <h3 className="font-display font-bold text-lg text-card-foreground mb-4">
            CBC Performance Levels
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Exceeding Expectations", color: "bg-primary text-primary-foreground" },
              { label: "Meeting Expectations", color: "bg-primary/70 text-primary-foreground" },
              { label: "Approaching Expectations", color: "bg-accent text-accent-foreground" },
              { label: "Below Expectations", color: "bg-destructive/80 text-destructive-foreground" },
            ].map((g) => (
              <div
                key={g.label}
                className={`${g.color} rounded-xl px-4 py-3 text-sm font-semibold text-center`}
              >
                {g.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CBCSection;
