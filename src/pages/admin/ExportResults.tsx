import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const ExportResults = () => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setDownloading(true);
    setError("");
    // Fetch all exam_sessions as results
    const { data, error } = await supabase.from("exam_sessions").select();
    if (error) {
      setError(error.message);
      setDownloading(false);
      return;
    }
    // Convert to CSV
    const csv = [
      ["Exam Title", "User ID", "Score", "Start Time", "End Time", "Status", "Violations"],
      ...data.map(r => [
        r.exam_title,
        r.user_id,
        r.score ?? "",
        r.start_time,
        r.end_time ?? "",
        r.submission_status,
        r.violations_count
      ])
    ].map(row => row.join(",")).join("\n");
    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exam_results.csv";
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-card rounded shadow">
      <h2 className="text-xl font-bold mb-4">Export Results</h2>
      <Button onClick={handleExport} disabled={downloading}>
        {downloading ? "Exporting..." : "Export as CSV"}
      </Button>
      {error && <div className="text-destructive mt-2">{error}</div>}
    </div>
  );
};

export default ExportResults;
