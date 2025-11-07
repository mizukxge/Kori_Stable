/**
 * Send Proposal Email Modal Component
 */

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { X } from 'lucide-react';

interface SendProposalEmailProps {
  proposalId: string;
  onClose: () => void;
}

export function SendProposalEmail({ proposalId, onClose }: SendProposalEmailProps) {
  return (
    <div className="fixed inset-0 z-modal bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Send Proposal Email</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          Send proposal email functionality coming soon
        </div>
      </Card>
    </div>
  );
}
