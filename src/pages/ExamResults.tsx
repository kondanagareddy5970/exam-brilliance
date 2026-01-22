import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Home,
  FileText,
  Award
} from "lucide-react";

const ExamResults = () => {
  const location = useLocation();
  const { score = 3, total = 5, questions = [], answers = {} } = location.state || {};
  
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 40;

  const getGrade = () => {
    if (percentage >= 90) return { grade: "A+", color: "text-success" };
    if (percentage >= 80) return { grade: "A", color: "text-success" };
    if (percentage >= 70) return { grade: "B+", color: "text-primary" };
    if (percentage >= 60) return { grade: "B", color: "text-primary" };
    if (percentage >= 50) return { grade: "C", color: "text-warning" };
    if (percentage >= 40) return { grade: "D", color: "text-warning" };
    return { grade: "F", color: "text-destructive" };
  };

  const { grade, color } = getGrade();

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Result Summary */}
          <Card variant="elevated" className="overflow-hidden">
            <div className={`p-8 text-center ${passed ? "bg-gradient-primary" : "bg-destructive"} text-primary-foreground`}>
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary-foreground/20 mb-4">
                {passed ? (
                  <Trophy className="h-10 w-10" />
                ) : (
                  <XCircle className="h-10 w-10" />
                )}
              </div>
              <h1 className="font-display text-3xl font-bold mb-2">
                {passed ? "Congratulations!" : "Keep Trying!"}
              </h1>
              <p className="opacity-90">
                {passed 
                  ? "You have successfully passed the examination." 
                  : "You did not meet the passing criteria. Don't give up!"}
              </p>
            </div>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-4xl font-display font-bold text-primary">{score}</div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
                <div>
                  <div className="text-4xl font-display font-bold">{total}</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div>
                  <div className="text-4xl font-display font-bold">{percentage}%</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div>
                  <div className={`text-4xl font-display font-bold ${color}`}>{grade}</div>
                  <div className="text-sm text-muted-foreground">Grade</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Performance Breakdown
              </CardTitle>
              <CardDescription>Detailed analysis of your exam performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-success/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Correct Answers</span>
                  </div>
                  <span className="font-semibold text-success">{score}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span>Incorrect Answers</span>
                  </div>
                  <span className="font-semibold text-destructive">{total - score}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span>Passing Score Required</span>
                  </div>
                  <span className="font-semibold">40%</span>
                </div>
              </div>

              {/* Visual Progress */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Your Performance</span>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      passed ? "bg-gradient-to-r from-success to-accent" : "bg-destructive"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="text-warning">40% (Pass)</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/exams">
                <FileText className="mr-2 h-5 w-5" />
                View More Exams
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExamResults;
