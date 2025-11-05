import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { Send } from 'lucide-react';

export function PortalMessages() {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send message to API
    console.log('Sending message:', message);
    setMessage('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Messages</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Communicate with your photographer
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    KP
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-muted p-4">
                      <p className="font-medium">Kori Photography</p>
                      <p className="mt-1 text-sm">
                        Hi! Your photos are ready for review. Please check the gallery and let me know which ones you'd like edited.
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">Today at 10:30 AM</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 flex-row-reverse">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                    You
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-primary text-primary-foreground p-4">
                      <p className="mt-1 text-sm">
                        Thank you! I'll review them today and mark my favorites.
                      </p>
                      <p className="mt-2 text-xs opacity-80">Today at 11:15 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Message Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="message">New Message</Label>
                  <Input
                    id="message"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={!message.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Thread Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Subject</p>
                <p className="text-sm text-muted-foreground">Wedding Photography - June 2025</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">24 messages</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}