import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BarChart3, 
  Download, 
  Loader2,
  FileSpreadsheet,
  Users,
  CheckCircle2
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
}

interface ResultData {
  candidate_name: string;
  candidate_email: string;
  registration_number: string;
  course: string;
  exam_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  submitted_at: string;
  violations_count: number;
}

const ExportResults = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [results, setResults] = useState<ResultData[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/admin/login");
      return;
    }

    const fetchExams = async () => {
      try {
        const { data, error } = await supabase
          .from("exams")
          .select("id, title")
          .order("title");

        if (error) throw error;
        setExams(data || []);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && isAdmin) {
      fetchExams();
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const fetchResults = async () => {
    setDownloading(true);

    try {
      let query = supabase
        .from("exam_results")
        .select(`
          score,
          total_marks,
          percentage,
          passed,
          time_taken_seconds,
          created_at,
          exam_attempts (
            violations_count,
            candidates (
              full_name,
              email,
              registration_number,
              course
            )
          ),
          exams (title)
        `)
        .order("created_at", { ascending: false });

      if (selectedExam !== "all") {
        query = query.eq("exam_id", selectedExam);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedResults: ResultData[] = (data || []).map((r: any) => ({
        candidate_name: r.exam_attempts?.candidates?.full_name || "N/A",
        candidate_email: r.exam_attempts?.candidates?.email || "N/A",
        registration_number: r.exam_attempts?.candidates?.registration_number || "N/A",
        course: r.exam_attempts?.candidates?.course || "N/A",
        exam_title: r.exams?.title || "N/A",
        score: r.score || 0,
        total_marks: r.total_marks || 0,
        percentage: r.percentage || 0,
        passed: r.passed || false,
        time_taken_seconds: r.time_taken_seconds || 0,
        submitted_at: r.created_at,
        violations_count: r.exam_attempts?.violations_count || 0,
      }));

      setResults(formattedResults);
      return formattedResults;
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "Error",
        description: "Failed to fetch results.",
        variant: "destructive",
      });
      return [];
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCSV = async () => {
    const data = await fetchResults();
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No results found to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Candidate Name",
      "Email",
      "Registration Number",
      "Course",
      "Exam Title",
      "Score",
      "Total Marks",
      "Percentage",
      "Status",
      "Time Taken (min)",
      "Submitted At",
      "Violations"
    ];

    const csvRows = [
      headers.join(","),
      ...data.map(r => [
        `"${r.candidate_name}"`,
        `"${r.candidate_email}"`,
        `"${r.registration_number}"`,
        `"${r.course}"`,
        `"${r.exam_title}"`,
        r.score,
        r.total_marks,
        r.percentage.toFixed(2),
        r.passed ? "Passed" : "Failed",
        Math.round(r.time_taken_seconds / 60),
        new Date(r.submitted_at).toLocaleString(),
        r.violations_count
      ].join(","))
    ];

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exam_results_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${data.length} results exported successfully.`,
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
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
            <div className="font-display font-bold text-xl">Export Results</div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Export Exam Results
              </CardTitle>
              <CardDescription>
                Download exam results as a CSV file for analysis or record keeping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <h4 className="font-medium">Export includes:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Candidate details (name, email, registration number)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Exam scores and percentages
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Pass/Fail status
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Time taken and submission timestamps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Security violations count
                  </li>
                </ul>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleExportCSV}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Preparing Export...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Export as CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Preview ({results.length} results)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Name</th>
                        <th className="text-left py-2 px-2">Exam</th>
                        <th className="text-right py-2 px-2">Score</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-2">{r.candidate_name}</td>
                          <td className="py-2 px-2">{r.exam_title}</td>
                          <td className="py-2 px-2 text-right">{r.percentage.toFixed(1)}%</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-xs px-2 py-1 rounded ${r.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                              {r.passed ? "Passed" : "Failed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      And {results.length - 5} more...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportResults;
