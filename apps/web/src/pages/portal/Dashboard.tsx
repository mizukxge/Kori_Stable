import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileText, Image, MessageSquare, DollarSign, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PortalDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your photography client portal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Galleries</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Active galleries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Files available</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Latest updates from your photographer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                KP
              </div>
              <div className="flex-1">
                <p className="font-medium">Your photos are ready!</p>
                <p className="text-sm text-muted-foreground">
                  We've uploaded your final edited photos to the gallery.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/messages">View All Messages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invoices</CardTitle>
            <CardDescription>Outstanding payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Wedding Photography Package</p>
                <p className="text-sm text-muted-foreground">Invoice #INV-2025-001</p>
              </div>
              <div className="text-right">
                <p className="font-bold">$2,500.00</p>
                <Badge variant="warning">Due in 5 days</Badge>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/invoices">View All Invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access your files and documents</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to="/portal/files">
              <Download className="mr-2 h-4 w-4" />
              Download Photos
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/portal/documents">
              <FileText className="mr-2 h-4 w-4" />
              View Documents
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/portal/messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}