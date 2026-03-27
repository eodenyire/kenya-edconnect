import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-students.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-hero-gradient pt-16">
      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-primary-foreground/5 blur-3xl" />

      <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur rounded-full px-4 py-1.5 w-fit">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground/90">
              Kenya's CBC Digital Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] text-primary-foreground">
            Empowering Every{" "}
            <span className="relative">
              Kenyan Learner
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 8C60 2 240 2 298 8" stroke="hsl(38,92%,50%)" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{" "}
            to Excel
          </h1>

          <p className="text-lg text-primary-foreground/75 max-w-lg leading-relaxed">
            AI-powered career guidance, comprehensive learning resources,
            mentorship, and community — all built for Kenya's Competency-Based
            Curriculum from Pre-Primary to University.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 glow-gold font-semibold"
            >
              Explore Platform
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Learn More
            </Button>
          </div>

          <div className="flex items-center gap-6 mt-4">
            {[
              { num: "6", label: "CBC Levels" },
              { num: "4", label: "Core Modules" },
              { num: "9", label: "KUCCPS Clusters" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-display font-bold text-accent">
                  {stat.num}
                </div>
                <div className="text-xs text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={heroImg}
              alt="Kenyan students learning with digital technology"
              className="w-full h-[480px] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-lg border border-border animate-float">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-card-foreground">AI Career Guidance</div>
                <div className="text-xs text-muted-foreground">Powered by DigiGuide</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
