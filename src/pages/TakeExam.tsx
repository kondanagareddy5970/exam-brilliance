import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag,
  AlertTriangle,
  CheckCircle2,
  Send
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const mockQuestions = [
  {
    id: 1,
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2x²"],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "What is the integral of 2x?",
    options: ["x", "x²", "2x²", "x² + C"],
    correctAnswer: 3,
  },
  {
    id: 3,
    question: "What is the value of sin(90°)?",
    options: ["0", "1", "-1", "0.5"],
    correctAnswer: 1,
  },
  {
    id: 4,
    question: "What is the formula for the area of a circle?",
    options: ["2πr", "πr²", "πd", "2πr²"],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: "What is 15% of 200?",
    options: ["20", "25", "30", "35"],
    correctAnswer: 2,
  },
];

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes in seconds
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save
  useEffect(() => {
    const autoSave = setInterval(() => {
      // Simulate auto-save
      console.log("Auto-saving answers:", answers);
    }, 30000);

    return () => clearInterval(autoSave);
  }, [answers]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleAutoSubmit = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "Your exam has been automatically submitted.",
      variant: "destructive",
    });
    submitExam();
  }, [answers]);

  const submitExam = () => {
    setIsSubmitting(true);
    // Calculate score
    let correct = 0;
    mockQuestions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    setTimeout(() => {
      navigate(`/exam/${examId}/results`, { 
        state: { 
          score: correct, 
          total: mockQuestions.length,
          answers,
          questions: mockQuestions 
        } 
      });
    }, 1500);
  };

  const question = mockQuestions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / mockQuestions.length) * 100;
  const isUrgent = timeLeft <= 300; // Less than 5 minutes

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-display font-semibold">Mathematics Final Exam</div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isUrgent ? "bg-destructive/10 text-destructive timer-urgent" : "bg-muted"}`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{answeredCount} of {mockQuestions.length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Question {currentQuestion + 1}</CardTitle>
                <Button
                  variant={flagged.has(question.id) ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => toggleFlag(question.id)}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {flagged.has(question.id) ? "Flagged" : "Flag for Review"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg font-medium">{question.question}</p>

                <RadioGroup
                  value={answers[question.id]?.toString()}
                  onValueChange={(value) => handleAnswerSelect(question.id, parseInt(value))}
                >
                  {question.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer
                        ${answers[question.id] === index ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion((prev) => prev - 1)}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  {currentQuestion === mockQuestions.length - 1 ? (
                    <Button variant="hero" onClick={() => setShowSubmitDialog(true)}>
                      <Send className="h-4 w-4 mr-1" />
                      Submit Exam
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => setCurrentQuestion((prev) => prev + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {mockQuestions.map((q, index) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`h-10 w-10 rounded-lg font-medium text-sm transition-all relative
                        ${currentQuestion === index ? "ring-2 ring-primary ring-offset-2" : ""}
                        ${answers[q.id] !== undefined
                          ? "bg-success text-success-foreground"
                          : "bg-muted hover:bg-muted/80"
                        }`}
                    >
                      {index + 1}
                      {flagged.has(q.id) && (
                        <Flag className="absolute -top-1 -right-1 h-3 w-3 text-destructive" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-success" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-muted" />
                    <span>Not answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-destructive" />
                    <span>Flagged for review</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="hero" 
              className="w-full"
              onClick={() => setShowSubmitDialog(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Exam
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Submit Examination?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to submit your exam?</p>
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-medium">{mockQuestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium text-success">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unanswered:</span>
                  <span className="font-medium text-destructive">{mockQuestions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flagged:</span>
                  <span className="font-medium text-warning">{flagged.size}</span>
                </div>
              </div>
              {mockQuestions.length - answeredCount > 0 && (
                <p className="text-destructive text-sm mt-2">
                  Warning: You have {mockQuestions.length - answeredCount} unanswered question(s).
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction 
              onClick={submitExam}
              className="bg-gradient-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Submit
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TakeExam;
