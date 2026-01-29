import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const CreateExam = () => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    const { error } = await supabase.from("exam_sessions").insert([
      {
        exam_title: title,
        exam_id: crypto.randomUUID(),
        user_id: null, // admin-created exam has no specific user_id
        start_time: new Date().toISOString(),
        submission_status: "not_started",
        violations_count: 0,
      },
    ]);
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-card rounded shadow">
      <h2 className="text-xl font-bold mb-4">Create New Exam</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          type="text"
          placeholder="Exam Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Exam"}
        </Button>
        {success && <div className="text-success">Exam created successfully!</div>}
        {error && <div className="text-destructive">{error}</div>}
      </form>
    </div>
  );
};

export default CreateExam;
