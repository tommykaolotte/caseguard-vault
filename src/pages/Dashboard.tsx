import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, FileText, Users, TrendingUp } from "lucide-react";

interface Stats {
  totalCases: number;
  activeCases: number;
  totalDocuments: number;
  recentDocuments: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalCases: 0,
    activeCases: 0,
    totalDocuments: 0,
    recentDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: cases } = await supabase
        .from("cases")
        .select("id, status");

      const { data: documents } = await supabase
        .from("documents")
        .select("id, created_at");

      const activeCases = cases?.filter((c) => c.status === "active").length || 0;
      const recentDocs = documents?.filter((d) => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 7);
        return new Date(d.created_at) > dayAgo;
      }).length || 0;

      setStats({
        totalCases: cases?.length || 0,
        activeCases,
        totalDocuments: documents?.length || 0,
        recentDocuments: recentDocs,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Cases",
      value: stats.totalCases,
      icon: FolderOpen,
      description: `${stats.activeCases} active`,
    },
    {
      title: "Total Documents",
      value: stats.totalDocuments,
      icon: FileText,
      description: `${stats.recentDocuments} this week`,
    },
    {
      title: "Active Members",
      value: "--",
      icon: Users,
      description: "Coming soon",
    },
    {
      title: "Performance",
      value: "--",
      icon: TrendingUp,
      description: "Coming soon",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your legal practice.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Recent case updates and document activity will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
