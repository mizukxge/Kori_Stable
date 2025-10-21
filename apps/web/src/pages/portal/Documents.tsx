import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileText, Download, Eye } from 'lucide-react';

export function PortalDocuments() {
  const documents = [
    {
      id: '1',
      title: 'Wedding Photography Contract',
      type: 'Contract',
      date: '2024-11-15',
      status: 'signed',
    },
    {
      id: '2',
      title: 'Photography Services Proposal',
      type: 'Proposal',
      date: '2024-11-10',
      status: 'accepted',
    },
    {
      id: '3',
      title: 'Model Release Form',
      type: 'Release',
      date: '2024-11-20',
      status: 'pending',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          View contracts, proposals, and agreements
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{doc.title}</CardTitle>
                    <CardDescription>
                      {doc.type} • {new Date(doc.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={
                    doc.status === 'signed' || doc.status === 'accepted'
                      ? 'success'
                      : 'warning'
                  }
                >
                  {doc.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                {doc.status === 'pending' && (
                  <Button>Sign Document</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}