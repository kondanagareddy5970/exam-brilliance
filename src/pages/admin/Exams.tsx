import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Loader2,
  Clock,
  FileText,
  Users,
  Edit,
  Trash2,
  BarChart3,
  ArrowLeft
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  is_active: boolean;
  created_at: string;
  question_count?: number;
  candidate_count?: number;
}

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchExams = async () => {
      try {
        const { data: examsData, error } = await supabase
          .from("exams")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const examsWithCounts = await Promise.all(
          (examsData || []).map(async (exam) => {
            const { count: questionCount } = await supabase
              .from("questions")
              .select("*", { count: "exact", head: true })
              .eq("exam_id", exam.id);

            const { count: candidateCount } = await supabase
              .from("candidates")
              .select("*", { count: "exact", head: true })
              .eq("exam_id", exam.id);

            return {
              ...exam,
              question_count: questionCount || 0,
              candidate_count: candidateCount || 0,
            };
          })
        );

        setExams(examsWithCounts);
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast({
          title: "Error",
          description: "Failed to load exams.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && isAdmin) {
      fetchExams();
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;

    try {
      const { error } = await supabase.from("exams").delete().eq("id", examId);
      if (error) throw error;

      setExams(exams.filter((e) => e.id !== examId));
      toast({
        title: "Exam Deleted",
        description: "The exam has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "Failed to delete exam.",
        variant: "destructive",
      });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-display font-bold text-xl">Manage Exams</div>
          </div>
          <Button variant="hero" asChild>
            <Link to="/admin/exams/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Link>
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid gap-6">
          {exams.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Exams Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first exam to get started.
              </p>
              <Button variant="hero" asChild>
                <Link to="/admin/exams/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Link>
              </Button>
            </Card>
          ) : (
            exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{exam.title}</CardTitle>
                      <Badge variant={exam.is_active ? "default" : "secondary"}>
                        {exam.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>{exam.subject}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/exams/${exam.id}/questions`}>
                        <FileText className="h-4 w-4 mr-1" />
                        Questions
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/exams/${exam.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteExam(exam.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.question_count || 0} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{exam.candidate_count || 0} candidates</span>
                    </div>
                    <div className="text-muted-foreground">
                      Pass: {exam.passing_marks}/{exam.total_marks} marks
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExams;
