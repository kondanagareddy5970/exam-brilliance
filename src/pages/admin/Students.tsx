import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from("exam_sessions").select();
      // Group by user_id and get last exam
      const grouped = {};
      (data || []).forEach(row => {
        if (!grouped[row.user_id] || new Date(row.start_time) > new Date(grouped[row.user_id].start_time)) {
          grouped[row.user_id] = row;
        }
      });
      setStudents(Object.values(grouped));
      setLoading(false);
    };
    fetchStudents();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-card rounded shadow">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest student submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {students.map((student, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium">{student.user_id}</div>
                    <div className="text-sm text-muted-foreground">{student.exam_title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{student.score ?? "-"}%</div>
                </div>
              ))}
              {students.length === 0 && <div>No student activity found.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudents;
