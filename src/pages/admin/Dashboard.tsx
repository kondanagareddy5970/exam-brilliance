import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileIndicator from "@/components/ProfileIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import {
  Users,
  FileText,
  BarChart3,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download
} from "lucide-react";

const AdminDashboard = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || !user || !isAdmin) {
    return <div>Loading...</div>;
  }
  const stats = [
    { title: "Total Students", value: "1,234", icon: Users, change: "+12%", color: "text-primary" },
    { title: "Active Exams", value: "8", icon: FileText, change: "+3", color: "text-success" },
    { title: "Completed Today", value: "156", icon: CheckCircle2, change: "+28%", color: "text-accent" },
    { title: "Avg. Score", value: "72%", icon: BarChart3, change: "+5%", color: "text-warning" },
  ];

  const recentExams = [
    { name: "Mathematics Final", date: "2024-02-15", students: 234, status: "upcoming" },
    { name: "Physics Mid-Term", date: "2024-02-10", students: 189, status: "active" },
    { name: "English Quiz", date: "2024-02-08", students: 312, status: "completed" },
    { name: "Chemistry Test", date: "2024-02-05", students: 178, status: "completed" },
  ];

  const recentStudents = [
    { name: "John Doe", email: "john@example.com", lastExam: "Mathematics", score: 85 },
    { name: "Jane Smith", email: "jane@example.com", lastExam: "Physics", score: 92 },
    { name: "Mike Johnson", email: "mike@example.com", lastExam: "English", score: 78 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-display font-bold text-xl">Admin Dashboard</div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/admin/proctoring">Live Proctoring</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">View Site</Link>
            </Button>
            <ProfileIndicator />
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} variant="interactive">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-display font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>{stat.change} from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button variant="hero" size="lg" className="h-auto py-6" asChild>
            <Link to="/admin/exams/create" className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Create New Exam</span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-6" asChild>
            <Link to="/admin/questions" className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Manage Questions</span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-6" asChild>
            <Link to="/admin/results" className="flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <span>Export Results</span>
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Exams */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Exams</CardTitle>
                <CardDescription>Overview of latest examinations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/exams">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExams.map((exam, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{exam.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exam.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exam.students} students
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${exam.status === "active" ? "bg-success/10 text-success" : ""}
                      ${exam.status === "upcoming" ? "bg-primary/10 text-primary" : ""}
                      ${exam.status === "completed" ? "bg-muted text-muted-foreground" : ""}
                    `}>
                      {exam.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest student submissions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/students">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.lastExam}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${student.score >= 80 ? "text-success" : student.score >= 60 ? "text-warning" : "text-destructive"}`}>
                        {student.score}%
                      </p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
