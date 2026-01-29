import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const sampleQuestions = [
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare" },
  { question: "What is the chemical symbol for water?", answer: "H2O" },
  { question: "What is 2 + 2?", answer: "4" },
  { question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci" },
  { question: "What is the largest planet in our solar system?", answer: "Jupiter" },
  { question: "In which continent is Egypt?", answer: "Africa" },
  { question: "What is the boiling point of water?", answer: "100°C" },
  { question: "Who discovered gravity?", answer: "Isaac Newton" },
  { question: "What is the main language spoken in Brazil?", answer: "Portuguese" },
];

const ManageQuestions = () => {
  const [questions, setQuestions] = useState(sampleQuestions);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Optional: Load questions from DB if you have a table
  // useEffect(() => { ... }, []);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError("");
    // Example: Save questions to DB (if you have a table)
    // await supabase.from("questions").upsert(questions);
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-card rounded shadow">
      <h2 className="text-xl font-bold mb-4">Manage Questions</h2>
      <ul className="mb-4 space-y-2">
        {questions.map((q, i) => (
          <li key={i} className="p-2 border rounded">
            <div className="font-semibold">Q{i + 1}: {q.question}</div>
            <div className="text-muted-foreground">Answer: {q.answer}</div>
          </li>
        ))}
      </ul>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Questions"}
      </Button>
      {success && <div className="text-success mt-2">Questions saved!</div>}
      {error && <div className="text-destructive mt-2">{error}</div>}
    </div>
  );
};

export default ManageQuestions;
