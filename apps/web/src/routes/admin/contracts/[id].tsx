import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Calendar,
  FileSignature,
  RefreshCw,
  Shield,
  AlertCircle,
  Check,
  X,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { AuditTrail } from '../../../components/contracts/AuditTrail';
import {
  getContractById,
  sendContract,
  resendContract,
  deleteContract,
  updateContractStatus,
  generateContractPDF,
  regenerateContractPDF,
  verifyContractPDF,
  getContractPDFInfo,
  downloadContractPDF,
  type Contract,
} from '../../../lib/contracts-api';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<any>(null);
  const [pdfVerification, setPdfVerification] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  async function loadContract() {
    try {
      setIsLoading(true);
      const data = await getContractById(id!);
      setContract(data);

      // Load PDF info if PDF exists
      if (data.pdfPath) {
        try {
          const info = await getContractPDFInfo(id!);
          setPdfInfo(info);
        } catch (error) {
          console.error('Failed to load PDF info:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load contract:', error);
      alert('Failed to load contract');
      navigate('/admin/contracts');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!contract || !confirm('Send this contract to the client?')) return;

    try {
      setIsSending(true);
      await sendContract(contract.id);
      alert('Contract sent successfully!');
      loadContract();
    } catch (error: any) {
      console.error('Failed to send contract:', error);
      alert(error.message || 'Failed to send contract');
    } finally {
      setIsSending(false);
    }
  }

  async function handleResend() {
    if (!contract || !confirm('Resend this contract? This will revoke the old magic link and generate a new one.')) return;

    try {
      setIsResending(true);
      const result = await resendContract(contract.id);
      alert(`Contract resent successfully!\n\nNew magic link expires: ${new Date(result.magicLinkExpiresAt!).toLocaleString()}`);
      loadContract();
    } catch (error: any) {
      console.error('Failed to resend contract:', error);
      alert(error.message || 'Failed to resend contract');
    } finally {
      setIsResending(false);
    }
  }

  async function handleDelete() {
    if (!contract || !confirm('Delete this contract? This action cannot be undone.')) return;

    try {
      await deleteContract(contract.id);
      alert('Contract deleted successfully');
      navigate('/admin/contracts');
    } catch (error: any) {
      console.error('Failed to delete contract:', error);
      alert(error.message || 'Failed to delete contract');
    }
  }

  async function handleGeneratePDF() {
    if (!id) return;

    try {
      setIsGeneratingPDF(true);
      const updated = await generateContractPDF(id);
      setContract(updated);

      // Load PDF info after generation
      const info = await getContractPDFInfo(id);
      setPdfInfo(info);

      alert('PDF generated successfully!');
    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      alert(error.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  async function handleRegeneratePDF() {
    if (!id || !contract?.pdfPath) return;

    if (!confirm('Are you sure you want to regenerate the PDF? This will replace the existing PDF.')) {
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const updated = await regenerateContractPDF(id);
      setContract(updated);

      // Reload PDF info
      const info = await getContractPDFInfo(id);
      setPdfInfo(info);

      alert('PDF regenerated successfully!');
    } catch (error: any) {
      console.error('Failed to regenerate PDF:', error);
      alert(error.message || 'Failed to regenerate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  async function handleVerifyPDF() {
    if (!id || !contract?.pdfPath) return;

    try {
      const verification = await verifyContractPDF(id);
      setPdfVerification(verification);

      if (verification.isValid) {
        alert('✓ PDF verification successful!\n\nThe PDF is valid and has not been tampered with.');
      } else {
        alert('✗ PDF verification failed!\n\nThe PDF may have been modified or corrupted.');
      }
    } catch (error: any) {
      console.error('Failed to verify PDF:', error);
      alert(error.message || 'Failed to verify PDF');
    }
  }

  async function handleDownloadPDF() {
    if (!contract?.pdfPath) return;
    downloadContractPDF(contract.pdfPath, `${contract.contractNumber}.pdf`);
  }

  async function handleCopyMagicLink() {
    if (!contract?.magicLinkUrl) return;

    try {
      await navigator.clipboard.writeText(contract.magicLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link to clipboard');
    }
  }

  async function handleUpdateStatus(status: Contract['status']) {
    if (!id) return;

    try {
      const updated = await updateContractStatus(id, status);
      setContract(updated);
      alert('Status updated successfully!');
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.message || 'Failed to update status');
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-6 h-6 text-gray-400" />;
      case 'SENT':
        return <Send className="w-6 h-6 text-blue-500" />;
      case 'VIEWED':
        return <Eye className="w-6 h-6 text-purple-500" />;
      case 'SIGNED':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'VOIDED':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'EXPIRED':
        return <Clock className="w-6 h-6 text-orange-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-400" />;
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
      SENT: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      VIEWED: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      SIGNED: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      VOIDED: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      EXPIRED: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 dark:bg-gray-800 text-foreground'}`}>
        {status}
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive font-semibold">Contract not found</p>
        <Link to="/admin/contracts" className="text-primary hover:underline mt-4 inline-block">
          ← Back to contracts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Draft Status Banner */}
      {contract.status === 'DRAFT' && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Draft Contract</h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This contract is still in draft status. Generate a PDF and send it to the client to begin the signing process.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/contracts"
          className="inline-flex items-center text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/60 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Link>
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {getStatusIcon(contract.status)}
              <h1 className="text-3xl font-bold text-foreground">{contract.title}</h1>
              {getStatusBadge(contract.status)}
            </div>
            <p className="text-muted-foreground">{contract.contractNumber}</p>
          </div>
          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
            {contract.status === 'DRAFT' && (
              <Button onClick={handleSend} disabled={isSending} className="flex-1 sm:flex-none">
                <Send className="w-4 h-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Contract'}
              </Button>
            )}
            {(contract.status === 'SENT' || contract.status === 'VIEWED') && (
              <Button onClick={handleResend} disabled={isResending} className="flex-1 sm:flex-none">
                <RefreshCw className="w-4 h-4 mr-2" />
                {isResending ? 'Resending...' : 'Resend Contract'}
              </Button>
            )}
            {contract.pdfPath && (
              <Button variant="secondary" onClick={handleDownloadPDF} className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
            {!contract.pdfPath && contract.status === 'DRAFT' && (
              <Button variant="secondary" onClick={handleGeneratePDF} disabled={isGeneratingPDF} className="flex-1 sm:flex-none">
                <FileText className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
              </Button>
            )}
            <Button variant="secondary" onClick={handleDelete} className="flex-1 sm:flex-none">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Client Info */}
        <div className="bg-card rounded-lg shadow p-4 border border-border">
          <div className="flex items-center mb-2">
            <User className="w-5 h-5 text-muted-foreground mr-2" />
            <h3 className="font-semibold text-foreground">Client</h3>
          </div>
          {contract.client ? (
            <div>
              <p className="text-foreground font-medium">{contract.client.name}</p>
              <p className="text-sm text-muted-foreground">{contract.client.email}</p>
              {contract.client.phone && (
                <p className="text-sm text-muted-foreground">{contract.client.phone}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No client assigned</p>
          )}
        </div>

        {/* Template Info */}
        <div className="bg-card rounded-lg shadow p-4 border border-border">
          <div className="flex items-center mb-2">
            <FileSignature className="w-5 h-5 text-muted-foreground mr-2" />
            <h3 className="font-semibold text-foreground">Template</h3>
          </div>
          {contract.template ? (
            <div>
              <p className="text-foreground font-medium">{contract.template.name}</p>
              <p className="text-sm text-muted-foreground">Version {contract.template.version}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Template information unavailable</p>
          )}
        </div>

        {/* Timeline Info */}
        <div className="bg-card rounded-lg shadow p-4 border border-border">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-muted-foreground mr-2" />
            <h3 className="font-semibold text-foreground">Timeline</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-foreground font-medium">
                {new Date(contract.createdAt).toLocaleDateString()}
              </span>
            </div>
            {contract.sentAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sent:</span>
                <span className="text-foreground font-medium">
                  {new Date(contract.sentAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {contract.signedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signed:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {new Date(contract.signedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Magic Link Section */}
      {contract.magicLinkUrl && (
        <div className="bg-card rounded-lg shadow mb-6 border border-border">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Client Signing Link</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                    Share this link with your client to sign the contract:
                  </p>
                  <div className="flex items-center gap-2 flex-col sm:flex-row">
                    <code className="flex-1 text-sm bg-card px-3 py-2 rounded border border-border text-foreground font-mono break-all w-full">
                      {contract.magicLinkUrl}
                    </code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyMagicLink}
                      className="flex-shrink-0 w-full sm:w-auto"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  {contract.magicLinkExpiresAt && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Expires: {new Date(contract.magicLinkExpiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium mb-1 text-foreground">How it works:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Client opens the link in their browser</li>
                <li>They verify their identity with an email OTP code</li>
                <li>They review and sign the contract electronically</li>
                <li>You'll receive a notification when signed</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* PDF Management Section */}
      <div className="bg-card rounded-lg shadow mb-6 border border-border">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">PDF Document</h2>
            {contract.pdfPath && pdfVerification && (
              <div className="flex items-center gap-1">
                {pdfVerification.isValid ? (
                  <>
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">Invalid</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {contract.pdfPath ? (
            <div className="space-y-4">
              {/* PDF Info */}
              {pdfInfo && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Pages</p>
                      <p className="text-foreground text-lg font-semibold">{pdfInfo.pageCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">File Size</p>
                      <p className="text-foreground text-lg font-semibold">
                        {(pdfInfo.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {pdfInfo.creationDate && (
                      <div>
                        <p className="text-muted-foreground font-medium">Created</p>
                        <p className="text-foreground text-sm">
                          {new Date(pdfInfo.creationDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {pdfInfo.author && (
                      <div>
                        <p className="text-muted-foreground font-medium">Author</p>
                        <p className="text-foreground text-sm">{pdfInfo.author}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PDF Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button onClick={handleDownloadPDF} variant="secondary" className="flex-1 sm:flex-none">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={handleRegeneratePDF} variant="secondary" disabled={isGeneratingPDF} className="flex-1 sm:flex-none">
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
                  {isGeneratingPDF ? 'Regenerating...' : 'Regenerate PDF'}
                </Button>
                <Button onClick={handleVerifyPDF} variant="secondary" className="flex-1 sm:flex-none">
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Integrity
                </Button>
              </div>

              {/* PDF Preview */}
              <div className="border border-border rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={`http://localhost:3002${contract.pdfPath}`}
                  className="w-full h-[600px]"
                  title="Contract PDF Preview"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No PDF Generated</h3>
              <p className="text-muted-foreground mb-4">
                Generate a PDF document for this contract to share with the client
              </p>
              <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
                <FileText className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contract Content */}
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Contract Content</h2>
        </div>
        <div
          className="p-6 prose dark:prose-invert prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: contract.content }}
        />
      </div>

      {/* Audit Trail */}
      <div className="mt-6">
        <AuditTrail contractId={contract.id} />
      </div>

      {/* Variables (for debugging/reference) */}
      {contract.variables && Object.keys(contract.variables).length > 0 && (
        <div className="mt-6 bg-card rounded-lg shadow border border-border">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Contract Variables</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(contract.variables).map(([key, value]) => (
                <div key={key} className="border-b border-border pb-2">
                  <p className="text-sm text-muted-foreground font-medium">{key}</p>
                  <p className="text-foreground break-words">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
