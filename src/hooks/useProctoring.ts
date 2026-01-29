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

  // Fetch active proctoring sessions using exam_sessions table
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
        ended_at: session.end_time || undefined,
        status: session.submission_status === "in_progress" ? "active" as const : 
                session.submission_status === "submitted" ? "completed" as const : "terminated" as const,
        violation_count: session.violations_count || 0,
        last_activity: session.start_time,
      }));
      
      setSessions(transformedSessions);
    } catch (err) {
      console.error("Error fetching proctoring sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    }
  };

  // Fetch recent logs using security_activity_logs table
  const fetchLogs = async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from("security_activity_logs")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedLogs: ProctoringLog[] = (data || []).map(log => ({
        id: log.id,
        session_id: log.exam_session_id || "unknown",
        student_id: log.exam_session_id || "unknown",
        event_type: log.activity_type === "tab_switch" || log.activity_type === "window_focus_lost" 
          ? "warning" as const
          : log.activity_type === "multiple_faces" 
          ? "violation" as const
          : "info" as const,
        message: log.details || log.activity_type,
        metadata: {},
        created_at: log.occurred_at,
      }));
      
      setLogs(transformedLogs);
    } catch (err) {
      console.error("Error fetching proctoring logs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    }
  };

  // Create a new proctoring session
  const createSession = async (studentId: string, examId: string) => {
    try {
      const { data, error } = await supabase
        .from("exam_sessions")
        .insert({
          user_id: studentId,
          exam_id: examId,
          exam_title: examId,
          submission_status: "in_progress",
          violations_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh sessions
      await fetchSessions();
      return data;
    } catch (err) {
      console.error("Error creating proctoring session:", err);
      setError(err instanceof Error ? err.message : "Failed to create session");
      throw err;
    }
  };

  // Log a proctoring event
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
          exam_session_id: sessionId,
          activity_type: eventType === "violation" ? "multiple_faces" : 
                         eventType === "warning" ? "tab_switch" : "face_detected",
          details: message,
        });

      if (error) throw error;

      // Update session violation count if it's a violation
      if (eventType === "violation") {
        const { data: currentSession } = await supabase
          .from("exam_sessions")
          .select("violations_count")
          .eq("id", sessionId)
          .single();
        
        if (currentSession) {
          await supabase
            .from("exam_sessions")
            .update({ 
              violations_count: (currentSession.violations_count || 0) + 1 
            })
            .eq("id", sessionId);
        }
      }

      // Refresh logs
      await fetchLogs();
    } catch (err) {
      console.error("Error logging proctoring event:", err);
      setError(err instanceof Error ? err.message : "Failed to log event");
    }
  };

  // End a proctoring session
  const endSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("exam_sessions")
        .update({ 
          submission_status: "submitted",
          end_time: new Date().toISOString()
        })
        .eq("id", sessionId);

      if (error) throw error;
      
      // Refresh sessions
      await fetchSessions();
    } catch (err) {
      console.error("Error ending proctoring session:", err);
      setError(err instanceof Error ? err.message : "Failed to end session");
    }
  };

  // Terminate a session (admin action)
  const terminateSession = async (sessionId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from("exam_sessions")
        .update({ 
          submission_status: "terminated",
          end_time: new Date().toISOString()
        })
        .eq("id", sessionId);

      if (error) throw error;

      // Log termination
      await logEvent(
        sessionId,
        "admin",
        "violation",
        reason || "Session terminated by administrator"
      );
      
      // Refresh sessions
      await fetchSessions();
    } catch (err) {
      console.error("Error terminating proctoring session:", err);
      setError(err instanceof Error ? err.message : "Failed to terminate session");
    }
  };

  // Real-time subscription to security activity logs
  const subscribeToLogs = (sessionId?: string) => {
    const channel = supabase
      .channel("security_activity_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "security_activity_logs",
          filter: sessionId ? `exam_session_id=eq.${sessionId}` : undefined,
        },
        (payload) => {
          const log = payload.new as { id: string; exam_session_id: string; activity_type: string; details: string | null; occurred_at: string };
          const newLog: ProctoringLog = {
            id: log.id,
            session_id: log.exam_session_id || "unknown",
            student_id: log.exam_session_id || "unknown",
            event_type: log.activity_type === "tab_switch" || log.activity_type === "window_focus_lost" 
              ? "warning" 
              : log.activity_type === "multiple_faces" 
              ? "violation" 
              : "info",
            message: log.details || log.activity_type,
            metadata: {},
            created_at: log.occurred_at,
          };
          setLogs(prev => [newLog, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Real-time subscription to sessions
  const subscribeToSessions = () => {
    const channel = supabase
      .channel("exam_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exam_sessions",
        },
        () => {
          // Refetch sessions on any change
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    // Set up real-time subscriptions
    const unsubscribeLogs = subscribeToLogs();
    const unsubscribeSessions = subscribeToSessions();

    return () => {
      unsubscribeLogs();
      unsubscribeSessions();
    };
  }, []);

  return {
    sessions,
    logs,
    loading,
    error,
    createSession,
    logEvent,
    endSession,
    terminateSession,
    fetchSessions,
    fetchLogs,
    subscribeToLogs,
    subscribeToSessions,
  };
};
