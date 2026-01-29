import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CameraPermissionDialog } from "@/components/CameraPermissionDialog";
import { useCameraPermission, markPermissionAsGranted, markPermissionAsSkipped } from "@/hooks/useCameraPermission";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AdminLogin from "./pages/AdminLogin";
import Exams from "./pages/Exams";
import ExamRegister from "./pages/ExamRegister";
import ExamInstructions from "./pages/ExamInstructions";
import TakeExam from "./pages/TakeExam";
import ExamResults from "./pages/ExamResults";
import AdminDashboardSimple from "./pages/admin/DashboardSimple";
import AdminDashboardEnhanced from "./pages/admin/DashboardEnhanced";
import AdminExams from "./pages/admin/Exams";
import AdminStudents from "./pages/admin/Students";
import AdminProctoring from "./pages/admin/Proctoring";
import AdminProctoringWithCode from "./pages/admin/ProctoringWithCode";
import AdminProctoringWithLiveVideo from "./pages/admin/AdminProctoringWithLiveVideo";
import CreateExam from "./pages/admin/CreateExam";
import ManageQuestions from "./pages/admin/ManageQuestions";
import ExportResults from "./pages/admin/ExportResults";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { status, isChecking } = useCameraPermission();
  const [showDialog, setShowDialog] = useState(true);

  const handlePermissionGranted = () => {
    markPermissionAsGranted();
    setShowDialog(false);
  };

  const handlePermissionDenied = () => {
    markPermissionAsSkipped();
    setShowDialog(false);
  };

  return (
    <>
      {!isChecking && status === "prompt" && showDialog && (
        <CameraPermissionDialog
          onPermissionGranted={handlePermissionGranted}
          onPermissionDenied={handlePermissionDenied}
        />
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboardSimple />} />
<Route path="/admin/exams" element={<AdminExams />} />
<Route path="/admin/students" element={<AdminStudents />} />
<Route path="/admin/proctoring" element={<AdminProctoringWithLiveVideo />} />
        <Route path="/admin/exams/create" element={<CreateExam />} />
        <Route path="/admin/questions" element={<ManageQuestions />} />
        <Route path="/admin/results" element={<ExportResults />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/exam/:examId/register" element={<ExamRegister />} />
        <Route path="/exam/:examId/instructions" element={<ExamInstructions />} />
        <Route path="/exam/:examId/take" element={<TakeExam />} />
        <Route path="/exam/:examId/results" element={<ExamResults />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
