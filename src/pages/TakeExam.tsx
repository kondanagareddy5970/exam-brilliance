import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle2, Camera } from "lucide-react";
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

import mockQuestions from '@/data/workday-exam.json';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Anti-cheat state
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [warningType, setWarningType] = useState<"fullscreen" | "tab_switch" | "blocked">("fullscreen");
  const [examStarted, setExamStarted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  
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
      toast({
        title: "Webcam Required",
        description: "Please allow webcam access to start the exam.",
        variant: "destructive",
      });
      return;
    }
    
    // Then request fullscreen
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
      description: "Secure mode and webcam proctoring activated. Good luck!",
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
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSelect = (optionIndex: number) => {
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
    toggleFlag(questionId);
  };

  const handleAutoSubmit = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "Your exam has been automatically submitted.",
      variant: "destructive",
    });
    submitExam();
  }, []);

  const submitExam = () => {
    setIsSubmitting(true);
    let correct = 0;
    mockQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correct++;
      }
    });

    // Stop webcam and exit fullscreen before navigating
    stopWebcam();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    setTimeout(() => {
      navigate(`/exam/${examId}/results`, { 
        state: { 
          score: correct, 
          total: mockQuestions.length,
          answers,
          questions: mockQuestions.map((q, idx) => ({ ...q, id: idx, correctAnswer: q.correct })),
          activityLogs,
          violations,
          proctorPhotos: capturedPhotos.length,
        } 
      });
    }, 1500);
  };

  const questionId = currentQuestion;
  const question: Question = {
    id: questionId,
    question: mockQuestions[currentQuestion].question,
    options: mockQuestions[currentQuestion].options,
    correctAnswer: mockQuestions[currentQuestion].correct,
  };
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / mockQuestions.length) * 100;
  const isUrgent = timeLeft <= 300;

  // Show fullscreen prompt before exam starts
  if (showFullscreenPrompt) {
    return (
      <FullscreenPrompt
        onEnterFullscreen={handleEnterFullscreen}
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
          <div className="font-display font-semibold">Workday Exam</div>
          
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
                <span className="font-medium">{answeredCount} of {mockQuestions.length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <QuestionCard
              question={question}
              questionIndex={currentQuestion}
              totalQuestions={mockQuestions.length}
              selectedAnswer={answers[questionId]}
              isFlagged={flagged.has(questionId)}
              onAnswerSelect={handleSelect}
              onToggleFlag={handleToggleFlag}
              onPrevious={() => setCurrentQuestion((prev) => prev - 1)}
              onNext={() => setCurrentQuestion((prev) => prev + 1)}
              onSubmit={() => setShowSubmitDialog(true)}
              isLastQuestion={currentQuestion === mockQuestions.length - 1}
              isFirstQuestion={currentQuestion === 0}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
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
              questions={mockQuestions.map((q, idx) => ({ id: idx, question: q.question, options: q.options, correctAnswer: q.correct }))}
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
