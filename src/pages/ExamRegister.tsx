import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import { User, Mail, Phone, Hash, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  description: string | null;
}

const ExamRegister = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    registrationNumber: "",
    email: "",
    phone: "",
    course: "",
  });

  const courses = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English Literature",
    "Business Administration",
    "Economics",
    "Workday",
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to register for exams.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || "",
        email: profile.email || "",
      }));
    }
  }, [user, profile, authLoading, navigate, toast]);

  useEffect(() => {
    const fetchExamAndCheckRegistration = async () => {
      if (!examId || !user) return;

      try {
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single();

        if (examError) throw examError;
        setExam(examData);

        const { data: candidateData } = await supabase
          .from("candidates")
          .select("*")
          .eq("exam_id", examId)
          .eq("user_id", user.id)
          .single();

        if (candidateData) {
          setAlreadyRegistered(true);
          navigate(`/exam/${examId}/instructions`);
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
        toast({
          title: "Error",
          description: "Failed to load exam details.",
          variant: "destructive",
        });
        navigate("/exams");
      } finally {
        setExamLoading(false);
      }
    };

    if (user) {
      fetchExamAndCheckRegistration();
    }
  }, [examId, user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !examId) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from("candidates").insert({
        user_id: user.id,
        exam_id: examId,
        full_name: formData.fullName,
        registration_number: formData.registrationNumber,
        email: formData.email,
        phone: formData.phone,
        course: formData.course,
      });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "You can now proceed to the exam instructions.",
      });
      navigate(`/exam/${examId}/instructions`);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for exam.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (examLoading || authLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading exam details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card variant="elevated" className="shadow-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display">Exam Registration</CardTitle>
              <CardDescription>
                Please provide your details to register for this exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration / Roll Number</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="registrationNumber"
                        type="text"
                        placeholder="REG-2024-001"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course / Subject</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={formData.course}
                      onValueChange={(value) => setFormData({ ...formData, course: value })}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select your course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <>
                      Proceed to Instructions
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ExamRegister;
