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

  // Fetch active proctoring sessions
  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("proctoring_sessions")
        .select("*")
        .eq("status", "active")
        .order("started_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error("Error fetching proctoring sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    }
  };

  // Fetch recent logs
  const fetchLogs = async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from("proctoring_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching proctoring logs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    }
  };

  // Create a new proctoring session
  const createSession = async (studentId: string, examId: string) => {
    try {
      const { data, error } = await supabase
        .from("proctoring_sessions")
        .insert({
          student_id: studentId,
          exam_id: examId,
          status: "active",
          violation_count: 0,
          last_activity: new Date().toISOString(),
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
        .from("proctoring_logs")
        .insert({
          session_id: sessionId,
          student_id: studentId,
          event_type: eventType,
          message,
          metadata,
        });

      if (error) throw error;

      // Update session last activity and violation count
      if (eventType === "violation") {
        await supabase
          .from("proctoring_sessions")
          .update({ 
            violation_count: supabase.rpc('increment', { count: 1 }),
            last_activity: new Date().toISOString()
          })
          .eq("id", sessionId);
      } else {
        await supabase
          .from("proctoring_sessions")
          .update({ 
            last_activity: new Date().toISOString()
          })
          .eq("id", sessionId);
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
        .from("proctoring_sessions")
        .update({ 
          status: "completed",
          ended_at: new Date().toISOString()
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
        .from("proctoring_sessions")
        .update({ 
          status: "terminated",
          ended_at: new Date().toISOString()
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

  // Real-time subscription to proctoring logs
  const subscribeToLogs = (sessionId?: string) => {
    const channel = supabase
      .channel("proctoring_logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "proctoring_logs",
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
        },
        (payload) => {
          setLogs(prev => [payload.new as ProctoringLog, ...prev].slice(0, 50));
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
      .channel("proctoring_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proctoring_sessions",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessions(prev => [payload.new as ProctoringSession, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setSessions(prev => 
              prev.map(session => 
                session.id === payload.new.id ? payload.new as ProctoringSession : session
              )
            );
          } else if (payload.eventType === "DELETE") {
            setSessions(prev => prev.filter(session => session.id !== payload.old.id));
          }
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
