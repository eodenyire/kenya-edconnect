import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                DigiStudent<span className="text-primary">Pro</span>
              </span>
            </div>
            <p className="text-secondary-foreground/70 text-sm max-w-sm leading-relaxed">
              Transforming education in Kenya with an integrated digital
              ecosystem built for the Competency-Based Curriculum.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-4">Modules</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><a href="#digiguide" className="hover:text-primary transition-colors">DigiGuide</a></li>
              <li><a href="#digilab" className="hover:text-primary transition-colors">DigiLab</a></li>
              <li><a href="#digichat" className="hover:text-primary transition-colors">DigiChat</a></li>
              <li><a href="#digiblog" className="hover:text-primary transition-colors">DigiBlog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-4">Compliance</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>Kenya Data Protection Act 2019</li>
              <li>Child Safety Standards</li>
              <li>KUCCPS Integration</li>
              <li>CBC Framework</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center text-xs text-secondary-foreground/50">
          © {new Date().getFullYear()} DigiStudentPro. Built with ❤️ for Kenyan learners.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
