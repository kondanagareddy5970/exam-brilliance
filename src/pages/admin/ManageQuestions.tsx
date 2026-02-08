import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  Plus,
  Trash2,
  Save,
  GripVertical
} from "lucide-react";

interface Question {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  marks: number;
  order_index: number;
}

const ManageQuestions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

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

    const fetchData = async () => {
      if (!examId) return;

      try {
        const { data: exam } = await supabase
          .from("exams")
          .select("title")
          .eq("id", examId)
          .single();

        if (exam) setExamTitle(exam.title);

        const { data: questionsData, error } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", examId)
          .order("order_index", { ascending: true });

        if (error) throw error;

        setQuestions(
          (questionsData || []).map((q) => ({
            id: q.id,
            question_text: q.question_text,
            options: (q.options as string[]) || ["", "", "", ""],
            correct_answer: q.correct_answer || 0,
            marks: q.marks,
            order_index: q.order_index,
          }))
        );
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          title: "Error",
          description: "Failed to load questions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && isAdmin) {
      fetchData();
    }
  }, [examId, user, isAdmin, authLoading, navigate, toast]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: 0,
        marks: 1,
        order_index: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!examId) return;
    setSaving(true);

    try {
      // Delete existing questions
      await supabase.from("questions").delete().eq("exam_id", examId);

      // Insert new questions
      const questionsToInsert = questions.map((q, index) => ({
        exam_id: examId,
        question_text: q.question_text,
        question_type: "mcq",
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        order_index: index,
      }));

      const { error } = await supabase.from("questions").insert(questionsToInsert);

      if (error) throw error;

      toast({
        title: "Questions Saved",
        description: `${questions.length} questions saved successfully.`,
      });
    } catch (error: any) {
      console.error("Error saving questions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save questions.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading questions...</p>
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
              <Link to="/admin/exams">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">Manage Questions</div>
              <div className="text-sm text-muted-foreground">{examTitle}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="space-y-6">
          {questions.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add questions to this exam.
              </p>
              <Button variant="hero" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </Card>
          ) : (
            questions.map((q, qIndex) => (
              <Card key={qIndex}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={q.question_text}
                      onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                      placeholder="Enter the question..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correct_answer === oIndex}
                            onChange={() => updateQuestion(qIndex, "correct_answer", oIndex)}
                            className="h-4 w-4"
                          />
                          Option {String.fromCharCode(65 + oIndex)}
                          {q.correct_answer === oIndex && (
                            <span className="text-xs text-success">(Correct)</span>
                          )}
                        </Label>
                        <Input
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="w-32">
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => updateQuestion(qIndex, "marks", parseInt(e.target.value) || 1)}
                    />
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

export default ManageQuestions;
