import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/layout/Layout";
import { 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Shield,
  Monitor,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExamDetails {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  instructions: string | null;
  question_count: number;
}

const ExamInstructions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access exam instructions.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchExamDetails = async () => {
      if (!examId || !user) return;

      try {
        const { data: candidateData } = await supabase
          .from("candidates")
          .select("*")
          .eq("exam_id", examId)
          .eq("user_id", user.id)
          .single();

        if (!candidateData) {
          toast({
            title: "Registration Required",
            description: "Please register for this exam first.",
            variant: "destructive",
          });
          navigate(`/exam/${examId}/register`);
          return;
        }

        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single();

        if (examError) throw examError;

        const { count: questionCount } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examId);

        setExamDetails({
          ...examData,
          question_count: questionCount || 0,
        });
      } catch (error) {
        console.error("Error fetching exam:", error);
        toast({
          title: "Error",
          description: "Failed to load exam details.",
          variant: "destructive",
        });
        navigate("/exams");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchExamDetails();
    }
  }, [examId, user, authLoading, navigate, toast]);

  const rules = [
    "You must complete the exam within the given time limit.",
    "Each question carries equal marks unless otherwise stated.",
    "There is no negative marking for wrong answers.",
    "You can navigate between questions using the navigation panel.",
    "Your answers are auto-saved every 30 seconds.",
    "Once submitted, you cannot modify your answers.",
    "Switching tabs or windows may be flagged as suspicious activity.",
    "Ensure stable internet connection throughout the exam.",
  ];

  const handleStartExam = () => {
    navigate(`/exam/${examId}/take`);
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading exam instructions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!examDetails) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Exam not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Exam Overview */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-2xl font-display">{examDetails.title}</CardTitle>
              <CardDescription>Please read all instructions carefully before starting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg font-semibold">{examDetails.duration_minutes} min</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg font-semibold">{examDetails.question_count}</div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                  <div className="text-lg font-semibold">{examDetails.total_marks}</div>
                  <div className="text-xs text-muted-foreground">Total Marks</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-warning" />
                  <div className="text-lg font-semibold">{examDetails.passing_marks}</div>
                  <div className="text-xs text-muted-foreground">Passing Marks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Exam Rules & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Technical Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Technical Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Stable internet connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Modern web browser (Chrome, Firefox, Safari)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>JavaScript enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Minimum screen resolution: 1024x768</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accept Terms */}
          <Card variant="outline" className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I have read and understood all the instructions and rules. I agree to abide by 
                  the examination guidelines and understand that any violation may result in 
                  disqualification. I confirm that I will not engage in any form of malpractice 
                  during the examination.
                </label>
              </div>

              <Button 
                variant="hero" 
                size="lg" 
                className="w-full mt-6"
                disabled={!accepted}
                onClick={handleStartExam}
              >
                Start Examination
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ExamInstructions;
