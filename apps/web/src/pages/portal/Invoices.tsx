import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Download, CreditCard } from 'lucide-react';

export function PortalInvoices() {
  const invoices = [
    {
      id: 'INV-2025-001',
      title: 'Wedding Photography Package',
      date: '2025-01-15',
      dueDate: '2025-02-15',
      amount: 2500.00,
      status: 'pending',
    },
    {
      id: 'INV-2024-045',
      title: 'Engagement Session',
      date: '2024-12-10',
      dueDate: '2025-01-10',
      amount: 500.00,
      status: 'paid',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Invoices</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            View and manage your invoices
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{invoice.title}</CardTitle>
                  <CardDescription>Invoice #{invoice.id}</CardDescription>
                </div>
                <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                  {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium">Invoice Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-2xl font-bold">
                    ${invoice.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  {invoice.status === 'pending' ? (
                    <Button className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Now
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No invoices found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}