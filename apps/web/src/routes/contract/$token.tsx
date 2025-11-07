import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Send,
  Shield,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OTPInput } from '../../components/OTPInput';
import {
  validateMagicLink,
  requestOTP,
  verifyOTP,
  getContractForSigning,
  type ValidationResult,
  type ContractData,
} from '../../lib/public-contract-api';

type ViewState = 'loading' | 'invalid' | 'expired' | 'otp-request' | 'otp-verify' | 'view';

export default function ContractViewer() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // View state
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [contractId, setContractId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contract, setContract] = useState<ContractData | null>(null);

  // OTP state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation on mount
  useEffect(() => {
    if (!token) {
      setViewState('invalid');
      return;
    }
    validateToken();
  }, [token]);

  // Load contract when we have a session
  useEffect(() => {
    if (contractId && sessionId) {
      loadContract();
    }
  }, [contractId, sessionId]);

  async function validateToken() {
    try {
      const result = await validateMagicLink(token!);

      if (!result.success) {
        if (result.expired) {
          setViewState('expired');
        } else {
          setViewState('invalid');
        }
        return;
      }

      setContractId(result.contractId!);
      setViewState('otp-request');
    } catch (error) {
      console.error('Failed to validate token:', error);
      setViewState('invalid');
    }
  }

  async function handleRequestOTP() {
    if (!email || !token) return;

    setIsSubmitting(true);
    setOtpError(null);

    try {
      const result = await requestOTP(token, email);

      if (!result.success) {
        setOtpError(result.message);
        return;
      }

      setOtpExpiresAt(result.expiresAt!);
      setViewState('otp-verify');
    } catch (error) {
      console.error('Failed to request OTP:', error);
      setOtpError('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otp || !token) return;

    setIsSubmitting(true);
    setOtpError(null);

    try {
      const result = await verifyOTP(token, otp);

      if (!result.success) {
        setOtpError(result.message || 'Invalid OTP code');
        setAttemptsRemaining(result.attemptsRemaining || null);
        return;
      }

      setSessionId(result.sessionId!);
      // Contract will load via useEffect
      setViewState('view');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      setOtpError('Failed to verify OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadContract() {
    if (!contractId || !sessionId) return;

    try {
      const result = await getContractForSigning(contractId, sessionId);

      if (!result.success) {
        setOtpError(result.message || 'Failed to load contract');
        return;
      }

      setContract(result.data!);
    } catch (error) {
      console.error('Failed to load contract:', error);
      setOtpError('Failed to load contract');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'SIGNED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SENT':
        return 'bg-blue-100 text-primary dark:text-primary border-blue-200';
      case 'VIEWED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DRAFT':
        return 'bg-muted text-foreground border-border';
      case 'VOIDED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-muted text-foreground border-border';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'SIGNED':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'SENT':
        return <Send className="w-5 h-5 text-primary" />;
      case 'VIEWED':
        return <Eye className="w-5 h-5 text-secondary" />;
      case 'DRAFT':
        return <FileText className="w-5 h-5 text-muted-foreground" />;
      case 'VOIDED':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'EXPIRED':
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  }

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating your link...</p>
        </div>
      </div>
    );
  }

  // Invalid link
  if (viewState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
          <p className="text-muted-foreground mb-6">
            This contract link is not valid. Please check the link and try again, or contact us for
            assistance.
          </p>
          <Button onClick={() => window.location.href = 'mailto:support@example.com'}>
            Contact Support
          </Button>
        </div>
      </div>
    );
  }

  // Expired link
  if (viewState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <Clock className="w-16 h-16 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Link Expired</h1>
          <p className="text-muted-foreground mb-6">
            This contract link has expired. Please request a new link or contact us for assistance.
          </p>
          <Button onClick={() => window.location.href = 'mailto:support@example.com'}>
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  // OTP Request
  if (viewState === 'otp-request') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Identity</h1>
            <p className="text-muted-foreground">
              To view this contract, we'll send a verification code to your email address.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isSubmitting}
                onKeyPress={(e) => e.key === 'Enter' && handleRequestOTP()}
              />
            </div>

            {otpError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{otpError}</p>
              </div>
            )}

            <Button
              onClick={handleRequestOTP}
              disabled={!email || isSubmitting}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification
  if (viewState === 'otp-verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Enter Verification Code</h1>
            <p className="text-muted-foreground">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
              onComplete={handleVerifyOTP}
            />

            {otpError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-destructive">{otpError}</p>
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <p className="text-xs text-destructive mt-1">
                      {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setViewState('otp-request');
                  setOtp('');
                  setOtpError(null);
                }}
              >
                Back
              </Button>
            </div>

            <button
              onClick={handleRequestOTP}
              className="w-full text-sm text-primary hover:text-primary dark:text-primary"
              disabled={isSubmitting}
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Contract View
  if (viewState === 'view' && contract) {
    const alreadySigned = contract.status === 'SIGNED';

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{contract.title}</h1>
                <p className="text-muted-foreground">{contract.contractNumber}</p>
              </div>
              <div className={`px-4 py-2 rounded-full border ${getStatusColor(contract.status)}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(contract.status)}
                  <span className="font-medium">{contract.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg shadow-lg p-8 mb-6">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: contract.content }}
                />
              </div>

              {/* Action Buttons */}
              {!alreadySigned && (
                <div className="flex gap-4">
                  <Button
                    onClick={() => navigate(`/contract/sign/${token}`)}
                    size="lg"
                    className="flex-1"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Sign Contract
                  </Button>
                  <Button variant="secondary" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF
                  </Button>
                </div>
              )}

              {alreadySigned && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">
                        Contract Already Signed
                      </h3>
                      <p className="text-sm text-success">
                        This contract has already been signed. You can download a copy using the
                        button below.
                      </p>
                      <Button variant="secondary" className="mt-4">
                        <Download className="w-4 h-4 mr-2" />
                        Download Signed Copy
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contract Info */}
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
                <div className="space-y-4">
                  {contract.client && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Client</p>
                        <p className="text-foreground">{contract.client.name}</p>
                        <p className="text-sm text-muted-foreground">{contract.client.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                      <p className="text-foreground">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {contract.template && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Template</p>
                        <p className="text-foreground">{contract.template.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Secure Viewing</h4>
                    <p className="text-sm text-primary">
                      This contract is protected and can only be viewed by verified users.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
