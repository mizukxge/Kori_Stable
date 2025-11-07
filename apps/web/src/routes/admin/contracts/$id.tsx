import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft,
  Send,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Mail,
  User,
  Calendar,
  RefreshCw,
  Shield,
  QrCode,
  Copy,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ContractPreview } from '../../../components/ContractPreview';
import {
  getContract,
  sendContract,
  deleteContract,
  downloadContractPDF,
  generateContractPDF,
  verifyContractPDF,
  type Contract,
} from '../../../lib/contracts-api';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  async function loadContract() {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await getContract(id);
      setContract(data);
    } catch (error) {
      console.error('Failed to load contract:', error);
      alert('Failed to load contract');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!contract) return;

    if (!contract.client || !contract.client.email) {
      alert('This contract must have a client with a valid email address before it can be sent.');
      return;
    }

    try {
      setIsSending(true);
      await sendContract(contract.id);
      alert(`Contract sent to ${contract.client.email}`);
      setShowSendModal(false);
      loadContract();
    } catch (error: any) {
      console.error('Failed to send contract:', error);
      alert(error.message || 'Failed to send contract');
    } finally {
      setIsSending(false);
    }
  }

  async function handleDelete() {
    if (!contract) return;

    try {
      setIsDeleting(true);
      await deleteContract(contract.id);
      alert('Contract deleted successfully');
      navigate('/admin/contracts');
    } catch (error) {
      console.error('Failed to delete contract:', error);
      alert('Failed to delete contract');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDownloadPDF() {
    if (!contract || !contract.pdfPath) {
      alert('PDF not available');
      return;
    }

    downloadContractPDF(contract.pdfPath, `${contract.contractNumber}.pdf`);
  }

  async function handleGeneratePDF() {
    if (!contract) return;

    try {
      setIsGeneratingPDF(true);
      const updated = await generateContractPDF(contract.id);
      setContract(updated);
      alert('PDF generated successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  async function handleVerifyPDF() {
    if (!contract || !contract.pdfPath) {
      alert('No PDF to verify');
      return;
    }

    try {
      setIsVerifying(true);
      const result = await verifyContractPDF(contract.id);
      setVerificationResult(result);

      if (result.valid) {
        alert('✓ PDF verification successful - document is authentic and unmodified');
      } else {
        alert('⚠ PDF verification failed - document may have been tampered with');
      }
    } catch (error) {
      console.error('Failed to verify PDF:', error);
      alert('Failed to verify PDF');
    } finally {
      setIsVerifying(false);
    }
  }

  function copyMagicLink() {
    if (!contract || !contract.magicLinkToken) {
      alert('No magic link available');
      return;
    }

    const magicLink = `${window.location.origin}/contract/sign/${contract.magicLinkToken}`;
    navigator.clipboard.writeText(magicLink);
    alert('Magic link copied to clipboard!');
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      DRAFT: 'bg-muted text-foreground',
      SENT: 'bg-blue-100 text-primary dark:text-primary',
      VIEWED: 'bg-purple-100 text-purple-800',
      SIGNED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.DRAFT}`}>
        {status}
      </span>
    );
  }

  function getStatusIcon(status: string) {
    const icons: Record<string, JSX.Element> = {
      DRAFT: <FileText className="w-6 h-6 text-muted-foreground" />,
      SENT: <Send className="w-6 h-6 text-primary" />,
      VIEWED: <Eye className="w-6 h-6 text-secondary" />,
      SIGNED: <CheckCircle className="w-6 h-6 text-success" />,
      DECLINED: <XCircle className="w-6 h-6 text-destructive" />,
      EXPIRED: <Clock className="w-6 h-6 text-orange-500" />,
    };

    return icons[status] || icons.DRAFT;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Contract Not Found</h3>
          <p className="text-muted-foreground mb-6">The requested contract could not be found.</p>
          <Link to="/admin/contracts">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contracts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/contracts"
          className="inline-flex items-center text-primary hover:text-primary dark:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {getStatusIcon(contract.status)}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{contract.title}</h1>
              <p className="text-muted-foreground mt-1">{contract.contractNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(contract.status)}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Client Info */}
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Client</h3>
          </div>
          {contract.client ? (
            <div>
              <p className="text-foreground font-medium">{contract.client.name}</p>
              <p className="text-muted-foreground text-sm">{contract.client.email}</p>
              {contract.client.phone && (
                <p className="text-muted-foreground text-sm">{contract.client.phone}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No client assigned</p>
          )}
        </div>

        {/* Dates */}
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Timeline</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2 text-foreground">
                {new Date(contract.createdAt).toLocaleDateString()}
              </span>
            </div>
            {contract.sentAt && (
              <div>
                <span className="text-muted-foreground">Sent:</span>
                <span className="ml-2 text-foreground">
                  {new Date(contract.sentAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {contract.signedAt && (
              <div>
                <span className="text-muted-foreground">Signed:</span>
                <span className="ml-2 text-foreground">
                  {new Date(contract.signedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PDF Info */}
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Document</h3>
          </div>
          {contract.pdfPath ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                <span className="text-sm text-success">PDF Generated</span>
              </div>
              {contract.pdfGeneratedAt && (
                <p className="text-xs text-muted-foreground">
                  Generated: {new Date(contract.pdfGeneratedAt).toLocaleString()}
                </p>
              )}
              {verificationResult && (
                <div className="mt-2 text-xs">
                  {verificationResult.valid ? (
                    <span className="text-success">✓ Verified authentic</span>
                  ) : (
                    <span className="text-destructive">⚠ Verification failed</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No PDF generated</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {contract.status === 'DRAFT' && (
            <Button onClick={() => setShowSendModal(true)}>
              <Send className="w-4 h-4 mr-2" />
              Send to Client
            </Button>
          )}

          {contract.pdfPath ? (
            <>
              <Button variant="secondary" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="secondary" onClick={handleVerifyPDF} disabled={isVerifying}>
                <Shield className="w-4 h-4 mr-2" />
                {isVerifying ? 'Verifying...' : 'Verify PDF'}
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
              <FileText className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
            </Button>
          )}

          {contract.magicLinkToken && (
            <>
              <Button variant="secondary" onClick={copyMagicLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Magic Link
              </Button>
              <Button variant="secondary" onClick={() => setShowQRModal(true)}>
                <QrCode className="w-4 h-4 mr-2" />
                Show QR Code
              </Button>
            </>
          )}

          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="ml-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Contract Preview */}
      <div className="bg-card rounded-lg shadow p-6">
        <ContractPreview
          content={contract.content}
          title={contract.title}
          contractNumber={contract.contractNumber}
          showMetadata={true}
          metadata={{
            client: contract.client?.name,
            template: contract.template?.name,
            status: contract.status,
            createdAt: contract.createdAt,
            sentAt: contract.sentAt,
            signedAt: contract.signedAt,
          }}
        />
      </div>

      {/* Send Confirmation Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Contract"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Email will be sent to:</h4>
                <p className="text-primary dark:text-primary mt-1">{contract.client?.email}</p>
                <p className="text-sm text-primary mt-2">
                  The client will receive a secure magic link to review and sign the contract.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSendModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Contract'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Contract"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Are you sure?</h4>
                <p className="text-sm text-destructive mt-1">
                  This will permanently delete the contract "{contract.title}". This action cannot be
                  undone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Contract'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      {showQRModal && contract.magicLinkToken && (
        <Modal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          title="QR Code for Contract Signing"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-block p-4 bg-card border-2 border-input rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
                    `${window.location.origin}/contract/sign/${contract.magicLinkToken}`
                  )}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Scan this QR code to open the contract signing page
              </p>
            </div>

            <div className="bg-background rounded-lg p-4">
              <p className="text-xs text-muted-foreground break-all">
                {`${window.location.origin}/contract/sign/${contract.magicLinkToken}`}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
