import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import {
  Shield,
  Clock,
  BarChart3,
  Users,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import howItWorksBg from "@/assets/how-it-works-bg.jpg";
import ctaBg from "@/assets/cta-bg.jpg";

const Index = () => {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrollY = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrollY * 0.4}px) scale(1.1)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Secure Testing",
      description: "Advanced security measures to ensure exam integrity and prevent cheating.",
    },
    {
      icon: Clock,
      title: "Timed Exams",
      description: "Precise countdown timers with auto-save and auto-submit functionality.",
    },
    {
      icon: BarChart3,
      title: "Instant Results",
      description: "Get immediate results and detailed performance analytics after submission.",
    },
    {
      icon: Users,
      title: "Multi-User Support",
      description: "Manage thousands of students with role-based access control.",
    },
  ];

  const stats = [
    { value: "50K+", label: "Students" },
    { value: "1000+", label: "Exams" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[600px]">
        <div
          ref={parallaxRef}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 will-change-transform"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/90" />

        <div className="container relative py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>Trusted by 50,000+ students worldwide</span>
            </div>

            <h1 className="mb-6 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Take Your Exams{" "}
              <span className="text-gradient">Online</span> with Confidence
            </h1>

            <p className="mb-8 text-lg text-muted-foreground sm:text-xl animate-slide-up" style={{ animationDelay: "0.2s" }}>
              A secure, intuitive platform for online examinations.
              Whether you're a student preparing for success or an institution managing assessments,
              ExamPortal delivers a seamless experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Start Your Exam
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold mb-4">
              Everything You Need for Successful Exams
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools and features needed to conduct fair,
              secure, and efficient online examinations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} variant="interactive" className="group">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${howItWorksBg})` }}
        />
        <div className="absolute inset-0 bg-background/90" />
        <div className="container relative">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Register", description: "Create your account with basic details and verify your email." },
              { step: "02", title: "Select Exam", description: "Browse available exams and choose the one you want to take." },
              { step: "03", title: "Take Exam", description: "Complete your exam with our secure, timed examination interface." },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-display text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${ctaBg})` }}
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="container relative">
          <Card variant="gradient" className="overflow-hidden">
            <div className="relative p-8 md:p-12 lg:p-16 text-primary-foreground backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, hsl(221 83% 53% / 0.95), hsl(238 83% 60% / 0.95))' }}>
              <div className="relative max-w-2xl mx-auto text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-6 opacity-90" />
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Ready to Excel in Your Exams?
                </h2>
                <p className="text-lg opacity-90 mb-8">
                  Join thousands of students who trust ExamPortal for their online assessments.
                  Register now and take your first step towards success.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button variant="glass" size="lg" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20" asChild>
                    <Link to="/register">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Register Now
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
