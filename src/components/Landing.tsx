import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { isEnabled } from '../lib/flags';
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
import {
  Play,
  Video,
  Users,
  Sparkles,
  Heart,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';
import { section } from 'motion/react-client';

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
  onSubmit?: (data: Record<string, FormDataEntryValue>) => Promise<void>;
  isSubmitting?: boolean;
  submitStatus?: 'idle' | 'success' | 'error';
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Create Engaging Lessons and Tutorials',
  subtitle = 'Built for educators and learning creators',
  description =
    'Plan, record, and polish educational videos with tools for AI-assisted drafting, accessible captions, interactive callouts, and gamified pacing — without sacrificing your voice.',
  primaryCtaText = 'Create a Lesson',
  secondaryCtaText = 'Get Notified',
}) => {
  const navigate = useNavigate();
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
      className="relative min-h-screen bg-synapse-background overflow-hidden flex items-center"
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

      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {isEnabled('PRODUCT_HUNT') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-synapse-primary/10 border border-synapse-primary text-sm font-medium text-synapse-primary mb-6 shadow-synapse-sm"
            >
              <span className="mr-2">🚀</span>
              {subtitle}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold synapse-text-gradient mb-6 leading-tight"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-text-secondary mb-10 leading-relaxed"
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
              onClick={() => navigate('/projects')}
className="bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse px-8 py-4 rounded-full font-semibold text-lg shadow-synapse-md hover:shadow-synapse-lg synapse-glow transition-all duration-200 hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2" />
              Create a Lesson
            </Button>
            {isEnabled('PRODUCT_HUNT') && (
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  window.open(
                    'https://www.producthunt.com/products/synapse-studio',
                    '_blank'
                  )
                }
                className="border-synapse-primary text-synapse-primary hover:bg-synapse-primary/10 px-8 py-4 rounded-full font-semibold text-lg shadow-synapse-sm"
              >
                <Heart className="w-5 h-5 mr-2" />
                Support on Product Hunt
              </Button>
            )}
          </motion.div>

          {/* Credibility strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary text-xs">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Built for devs</span>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary text-xs">
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Local-first today</span>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary text-xs">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Studio-grade timeline</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-12"
          >
            {isEnabled('PRODUCT_HUNT') && (
              <>
                {/* Product Hunt Launch Countdown */}
                <div className="bg-synapse-surface border border-synapse-border rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      🎯 Product Hunt Launch
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Join us on September 5th, 2025 and help us reach #1
                      Product of the Day!
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div className="bg-synapse-surface rounded-lg px-3 py-2 shadow-synapse-sm">
                        <div className="font-bold text-synapse-primary text-lg">
                          Sep 5
                        </div>
                        <div className="text-text-tertiary">2025</div>
                      </div>
                      <div className="text-synapse-primary font-medium">
                        Mark your calendars!
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center space-x-8 text-sm text-text-tertiary">
<div className="text-center">
                <div className="font-semibold text-text-primary text-lg">
                  10K+
                </div>
                <div>Educators & Creators</div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <div className="font-semibold text-text-primary text-lg">
                  50K+
                </div>
                <div>Videos Created</div>
              </div>
              <Separator orientation="vertical" className="h-8" />
<div className="text-center">
                <div className="font-semibold text-text-primary text-lg">
                  Inclusive
                </div>
                <div>By Design</div>
              </div>
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
      className="text-center p-6 rounded-2xl bg-synapse-surface border border-border-subtle shadow-synapse-md hover:shadow-synapse-lg ring-1 ring-transparent hover:ring-synapse-primary/20 ring-offset-1 ring-offset-synapse-background transition-all"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 bg-synapse-primary/10 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
};

const ProductHuntSection: React.FC = () => {
  return (
    <section className="py-16 synapse-brand-gradient">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center text-synapse-text-inverse"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            🚀 We're Launching on Product Hunt!
          </h2>
          <p className="text-xl mb-8 text-synapse-text-inverse/80 max-w-2xl mx-auto">
            Help us reach #1 Product of the Day on September 5th, 2025. Your
            support means everything to our creator community!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() =>
                window.open(
                  'https://www.producthunt.com/products/synapse-studio',
                  '_blank'
                )
              }
              className="bg-synapse-surface text-text-primary hover:bg-synapse-surface-hover border border-border-subtle px-8 py-4 rounded-full font-semibold text-lg shadow-synapse-md hover:shadow-synapse-lg transition-all duration-200 hover:scale-105"
            >
              <Heart className="w-5 h-5 mr-2" />
              Support Us on Product Hunt
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                navigator.share?.({
                  title: 'Synapse Studio - Human-Powered Video Creation',
                  text: 'Check out Synapse Studio launching on Product Hunt!',
                  url: 'https://www.producthunt.com/products/synapse-studio',
                }) ||
                window.open(
                  'https://twitter.com/intent/tweet?text=Excited%20for%20@SynapseStudio%20launching%20on%20Product%20Hunt!%20%F0%9F%9A%80&url=https://www.producthunt.com/products/synapse-studio',
                  '_blank'
                )
              }
              className="border-synapse-text-inverse text-synapse-text-inverse hover:bg-synapse-text-inverse/20 bg-transparent px-8 py-4 rounded-full font-semibold text-lg shadow-synapse-sm"
            >
              <Users className="w-5 h-5 mr-2" />
              Share with Friends
            </Button>
          </div>
          <div className="mt-8 text-orange-100">
            <p className="text-sm">
              📅 Launch Date: September 5th, 2025 • 🎯 Goal: #1 Product of the
              Day
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8 text-synapse-primary" />,
      title: 'AI Assist for Lesson Building',
      description:
        'Draft outlines, objectives, and chapter markers faster — you stay in control of the final lesson.',
    },
    {
      icon: <Video className="w-8 h-8 text-synapse-primary" />,
      title: 'Accessible by Design',
      description:
        'Effortless captions, transcripts, and readable templates help every learner follow along.',
    },
    {
      icon: <Layers className="w-8 h-8 text-synapse-primary" />,
      title: 'Tools for Teachers',
      description:
        'Reusable lesson templates, brand kits, and curriculum-friendly timelines fit your classroom workflow.',
    },
    {
      icon: <Heart className="w-8 h-8 text-synapse-primary" />,
      title: 'Student Wellness & Productivity',
      description:
        'Clear pacing, distraction-aware layouts, and breaks built into templates support healthier learning.',
    },
  ];

  return (
    <section className="py-20 bg-synapse-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-3">
              <span className="uppercase tracking-wider text-xs text-text-secondary">Features</span>
            </div>
<h2 className="text-4xl md:text-5xl font-extrabold synapse-text-gradient mb-4">
              Why Educators Choose Synapse Studio
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Build clear, inclusive, and engaging learning videos — with your expertise front and center.
            </p>
          </motion.div>
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

const PowerSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="mb-3">
              <span className="uppercase tracking-wider text-xs text-text-secondary">Why Synapse</span>
            </div>
<h2 className="text-4xl md:text-5xl font-extrabold synapse-text-gradient mb-6">
              Purpose-Built for Teaching Impact
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Everything you need to shape effective lessons — from curriculum-friendly timelines to inclusive viewing experiences.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-synapse-surface rounded-2xl p-8 shadow-synapse-md hover:shadow-synapse-lg transition-shadow border border-border-subtle ring-1 ring-transparent hover:ring-synapse-primary/20 ring-offset-1 ring-offset-synapse-background"
            >
              <div className="w-16 h-16 bg-synapse-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-synapse-primary" />
              </div>
<h3 className="text-2xl font-bold text-text-primary mb-4">
                Curriculum-Aligned Workflow
              </h3>
              <p className="text-text-secondary mb-6">
                Plan modules, objectives, and chapter markers with a clear, flexible timeline.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-primary rounded-full mr-3"></div>
                  Chapter and objective markers
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-primary rounded-full mr-3"></div>
                  Reusable lesson templates
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-primary rounded-full mr-3"></div>
                  Interactive callouts and overlays
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-synapse-surface rounded-2xl p-8 shadow-synapse-md hover:shadow-synapse-lg transition-shadow border border-border-subtle ring-1 ring-transparent hover:ring-synapse-primary/20 ring-offset-1 ring-offset-synapse-background"
            >
              <div className="w-16 h-16 bg-synapse-success/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-synapse-success" />
              </div>
<h3 className="text-2xl font-bold text-text-primary mb-4">
                Accessible by Default
              </h3>
              <p className="text-text-secondary mb-6">
                Reach every learner with built-in accessibility tools and best practices.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-success rounded-full mr-3"></div>
                  Captions and transcripts
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-success rounded-full mr-3"></div>
                  Readable color contrast
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-success rounded-full mr-3"></div>
                  Keyboard-friendly UI
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-synapse-surface rounded-2xl p-8 shadow-synapse-md hover:shadow-synapse-lg transition-shadow border border-border-subtle ring-1 ring-transparent hover:ring-synapse-primary/20 ring-offset-1 ring-offset-synapse-background"
            >
              <div className="w-16 h-16 bg-synapse-info/10 rounded-xl flex items-center justify-center mb-6">
                <Layers className="w-8 h-8 text-synapse-info" />
              </div>
<h3 className="text-2xl font-bold text-text-primary mb-4">
                Teacher-First Flexibility
              </h3>
              <p className="text-text-secondary mb-6">
                Fit lectures, tutorials, labs, and flipped-class workflows without friction.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-info rounded-full mr-3"></div>
                  Custom templates
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-info rounded-full mr-3"></div>
                  Multi-track timeline
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-synapse-info rounded-full mr-3"></div>
                  Brand kits for courses
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              onClick={() => navigate('/projects')}
className="bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse px-8 py-4 rounded-full font-semibold text-lg shadow-synapse-md hover:shadow-synapse-lg synapse-glow transition-all duration-200 hover:scale-105"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Get Started Now
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ContactSection: React.FC<ContactFormProps> = ({
  onSubmit,
  isSubmitting = false,
  submitStatus = 'idle',
}) => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    // Basic client-side validation
    if (!data.name || !data.email || !data.message) {
      alert('Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email as string)) {
      alert('Please enter a valid email address.');
      return;
    }

    await onSubmit?.(data);
  };

  // Reset form when submission is successful
  React.useEffect(() => {
    if (submitStatus === 'success') {
      formRef.current?.reset();
    }
  }, [submitStatus]);

  return (
    <section className="py-20 bg-background-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Let's Create Together
            </h2>
            <p className="text-xl text-text-secondary">
              Have questions or want to share your creative vision? We'd love to
              hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">
                Get in Touch
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
<Mail className="w-5 h-5 text-synapse-primary mr-3" />
                  <a
                    href="mailto:glowstringman@gmail.com"
                    className="text-text-secondary hover:text-synapse-primary transition-colors"
                  >
                    glowstringman@gmail.com
                  </a>
                </div>
                <div className="flex items-center">
<MapPin className="w-5 h-5 text-synapse-primary mr-3" />
                  <span className="text-text-secondary">
                    Built with love, globally distributed
                  </span>
                </div>
                <div className="flex items-center">
<Phone className="w-5 h-5 text-synapse-primary mr-3" />
                  <span className="text-text-secondary">
                    Community Discord available
                  </span>
                </div>
              </div>
            </div>

            <Card className="p-8 shadow-synapse-md">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
                      <SelectItem value="lesson">Lesson or Lecture</SelectItem>
                      <SelectItem value="module">Course Module</SelectItem>
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
                    placeholder="What kind of learning experience are you planning?"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-synapse-primary hover:bg-synapse-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-synapse-text-inverse"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="mt-4 p-4 bg-synapse-success/10 border border-synapse-success rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-synapse-success text-sm font-medium">
                          Message sent successfully!
                        </p>
                        <p className="text-synapse-success text-sm mt-1">
                          Thank you for reaching out. We'll get back to you
                          within 24 hours at the email address you provided.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mt-4 p-3 bg-status-error/10 border border-status-error rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-600 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-status-error text-sm">
                        Failed to send message. Please try again or email us
                        directly at glowstringman@gmail.com
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-background-tertiary text-text-primary py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="p-2">
              <img
                src="/branding/logo.svg"
                alt="Synapse Studio"
                className="h-8 bg-[color:var(--synapse-contrast-chip)] rounded-md p-1 shadow-synapse-sm"
              />
            </div>
            <p className="text-text-tertiary text-sm">
              Human-powered video creation for educators and learning creators.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-text-tertiary">
              <li>
                <a
                  href="#features"
                  className="hover:text-text-primary transition-colors"
                >
                  Features
                </a>
              </li>
              {isEnabled('PRODUCT_HUNT') && (
                <li>
                  <button
                    onClick={() =>
                      window.open(
                        'https://www.producthunt.com/products/synapse-studio',
                        '_blank'
                      )
                    }
                    className="hover:text-orange-400 transition-colors text-left"
                  >
                    🚀 Product Hunt
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-text-tertiary">
              <li>
                <a
                  href="#contact"
                  className="hover:text-text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-text-primary transition-colors"
                >
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          <div></div>
        </div>

        <Separator className="my-8 bg-border-subtle" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-text-tertiary">
          <p>
            &copy; 2024 Synapse Studio. Made with ❤️ by creators, for creators.
          </p>
          <p className="mt-2 md:mt-0">
            Building the future of authentic content creation.
          </p>
        </div>
      </div>
    </footer>
  );
};

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-synapse-surface/80 backdrop-blur-md border-b border-border-subtle">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="bg-[color:var(--synapse-contrast-chip)] rounded-md p-1 shadow-synapse-sm">
            <img
              src="/branding/logo.svg"
              alt="Synapse Studio"
              className="h-8 w-auto"
            />
            <span className="sr-only">Synapse Studio</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-text-secondary hover:text-synapse-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#power"
              className="text-text-secondary hover:text-synapse-primary transition-colors"
            >
              Why Choose Us
            </a>
            {isEnabled('PRODUCT_HUNT') && (
              <button
                onClick={() =>
                  window.open(
                    'https://www.producthunt.com/products/synapse-studio',
                    '_blank'
                  )
                }
                className="text-orange-600 hover:text-orange-700 transition-colors font-medium"
              >
                🚀 Product Hunt
              </button>
            )}
            <a
              href="#contact"
              className="text-text-secondary hover:text-synapse-primary transition-colors"
            >
              Contact
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/projects')}
              className="bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const SynapseStudioLanding: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle');

  const handleContactSubmit = async (
    data: Record<string, FormDataEntryValue>
  ) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const name = (data.name as string) || '';
    const email = (data.email as string) || '';
    const message = (data.message as string) || '';
    const projectType = (data.projectType as string) || 'Not specified';

    const subject = `New Contact Form Submission from ${name}`;
    const timestamp = new Date().toLocaleString();

    const emailBody = `Name: ${name}\nEmail: ${email}\nProject Type: ${projectType}\nTimestamp: ${timestamp}\n\nMessage:\n${message}`;

    try {
      await api.submitContact({ name, email, message });
      setSubmitStatus('success');
      return;
    } catch (err) {
      console.warn('Contact API failed, falling back to mailto...', err);
      // Fallback to mailto if API is not available or errors out
      const mailtoLink = `mailto:glowstringman@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      try {
        window.location.href = mailtoLink;
        setSubmitStatus('success');
      } catch (fallbackErr) {
        console.error('Mailto fallback failed:', fallbackErr);
        setSubmitStatus('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-16">
        <HeroSection />
        {isEnabled('PRODUCT_HUNT') && <ProductHuntSection />}
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="power">
          <PowerSection />
        </div>
        <div id="contact">
          <ContactSection
            onSubmit={handleContactSubmit}
            isSubmitting={isSubmitting}
            submitStatus={submitStatus}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default SynapseStudioLanding;
