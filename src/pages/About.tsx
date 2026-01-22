import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Award, Globe } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "We prioritize the security and integrity of every examination with advanced anti-cheating measures.",
    },
    {
      icon: Users,
      title: "Student-Centric",
      description: "Our platform is designed with students in mind, ensuring a smooth and stress-free examination experience.",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in every feature, from question design to result delivery.",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Available anywhere, anytime. Take your exams from the comfort of your home.",
    },
  ];

  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl font-bold mb-4">
              About <span className="text-gradient">ExamPortal</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to transform online education by providing secure, 
              reliable, and user-friendly examination solutions for institutions worldwide.
            </p>
          </div>

          {/* Story */}
          <Card variant="gradient" className="mb-16">
            <CardContent className="p-8 md:p-12">
              <h2 className="font-display text-2xl font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                ExamPortal was born out of the need for a modern, secure, and accessible 
                online examination platform. Founded in 2024, we recognized that traditional 
                examination methods were becoming outdated and often inaccessible to many students.
              </p>
              <p className="text-muted-foreground">
                Today, we serve thousands of students and hundreds of institutions, 
                providing them with the tools they need to conduct fair and efficient 
                online assessments. Our platform combines cutting-edge technology with 
                intuitive design to create an examination experience that's both secure 
                and stress-free.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-center mb-8">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card key={index} variant="interactive">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <value.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold mb-2">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-lg bg-muted">
              <div className="font-display text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Students</div>
            </div>
            <div className="p-6 rounded-lg bg-muted">
              <div className="font-display text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Institutions</div>
            </div>
            <div className="p-6 rounded-lg bg-muted">
              <div className="font-display text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Exams Conducted</div>
            </div>
            <div className="p-6 rounded-lg bg-muted">
              <div className="font-display text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
