import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Download, Image, Video, File } from 'lucide-react';

export function PortalFiles() {
  const files = [
    {
      id: '1',
      name: 'Wedding_Album_High_Res.zip',
      type: 'archive',
      size: '2.4 GB',
      date: '2025-01-20',
      downloads: 0,
    },
    {
      id: '2',
      name: 'Engagement_Photos_Web.zip',
      type: 'archive',
      size: '156 MB',
      date: '2024-12-15',
      downloads: 2,
    },
    {
      id: '3',
      name: 'Highlight_Video.mp4',
      type: 'video',
      size: '450 MB',
      date: '2025-01-18',
      downloads: 5,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Downloads</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Access your photos and videos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Files</CardTitle>
          <CardDescription>Download your high-resolution files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {getIcon(file.type)}
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>Added {new Date(file.date).toLocaleDateString()}</span>
                      {file.downloads > 0 && (
                        <>
                          <span>•</span>
                          <span>{file.downloads} downloads</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Files are available for download for 90 days</p>
          <p>• High-resolution files are large - ensure you have stable internet</p>
          <p>• Contact us if you need files re-uploaded</p>
        </CardContent>
      </Card>
    </div>
  );
}