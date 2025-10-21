import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';

export function DesignSystemDemo() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Kori Photography Platform UI Components
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Different button variants and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Inputs, labels, and form controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
          </div>
          
          <Button>Submit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Design system colors (adapts to theme)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <div className="h-20 rounded-lg bg-primary" />
              <p className="mt-2 text-sm font-medium">Primary</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-secondary" />
              <p className="mt-2 text-sm font-medium">Secondary</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-accent" />
              <p className="mt-2 text-sm font-medium">Accent</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-destructive" />
              <p className="mt-2 text-sm font-medium">Destructive</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-success" />
              <p className="mt-2 text-sm font-medium">Success</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-warning" />
              <p className="mt-2 text-sm font-medium">Warning</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-muted" />
              <p className="mt-2 text-sm font-medium">Muted</p>
            </div>
            <div>
              <div className="h-20 rounded-lg border bg-card" />
              <p className="mt-2 text-sm font-medium">Card</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}