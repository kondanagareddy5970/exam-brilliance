import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle2, Camera, Loader2 } from "lucide-react";
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
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useWebcam, CapturedPhoto } from "@/hooks/useWebcam";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { AntiCheatWarning } from "@/components/exam/AntiCheatWarning";
import { FullscreenPrompt } from "@/components/exam/FullscreenPrompt";
import { SecurityStatusBar } from "@/components/exam/SecurityStatusBar";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { QuestionNavigator } from "@/components/exam/QuestionNavigator";
import { WebcamProctor } from "@/components/exam/WebcamProctor";
import { FaceDetectionAlert } from "@/components/exam/FaceDetectionAlert";
import StudentVideoStream from "@/components/exam/StudentVideoStream";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

interface ExamData {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
}

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Generate consistent student ID for this exam session
  const [studentId] = useState(() => `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Anti-cheat state
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [warningType, setWarningType] = useState<"fullscreen" | "tab_switch" | "blocked">("fullscreen");
  const [examStarted, setExamStarted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  // Fetch exam data and questions
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to take the exam.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchExamData = async () => {
      if (!examId || !user) return;

      try {
        // Check if user is registered for this exam
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

        // Check for existing attempt
        const { data: existingAttempt } = await supabase
          .from("exam_attempts")
          .select("*")
          .eq("exam_id", examId)
          .eq("user_id", user.id)
          .single();

        if (existingAttempt && existingAttempt.status !== "in_progress") {
          toast({
            title: "Exam Already Completed",
            description: "You have already submitted this exam.",
            variant: "destructive",
          });
          navigate(`/exam/${examId}/results`);
          return;
        }

        // Fetch exam details
        const { data: exam, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single();

        if (examError) throw examError;
        setExamData(exam);
        setTimeLeft(exam.duration_minutes * 60);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", examId)
          .order("order_index", { ascending: true });

        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
          throw questionsError;
        }

        console.log("Fetched questions data:", questionsData);

        if (!questionsData || questionsData.length === 0) {
          toast({
            title: "No Questions Found",
            description: "This exam doesn't have any questions yet. Please contact the administrator.",
            variant: "destructive",
          });
          navigate("/exams");
          return;
        }

        const formattedQuestions: Question[] = (questionsData || []).map((q) => ({
          id: q.id,
          question: q.question_text,
          options: (q.options as string[]) || [],
          correctAnswer: q.correct_answer || 0,
          marks: q.marks,
        }));

        console.log("Formatted questions:", formattedQuestions);
        setQuestions(formattedQuestions);

        // Create or resume attempt
        if (existingAttempt) {
          const elapsed = Math.floor((Date.now() - new Date(existingAttempt.start_time).getTime()) / 1000);
          const remaining = exam.duration_minutes * 60 - elapsed;

          if (remaining <= 0) {
            // Attempt has expired - reset it with a fresh start time
            const { error: resetError } = await supabase
              .from("exam_attempts")
              .update({
                start_time: new Date().toISOString(),
                answers: {},
                violations_count: 0,
                status: "in_progress",
                score: null,
                total_marks: null,
                percentage: null,
                passed: null,
                end_time: null,
              })
              .eq("id", existingAttempt.id);

            if (resetError) throw resetError;
            setAttemptId(existingAttempt.id);
            setAnswers({});
            setTimeLeft(exam.duration_minutes * 60);
          } else {
            setAttemptId(existingAttempt.id);
            setAnswers((existingAttempt.answers as Record<number, number>) || {});
            setTimeLeft(remaining);
          }
        } else {
          const { data: newAttempt, error: attemptError } = await supabase
            .from("exam_attempts")
            .insert({
              user_id: user.id,
              exam_id: examId,
              candidate_id: candidateData.id,
              status: "in_progress",
            })
            .select()
            .single();

          if (attemptError) throw attemptError;
          setAttemptId(newAttempt.id);
        }
      } catch (error) {
        console.error("Error fetching exam data:", error);
        toast({
          title: "Error",
          description: "Failed to load exam. Please try again.",
          variant: "destructive",
        });
        navigate("/exams");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchExamData();
    }
  }, [examId, user, authLoading, navigate, toast]);

  // Webcam state
  const [webcamMinimized, setWebcamMinimized] = useState(false);

  // Face detection threshold (5 seconds without face triggers alert)
  const FACE_DETECTION_THRESHOLD_MS = 5000;

  const handleForceSubmit = useCallback(() => {
    submitExam();
  }, []);

  // Webcam hook
  const handlePhotoCapture = useCallback((photo: CapturedPhoto) => {
    console.log(`[Proctor] Photo captured: ${photo.type}`, photo.timestamp);
    // In production, this would upload to storage
  }, []);

  const {
    isEnabled: webcamEnabled,
    isLoading: webcamLoading,
    error: webcamError,
    capturedPhotos,
    requestAccess: requestWebcamAccess,
    attachToVideo,
    stopWebcam,
    photoCount,
  } = useWebcam({
    autoCapture: examStarted,
    captureIntervalMs: 60000, // Capture every minute
    onPhotoCapture: handlePhotoCapture,
  });

  // Face detection hook
  const handleNoFaceDetected = useCallback(() => {
    toast({
      title: "⚠️ Face Not Detected",
      description: "Please return to the camera frame immediately. This will be logged.",
      variant: "destructive",
    });
  }, [toast]);

  const handleFaceReturned = useCallback(() => {
    toast({
      title: "✓ Face Detected",
      description: "You are visible in the camera again.",
    });
  }, [toast]);

  const handleMultipleFaces = useCallback((count: number) => {
    toast({
      title: "⚠️ Multiple Faces Detected",
      description: `${count} people detected. Only you should be visible during the exam.`,
      variant: "destructive",
    });
  }, [toast]);

  const {
    faceCount,
    noFaceAlertActive,
    noFaceDuration,
    isDetecting: isDetectingFace,
    events: faceEvents,
    attachVideo: attachFaceDetection,
  } = useFaceDetection({
    enabled: examStarted && webcamEnabled,
    detectionIntervalMs: 2000,
    noFaceThresholdMs: FACE_DETECTION_THRESHOLD_MS,
    onNoFaceDetected: handleNoFaceDetected,
    onFaceReturned: handleFaceReturned,
    onMultipleFaces: handleMultipleFaces,
  });

  // Combined video ref handler
  const handleVideoRef = useCallback((video: HTMLVideoElement) => {
    attachToVideo(video);
    attachFaceDetection(video);
  }, [attachToVideo, attachFaceDetection]);

  const {
    isFullscreen,
    tabSwitchCount,
    violations,
    isBlocked,
    activityLogs,
    requestFullscreen,
  } = useAntiCheat({
    maxViolations: 3,
    onMaxViolationsReached: () => {
      setWarningType("blocked");
      setShowSecurityWarning(true);
    },
    enableFullscreenEnforcement: examStarted,
    enableTabSwitchDetection: examStarted,
    enableRightClickPrevention: examStarted,
    enableCopyPastePrevention: examStarted,
  });

  // Handle entering fullscreen and starting exam
  const handleEnterFullscreen = async () => {
    setIsRequestingPermissions(true);

    // First request webcam access
    const webcamSuccess = await requestWebcamAccess();
    if (!webcamSuccess) {
      setIsRequestingPermissions(false);
      // Don't block — show error, user can skip via "Continue without webcam"
      return;
    }

    // Then request fullscreen
    await startExamWithFullscreen();
  };

  // Skip webcam and start with fullscreen only
  const handleSkipWebcam = async () => {
    setIsRequestingPermissions(true);
    await startExamWithFullscreen();
  };

  const startExamWithFullscreen = async () => {
    const fullscreenSuccess = await requestFullscreen();
    if (!fullscreenSuccess) {
      setIsRequestingPermissions(false);
      toast({
        title: "Fullscreen Required",
        description: "Please allow fullscreen mode to start the exam.",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingPermissions(false);
    setShowFullscreenPrompt(false);
    setExamStarted(true);

    toast({
      title: "Exam Started",
      description: webcamEnabled
        ? "Secure mode and webcam proctoring activated. Good luck!"
        : "Secure mode activated (webcam disabled). Good luck!",
    });
  };

  const handleCancelExam = () => {
    stopWebcam();
    navigate("/exams");
  };

  // Show warning when violations occur
  useEffect(() => {
    if (examStarted && violations > 0 && !isBlocked) {
      if (!isFullscreen) {
        setWarningType("fullscreen");
      } else {
        setWarningType("tab_switch");
      }
      setShowSecurityWarning(true);
    }
  }, [violations, isFullscreen, examStarted, isBlocked]);

  const handleReturnToExam = async () => {
    setShowSecurityWarning(false);
    if (!isFullscreen) {
      await requestFullscreen();
    }
  };

  // Timer
  useEffect(() => {
    if (!examStarted) return;

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
  }, [examStarted]);

  // Auto-save
  useEffect(() => {
    if (!examStarted) return;

    const autoSave = setInterval(() => {
      console.log("Auto-saving answers:", answers);
      console.log("Activity logs:", activityLogs);
      console.log("Captured photos:", capturedPhotos.length);
    }, 30000);

    return () => clearInterval(autoSave);
  }, [answers, activityLogs, examStarted, capturedPhotos]);

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
    console.log(`Answer selected for question ${questionId}: option ${optionIndex}`);
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSelect = (questionId: number, optionIndex: number) => {
    handleAnswerSelect(questionId, optionIndex);
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

  const handleToggleFlag = () => {
    toggleFlag(currentQuestion);
  };

  const handleAutoSubmit = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "Your exam has been automatically submitted.",
      variant: "destructive",
    });
    submitExam();
  }, []);

  const submitExam = async () => {
    setIsSubmitting(true);
    let score = 0;
    let totalMarks = 0;

    questions.forEach((q, idx) => {
      totalMarks += q.marks;
      if (answers[idx] === q.correctAnswer) {
        score += q.marks;
      }
    });

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const passed = examData ? percentage >= (examData.passing_marks / examData.total_marks) * 100 : false;

    // Stop webcam and exit fullscreen before navigating
    stopWebcam();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    try {
      // Update attempt in database
      if (attemptId && user) {
        await supabase
          .from("exam_attempts")
          .update({
            status: "submitted",
            end_time: new Date().toISOString(),
            score,
            total_marks: totalMarks,
            percentage,
            passed,
            answers,
            violations_count: violations,
          })
          .eq("id", attemptId);

        // Create result record
        await supabase.from("exam_results").insert({
          attempt_id: attemptId,
          user_id: user.id,
          exam_id: examId,
          score,
          total_marks: totalMarks,
          percentage,
          passed,
          time_taken_seconds: examData ? examData.duration_minutes * 60 - timeLeft : 0,
        });
      }
    } catch (error) {
      console.error("Error saving results:", error);
    }

    navigate(`/exam/${examId}/results`, {
      state: {
        score,
        total: totalMarks,
        percentage,
        passed,
        answers,
        questions,
        activityLogs,
        violations,
        proctorPhotos: capturedPhotos.length,
        examTitle: examData?.title,
        passingMarks: examData?.passing_marks,
      }
    });
  };

  const questionIndex = currentQuestion;
  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isUrgent = timeLeft <= 300;

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Show fullscreen prompt before exam starts
  if (showFullscreenPrompt) {
    return (
      <FullscreenPrompt
        onEnterFullscreen={handleEnterFullscreen}
        onSkipWebcam={handleSkipWebcam}
        onCancel={handleCancelExam}
        isRequestingWebcam={isRequestingPermissions}
        webcamError={webcamError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background exam-content">
      {/* Security Warning Dialog */}
      <AntiCheatWarning
        isOpen={showSecurityWarning}
        violations={violations}
        maxViolations={3}
        type={warningType}
        onReturnToExam={handleReturnToExam}
        onForceSubmit={handleForceSubmit}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-display font-semibold">{examData?.title || "Exam"}</div>

          <div className="flex items-center gap-4">
            {/* Webcam status indicator (minimized) */}
            {webcamMinimized && (
              <WebcamProctor
                isEnabled={webcamEnabled}
                onVideoRef={handleVideoRef}
                photoCount={photoCount}
                error={webcamError}
                minimized={true}
                onToggleMinimize={() => setWebcamMinimized(false)}
                faceCount={faceCount}
                noFaceAlertActive={noFaceAlertActive}
                isDetectingFace={isDetectingFace}
              />
            )}

            <SecurityStatusBar
              violations={violations}
              maxViolations={3}
              tabSwitchCount={tabSwitchCount}
              isFullscreen={isFullscreen}
            />

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isUrgent ? "bg-destructive/10 text-destructive timer-urgent" : "bg-muted"}`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
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
                <span className="font-medium">{answeredCount} of {questions.length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            {currentQ && (
              <QuestionCard
                question={{ id: currentQuestion, question: currentQ.question, options: currentQ.options, correctAnswer: currentQ.correctAnswer }}
                questionIndex={currentQuestion}
                totalQuestions={questions.length}
                selectedAnswer={answers[currentQuestion]}
                isFlagged={flagged.has(currentQuestion)}
                onAnswerSelect={handleSelect}
                onToggleFlag={handleToggleFlag}
                onPrevious={() => setCurrentQuestion((prev) => prev - 1)}
                onNext={() => setCurrentQuestion((prev) => prev + 1)}
                onSubmit={() => setShowSubmitDialog(true)}
                isLastQuestion={currentQuestion === questions.length - 1}
                isFirstQuestion={currentQuestion === 0}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Live Video Streaming */}
            <StudentVideoStream
              examCode={examId || "workday"}
              studentId={studentId}
              examTitle={examId === "workday" ? "Workday Exam" : "Exam"}
              onStreamStart={() => console.log("Student streaming started")}
              onStreamStop={() => console.log("Student streaming stopped")}
            />

            {/* Face Detection Alert */}
            <FaceDetectionAlert
              noFaceAlertActive={noFaceAlertActive}
              noFaceDuration={noFaceDuration}
              faceCount={faceCount}
              thresholdMs={FACE_DETECTION_THRESHOLD_MS}
            />

            {/* Webcam Feed */}
            {!webcamMinimized && (
              <WebcamProctor
                isEnabled={webcamEnabled}
                onVideoRef={handleVideoRef}
                photoCount={photoCount}
                error={webcamError}
                className="aspect-[4/3]"
                onToggleMinimize={() => setWebcamMinimized(true)}
                faceCount={faceCount}
                noFaceAlertActive={noFaceAlertActive}
                isDetectingFace={isDetectingFace}
              />
            )}

            <QuestionNavigator
              questions={questions.map((q, idx) => ({ id: idx, question: q.question, options: q.options, correctAnswer: q.correctAnswer }))}
              currentQuestion={currentQuestion}
              answers={answers}
              flagged={flagged}
              onQuestionSelect={setCurrentQuestion}
              onSubmit={() => setShowSubmitDialog(true)}
            />
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
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium text-success">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unanswered:</span>
                  <span className="font-medium text-destructive">{questions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flagged:</span>
                  <span className="font-medium text-warning">{flagged.size}</span>
                </div>
                {violations > 0 && (
                  <div className="flex justify-between">
                    <span>Security Violations:</span>
                    <span className="font-medium text-destructive">{violations}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    Photos Captured:
                  </span>
                  <span className="font-medium">{photoCount}</span>
                </div>
              </div>
              {questions.length - answeredCount > 0 && (
                <p className="text-destructive text-sm mt-2">
                  Warning: You have {questions.length - answeredCount} unanswered question(s).
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
