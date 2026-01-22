import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Flag, ChevronLeft, ChevronRight, Send } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer?: number;
  isFlagged: boolean;
  onAnswerSelect: (questionId: number, optionIndex: number) => void;
  onToggleFlag: (questionId: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
}

export const QuestionCard = ({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  onAnswerSelect,
  onToggleFlag,
  onPrevious,
  onNext,
  onSubmit,
  isLastQuestion,
  isFirstQuestion,
}: QuestionCardProps) => {
  // Convert selectedAnswer to string, using empty string if undefined to keep RadioGroup controlled
  const radioValue = selectedAnswer !== undefined ? selectedAnswer.toString() : "";

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Question {questionIndex + 1}</CardTitle>
        <Button
          variant={isFlagged ? "destructive" : "outline"}
          size="sm"
          onClick={() => onToggleFlag(question.id)}
        >
          <Flag className="h-4 w-4 mr-1" />
          {isFlagged ? "Flagged" : "Flag for Review"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg font-medium">{question.question}</p>

        <RadioGroup
          value={radioValue}
          onValueChange={(value) => onAnswerSelect(question.id, parseInt(value))}
        >
          {question.options.map((option, index) => (
            <div 
              key={index} 
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer
                ${selectedAnswer === index ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
            >
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button variant="hero" onClick={onSubmit}>
              <Send className="h-4 w-4 mr-1" />
              Submit Exam
            </Button>
          ) : (
            <Button variant="default" onClick={onNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
