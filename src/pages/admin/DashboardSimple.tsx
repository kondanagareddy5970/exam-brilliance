import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProfileIndicator from "@/components/ProfileIndicator";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Eye,
  AlertTriangle,
  Activity,
  Calendar,
  Award,
  Target,
  Zap,
  Play
} from "lucide-react";

const AdminDashboard = () => {
  // Mock data for fallback
  const stats = {
    totalStudents: 1234,
    activeExams: 8,
    completedToday: 156,
    avgScore: 72,
    studentGrowth: 12,
    examGrowth: 8,
  };
  
  const recentExams = [
    { id: "1", exam_title: "Workday Exam", start_time: new Date().toISOString(), submission_status: "in_progress", user_id: "student1", score: null, violations_count: 0 },
    { id: "2", exam_title: "Mathematics Final", start_time: new Date(Date.now() - 3600000).toISOString(), submission_status: "submitted", user_id: "student2", score: 85, violations_count: 2 },
    { id: "3", exam_title: "Physics Mid-Term", start_time: new Date(Date.now() - 7200000).toISOString(), submission_status: "submitted", user_id: "student3", score: 92, violations_count: 1 },
  ];

  const recentActivities = [
    { id: "1", type: "exam_started", user_id: "student1", details: "Started Workday Exam", timestamp: new Date().toISOString() },
    { id: "2", type: "exam_completed", user_id: "student2", details: "Completed Mathematics Final", timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: "3", type: "violation", user_id: "student2", details: "Tab switch detected", timestamp: new Date(Date.now() - 600000).toISOString() },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "submitted":
        return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
      case "not_started":
        return <Badge className="bg-warning text-warning-foreground">Upcoming</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "exam_started":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "exam_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "violation":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "exam_registered":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-display font-bold text-xl">Admin Dashboard</div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/admin/proctoring">Live Proctoring</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">View Site</Link>
            </Button>
            <ProfileIndicator 
              user={{
                name: "Admin User",
                email: "admin@examportal.com",
                role: "admin",
              }}
            />
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Real-time Stats Bar */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Eye className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeExams}</p>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeExams}</p>
                  <p className="text-sm text-muted-foreground">Live Sessions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Violations Today</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{stats.studentGrowth}%</span>
                </div>
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{stats.totalStudents.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
              <Progress value={75} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                  <FileText className="h-6 w-6 text-success" />
                </div>
                <div className="flex items-center gap-1 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{stats.examGrowth}%</span>
                </div>
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{stats.activeExams}</p>
                <p className="text-sm text-muted-foreground">Active Exams</p>
              </div>
              <Progress value={(stats.activeExams / 10) * 100} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                  <CheckCircle2 className="h-6 w-6 text-warning" />
                </div>
                <div className="flex items-center gap-1 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>+28%</span>
                </div>
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{stats.completedToday}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
              <Progress value={(stats.completedToday / 20) * 100} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div className="flex items-center gap-1 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>+5%</span>
                </div>
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{stats.avgScore}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
              <Progress value={stats.avgScore} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button variant="hero" size="lg" className="h-auto py-6 group" asChild>
            <Link to="/admin/exams/create" className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>Create New Exam</span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-6 group hover:border-primary" asChild>
            <Link to="/admin/questions" className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>Manage Questions</span>
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-6 group hover:border-success" asChild>
            <Link to="/admin/results" className="flex flex-col items-center gap-2">
              <Download className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>Export Results</span>
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Exams */}
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Exams
                </CardTitle>
                <CardDescription>Latest examination activities</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/exams" className="hover:bg-primary/10">
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{exam.exam_title}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTime(exam.start_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exam.user_id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {exam.score !== null && (
                        <span className={`font-semibold ${getScoreColor(exam.score)}`}>
                          {exam.score}%
                        </span>
                      )}
                      {exam.violations_count !== undefined && exam.violations_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {exam.violations_count}
                        </span>
                      )}
                      {getStatusBadge(exam.submission_status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Real-time system events</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/students" className="hover:bg-primary/10">
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{activity.details}</p>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activity.user_id}
                      </p>
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
