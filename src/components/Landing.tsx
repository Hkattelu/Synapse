import React from 'react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/Select';
import { Card } from './ui/Card';
import { Separator } from './ui/Separator';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
<<<<<<< HEAD
import Play from 'lucide-react/dist/esm/icons/play.js';
import Video from 'lucide-react/dist/esm/icons/video.js';
import Users from 'lucide-react/dist/esm/icons/users.js';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Heart from 'lucide-react/dist/esm/icons/heart.js';
import Github from 'lucide-react/dist/esm/icons/github.js';
import Twitter from 'lucide-react/dist/esm/icons/twitter.js';
import Youtube from 'lucide-react/dist/esm/icons/youtube.js';
import Mail from 'lucide-react/dist/esm/icons/mail.js';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.js';
import Phone from 'lucide-react/dist/esm/icons/phone.js';
=======
import {
  Play,
  Video,
  Users,
  Sparkles,
  Heart,
  Github,
  Twitter,
  Youtube,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
>>>>>>> 9eda38b (Implement some more composition features)

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
}

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ContactFormProps {
  onSubmit?: (data: any) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Create Amazing Videos with Synapse Studio',
  subtitle = 'Made with ❤️ for creators, by creators',
  description = 'The human-friendly video creation tool for educational content and game devlogs. No AI fluff, just pure creative power in your hands.',
  primaryCtaText = 'Start Creating',
  secondaryCtaText = 'View Recent Projects',
}) => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const heroElement = document.getElementById('hero-section');
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove);
      return () =>
        heroElement.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <section
      id="hero-section"
      className="relative min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50 overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1220 810"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <g clipPath="url(#clip0_hero)">
            {[...Array(35)].map((_, i) => (
              <React.Fragment key={`row-${i}`}>
                {[...Array(23)].map((_, j) => (
                  <rect
                    key={`${i}-${j}`}
                    x={-20.0891 + i * 36}
                    y={9.2 + j * 36}
                    width="35.6"
                    height="35.6"
                    stroke="rgb(147 51 234)"
                    strokeOpacity="0.1"
                    strokeWidth="0.4"
                    strokeDasharray="2 2"
                    className="transition-all duration-300 hover:stroke-opacity-30"
                  />
                ))}
              </React.Fragment>
            ))}

            <circle
              cx={mousePosition.x}
              cy={mousePosition.y}
              r="120"
              fill="url(#mouseGradient)"
              opacity="0.05"
              className="pointer-events-none transition-opacity duration-300"
            />
          </g>

          <defs>
            <radialGradient id="mouseGradient" cx="0" cy="0" r="1">
              <stop offset="0%" stopColor="rgb(147 51 234)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <clipPath id="clip0_hero">
              <rect width="1220" height="810" rx="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-sm font-medium text-purple-700 mb-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {subtitle}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2" />
              {primaryCtaText}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-full font-semibold text-lg"
            >
              <Video className="w-5 h-5 mr-2" />
              {secondaryCtaText}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center space-x-8 pt-12 text-sm text-gray-500"
          >
            <div className="text-center">
              <div className="font-semibold text-gray-900 text-lg">10K+</div>
              <div>Creators</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <div className="font-semibold text-gray-900 text-lg">50K+</div>
              <div>Videos Created</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <div className="font-semibold text-gray-900 text-lg">Human</div>
              <div>Powered</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center p-6"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Video className="w-8 h-8 text-purple-600" />,
      title: 'Intuitive Video Editor',
      description:
        'Drag-and-drop simplicity meets professional power. Create stunning educational content without the learning curve.',
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: 'Built for Creators',
      description:
        'Designed specifically for YouTubers, educators, and game developers who want to tell their story authentically.',
    },
    {
      icon: <Heart className="w-8 h-8 text-purple-600" />,
      title: 'Human-Centered',
      description:
        'No AI shortcuts or automated content. Just pure creative tools that amplify your unique voice and vision.',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      title: 'Devlog Ready',
      description:
        'Perfect templates and tools for game developers to showcase their progress and connect with their community.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Creators Choose Synapse Studio
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built by a creator who understands the struggle of making authentic,
            engaging content in a world full of generic AI-generated videos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Feature key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection: React.FC<ContactFormProps> = ({ onSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit?.(data);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Let's Create Together
            </h2>
            <p className="text-xl text-gray-600">
              Have questions or want to share your creative vision? We'd love to
              hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Get in Touch
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-gray-600">hello@synapsestudio.com</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-gray-600">
                    Built with love, globally distributed
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-gray-600">
                    Community Discord available
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Follow Our Journey
                </h4>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <Youtube className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <Twitter className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <Github className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            <Card className="p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="project-type">Project Type</Label>
                  <Select name="projectType">
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="What are you creating?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational">
                        Educational Content
                      </SelectItem>
                      <SelectItem value="devlog">Game Devlog</SelectItem>
                      <SelectItem value="tutorial">Tutorial Series</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Tell us about your project</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-2"
                    placeholder="What kind of content are you excited to create?"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Synapse Studio</span>
            </div>
            <p className="text-gray-400 text-sm">
              Human-powered video creation for authentic storytellers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Templates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  YouTube
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>
            &copy; 2024 Synapse Studio. Made with ❤️ by creators, for creators.
          </p>
          <p className="mt-2 md:mt-0">
            Building the future of authentic content creation.
          </p>
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>2024 Synapse Studio. Made with ❤️ by creators, for creators.</p>
          <p className="mt-2 md:mt-0">
            Building the future of authentic content creation.
          </p>
        </div>
      </div>
    </footer>
  );
};

const SynapseStudioLanding: React.FC = () => {
  const handleContactSubmit = (data: any) => {
    console.log('Contact form submitted:', data);
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <ContactSection onSubmit={handleContactSubmit} />
      <Footer />
    </div>
  );
};

export default SynapseStudioLanding;
