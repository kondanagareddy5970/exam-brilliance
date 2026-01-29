import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { Clock, FileText, Users, Calendar, ArrowRight } from "lucide-react";

const Exams = () => {
  const exams = [
    {
      id: "1",
      title: "Mathematics Final Exam",
      subject: "Mathematics",
      duration: 120,
      questions: 50,
      participants: 234,
      date: "2024-02-15",
      status: "upcoming",
    },
    {
      id: "2",
      title: "Physics Mid-Term",
      subject: "Physics",
      duration: 90,
      questions: 40,
      participants: 189,
      date: "2024-02-10",
      status: "active",
    },
    {
      id: "3",
      title: "English Literature Quiz",
      subject: "English",
      duration: 45,
      questions: 25,
      participants: 312,
      date: "2024-02-08",
      status: "completed",
    },
    {
      id: "4",
      title: "Computer Science Basics",
      subject: "Computer Science",
      duration: 60,
      questions: 30,
      participants: 156,
      date: "2024-02-20",
      status: "upcoming",
    },
    {
      id: "workday",
      title: "Workday Exam",
      subject: "Workday",
      duration: 30,
      questions: 4,
      participants: 0,
      date: new Date().toISOString().split("T")[0],
      status: "upcoming",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-primary text-primary-foreground">Upcoming</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Available Exams</h1>
          <p className="text-muted-foreground">
            Browse and register for upcoming examinations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} variant="interactive" className="group">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline">{exam.subject}</Badge>
                  {getStatusBadge(exam.status)}
                </div>
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(exam.date).toLocaleDateString()}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">{exam.duration} min</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">{exam.questions}</div>
                    <div className="text-xs text-muted-foreground">Questions</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">{exam.participants}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={exam.status === "active" ? "hero" : "outline"} 
                  className="w-full"
                  disabled={exam.status === "completed"}
                  asChild
                >
                  <Link to={`/exam/${exam.id}/register`}>
                    {exam.status === "active" ? "Start Exam" : exam.status === "upcoming" ? "Register" : "View Results"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Exams;
