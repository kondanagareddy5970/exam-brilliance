import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProctoringLog {
  id: string;
  session_id: string;
  student_id: string;
  event_type: "info" | "warning" | "violation";
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface ProctoringSession {
  id: string;
  student_id: string;
  exam_id: string;
  started_at: string;
  ended_at?: string;
  status: "active" | "completed" | "terminated";
  violation_count: number;
  last_activity: string;
}

export const useProctoring = () => {
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [logs, setLogs] = useState<ProctoringLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active proctoring sessions using existing exam_sessions table
  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("submission_status", "in_progress")
        .order("start_time", { ascending: false });

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedSessions: ProctoringSession[] = (data || []).map(session => ({
        id: session.id,
        student_id: session.user_id || "unknown",
        exam_id: session.exam_id,
        started_at: session.start_time,
        ended_at: session.end_time,
        status: session.submission_status === "in_progress" ? "active" : 
                session.submission_status === "submitted" ? "completed" : "terminated",
        violation_count: session.violations_count || 0,
        last_activity: session.start_time,
      }));
      
      setSessions(transformedSessions);
    } catch (err) {
      console.error("Error fetching proctoring sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    }
  };

  // Fetch recent logs using existing security_activity_logs table
  const fetchLogs = async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from("security_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedLogs: ProctoringLog[] = (data || []).map(log => ({
        id: log.id,
        session_id: log.user_id || "unknown",
        student_id: log.user_id || "unknown",
        event_type: log.activity_type === "tab_switch" || log.activity_type === "window_focus_lost" 
          ? "warning" 
          : log.activity_type === "multiple_faces" 
          ? "violation" 
          : "info",
        message: log.details || log.activity_type,
        metadata: log.metadata,
        created_at: log.created_at,
      }));
      
      setLogs(transformedLogs);
    } catch (err) {
      console.error("Error fetching proctoring logs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    }
  };

  // Log a proctoring event (using security_activity_logs)
  const logEvent = async (
    sessionId: string,
    studentId: string,
    eventType: ProctoringLog["event_type"],
    message: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from("security_activity_logs")
        .insert({
          user_id: studentId,
          activity_type: eventType === "violation" ? "multiple_faces" : 
                         eventType === "warning" ? "tab_switch" : "face_detected",
          details: message,
          metadata,
        });

      if (error) throw error;

      // Refresh logs
      await fetchLogs();
    } catch (err) {
      console.error("Error logging proctoring event:", err);
      setError(err instanceof Error ? err.message : "Failed to log event");
    }
  };

  // Initialize data and subscriptions
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchSessions(),
        fetchLogs(),
      ]);
      
      setLoading(false);
    };

    initialize();
  }, []);

  return {
    sessions,
    logs,
    loading,
    error,
    logEvent,
    fetchSessions,
    fetchLogs,
  };
};
