import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BarChart3, Loader2, Save } from "lucide-react";

const CreateExam = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    duration_minutes: 60,
    total_marks: 100,
    passing_marks: 40,
    instructions: "",
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/admin/login");
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("exams").insert({
        title: formData.title,
        subject: formData.subject,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes,
        total_marks: formData.total_marks,
        passing_marks: formData.passing_marks,
        instructions: formData.instructions || null,
        is_active: formData.is_active,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Exam Created",
        description: "The exam has been successfully created.",
      });
      navigate("/admin/exams");
    } catch (error: any) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exam.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <div className="font-display font-bold text-xl">Create New Exam</div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>Fill in the details for the new exam</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Exam Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Mathematics Final Exam"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the exam"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        min={1}
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_marks">Total Marks *</Label>
                      <Input
                        id="total_marks"
                        type="number"
                        min={1}
                        value={formData.total_marks}
                        onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 100 })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passing_marks">Passing Marks *</Label>
                      <Input
                        id="passing_marks"
                        type="number"
                        min={1}
                        value={formData.passing_marks}
                        onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) || 40 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Exam instructions for students"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label htmlFor="is_active" className="font-medium">Active Status</Label>
                      <p className="text-sm text-muted-foreground">Make this exam available to students</p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" variant="hero" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Exam
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/admin/exams">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;
