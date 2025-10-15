import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Settings, BarChart } from "lucide-react";

const Admin = () => {
  const sections = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
    },
    {
      title: "Security Policies",
      description: "Configure security rules and access controls",
      icon: Shield,
    },
    {
      title: "System Settings",
      description: "Configure RAG settings and system parameters",
      icon: Settings,
    },
    {
      title: "Audit & Reports",
      description: "View audit trails and generate reports",
      icon: BarChart,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">
          System administration and configuration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon - full admin functionality
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Admin;
