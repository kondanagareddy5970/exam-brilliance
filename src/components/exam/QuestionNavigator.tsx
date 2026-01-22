import { Flag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuestionNavigatorProps {
  questions: Question[];
  currentQuestion: number;
  answers: Record<number, number>;
  flagged: Set<number>;
  onQuestionSelect: (index: number) => void;
  onSubmit: () => void;
}

export const QuestionNavigator = ({
  questions,
  currentQuestion,
  answers,
  flagged,
  onQuestionSelect,
  onSubmit,
}: QuestionNavigatorProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => onQuestionSelect(index)}
                className={`h-10 w-10 rounded-lg font-medium text-sm transition-all relative
                  ${currentQuestion === index ? "ring-2 ring-primary ring-offset-2" : ""}
                  ${answers[q.id] !== undefined
                    ? "bg-success text-success-foreground"
                    : "bg-muted hover:bg-muted/80"
                  }`}
              >
                {index + 1}
                {flagged.has(q.id) && (
                  <Flag className="absolute -top-1 -right-1 h-3 w-3 text-destructive" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-success" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted" />
              <span>Not answered</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              <span>Flagged for review</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        variant="hero" 
        className="w-full"
        onClick={onSubmit}
      >
        <Send className="h-4 w-4 mr-2" />
        Submit Exam
      </Button>
    </div>
  );
};
