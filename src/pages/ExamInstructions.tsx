import { useState } from "react";
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
  ArrowRight
} from "lucide-react";

const ExamInstructions = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const examDetails = {
    title: "Workday Exam",
    duration: 30,
    totalQuestions: 4,
    totalMarks: 40,
    passingMarks: 20,
  };

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
                  <div className="text-lg font-semibold">{examDetails.duration} min</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg font-semibold">{examDetails.totalQuestions}</div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                  <div className="text-lg font-semibold">{examDetails.totalMarks}</div>
                  <div className="text-xs text-muted-foreground">Total Marks</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-warning" />
                  <div className="text-lg font-semibold">{examDetails.passingMarks}</div>
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
