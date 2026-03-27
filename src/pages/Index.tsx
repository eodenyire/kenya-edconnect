import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ModulesSection from "@/components/ModulesSection";
import FeaturesSection from "@/components/FeaturesSection";
import CBCSection from "@/components/CBCSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ModulesSection />
      <FeaturesSection />
      <CBCSection />
      <Footer />
    </div>
  );
};

export default Index;
