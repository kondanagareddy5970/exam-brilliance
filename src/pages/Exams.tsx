import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { Clock, FileText, Users, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  question_count?: number;
  participant_count?: number;
}

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to view available exams.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchExams = async () => {
      try {
        const { data: examsData, error: examsError } = await supabase
          .from("exams")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (examsError) throw examsError;

        const examsWithCounts = await Promise.all(
          (examsData || []).map(async (exam) => {
            const { count: questionCount } = await supabase
              .from("questions")
              .select("*", { count: "exact", head: true })
              .eq("exam_id", exam.id);

            const { count: participantCount } = await supabase
              .from("candidates")
              .select("*", { count: "exact", head: true })
              .eq("exam_id", exam.id);

            return {
              ...exam,
              question_count: questionCount || 0,
              participant_count: participantCount || 0,
            };
          })
        );

        setExams(examsWithCounts);
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast({
          title: "Error",
          description: "Failed to load exams. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchExams();
    }
  }, [user, authLoading, navigate, toast]);

  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const startDate = exam.start_date ? new Date(exam.start_date) : null;
    const endDate = exam.end_date ? new Date(exam.end_date) : null;

    if (endDate && now > endDate) return "completed";
    if (startDate && now >= startDate && (!endDate || now <= endDate)) return "active";
    return "upcoming";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-primary text-primary-foreground">Upcoming</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading exams...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Available Exams</h1>
          <p className="text-muted-foreground">
            Browse and register for upcoming examinations
          </p>
        </div>

        {exams.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exams Available</h3>
            <p className="text-muted-foreground">
              There are no active exams at the moment. Please check back later.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <Card key={exam.id} variant="interactive" className="group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{exam.subject}</Badge>
                      {getStatusBadge(status)}
                    </div>
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {exam.start_date 
                          ? new Date(exam.start_date).toLocaleDateString() 
                          : "Available Now"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {exam.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">{exam.duration_minutes} min</div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">{exam.question_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Questions</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">{exam.participant_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Students</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={status === "active" ? "hero" : "outline"} 
                      className="w-full"
                      disabled={status === "completed"}
                      asChild
                    >
                      <Link to={`/exam/${exam.id}/register`}>
                        {status === "active" ? "Start Exam" : status === "upcoming" ? "Register" : "View Results"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Exams;
