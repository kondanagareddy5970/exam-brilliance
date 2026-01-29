import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      const { data, error } = await supabase.from("exam_sessions").select();
      setExams(data || []);
      setLoading(false);
    };
    fetchExams();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-card rounded shadow">
      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
          <CardDescription>List of all exams in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium">{exam.exam_title}</div>
                    <div className="text-sm text-muted-foreground">{exam.start_time}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{exam.submission_status}</div>
                </div>
              ))}
              {exams.length === 0 && <div>No exams found.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExams;
