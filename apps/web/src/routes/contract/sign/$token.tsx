import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { SignatureCanvas } from '../../../components/SignatureCanvas';
import { OTPInput } from '../../../components/OTPInput';
import {
  validateMagicLink,
  requestOTP,
  verifyOTP,
  getContractForSigning,
  signContract,
  declineContract,
  extendSession,
} from '../../../lib/public-contract-api';

type Step = 'validating' | 'request-otp' | 'verify-otp' | 'view-contract' | 'signing' | 'success' | 'error';

interface ContractData {
  id: string;
  contractNumber: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SignContract() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('validating');
  const [contractId, setContractId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [contract, setContract] = useState<ContractData | null>(null);
  const [email, setEmail] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<string>('');
  const [sessionExpiry, setSessionExpiry] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Signature form state
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signedData, setSignedData] = useState<any>(null);

  // OTP state
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Validate magic link on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid link');
      setStep('error');
      return;
    }

    validateMagicLink(token).then((result) => {
      if (result.success && result.contractId) {
        setContractId(result.contractId);
        setStep('request-otp');
      } else {
        setError(result.message || 'Invalid or expired link');
        setStep('error');
      }
    }).catch((err) => {
      setError('Failed to validate link');
      setStep('error');
    });
  }, [token]);

  // Session expiry monitor
  useEffect(() => {
    if (!sessionExpiry || step !== 'view-contract') return;

    const checkExpiry = setInterval(() => {
      const now = new Date();
      const expiry = new Date(sessionExpiry);
      const minutesRemaining = Math.floor((expiry.getTime() - now.getTime()) / 60000);

      if (minutesRemaining <= 0) {
        setError('Session expired');
        setStep('error');
      } else if (minutesRemaining <= 5) {
        // Auto-extend if less than 5 minutes remaining
        extendSession(contractId, sessionId).then((result) => {
          if (result.success && result.expiresAt) {
            setSessionExpiry(result.expiresAt);
          }
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkExpiry);
  }, [sessionExpiry, step, contractId, sessionId]);

  const handleRequestOTP = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await requestOTP(token!, email);
      if (result.success) {
        setOtpExpiry(result.expiresAt || '');
        setStep('verify-otp');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setLoading(true);
    setError('');
    setOtpError(false);

    try {
      const result = await verifyOTP(token!, otp);
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        setSessionExpiry(result.expiresAt || '');
        await loadContract(contractId, result.sessionId);
      } else {
        setOtpError(true);
        setAttemptsRemaining(result.attemptsRemaining || null);
        setError(result.message || 'Invalid OTP code');
      }
    } catch (err) {
      setOtpError(true);
      setError('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const loadContract = async (cId: string, sId: string) => {
    try {
      const result = await getContractForSigning(cId, sId);
      if (result.success && result.data) {
        setContract(result.data);
        setSignerEmail(result.data.client?.email || email);
        setSignerName(result.data.client?.name || '');
        setStep('view-contract');
      } else {
        setError(result.message || 'Failed to load contract');
        setStep('error');
      }
    } catch (err) {
      setError('Failed to load contract');
      setStep('error');
    }
  };

  const handleSign = async () => {
    // Validation
    if (!signerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!signerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!signatureDataUrl) {
      setError('Please provide your signature');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the terms');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signContract(contractId, sessionId, {
        signatureDataUrl,
        signerName,
        signerEmail,
        agreedToTerms,
      });

      if (result.success && result.data) {
        setSignedData(result.data);
        setStep('success');
      } else {
        setError(result.message || 'Failed to sign contract');
        if (result.errors) {
          setError(result.errors.join(', '));
        }
      }
    } catch (err) {
      setError('Failed to sign contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this contract?')) return;

    setLoading(true);
    try {
      await declineContract(contractId, sessionId);
      navigate('/contract/declined');
    } catch (err) {
      setError('Failed to decline contract');
    } finally {
      setLoading(false);
    }
  };

  // Render different steps
  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating link...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (step === 'request-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Verify Your Email</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Enter your email address to receive a verification code
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRequestOTP()}
              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleRequestOTP}
            disabled={loading || !email}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Enter Verification Code</h2>
          <p className="text-muted-foreground mb-6 text-center">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-destructive text-sm">
              {error}
              {attemptsRemaining !== null && (
                <div className="mt-1 font-medium">
                  {attemptsRemaining} attempts remaining
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <OTPInput
              length={6}
              onComplete={handleVerifyOTP}
              onChange={(otp) => {
                setOtpValue(otp);
                setOtpError(false);
                setError('');
              }}
              disabled={loading}
              error={otpError}
            />
          </div>

          <button
            onClick={() => setStep('request-otp')}
            className="w-full text-sm text-primary hover:text-primary"
          >
            Resend code
          </button>
        </div>
      </div>
    );
  }

  if (step === 'view-contract') {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">{contract?.title}</h1>
              <p className="text-muted-foreground">Contract #{contract?.contractNumber}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-destructive">
                {error}
              </div>
            )}

            {/* Contract Content */}
            <div
              className="prose max-w-none mb-8 p-6 bg-background rounded-lg border"
              dangerouslySetInnerHTML={{ __html: contract?.content || '' }}
            />

            {/* Signature Section */}
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Sign Contract</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Signature *
                  </label>
                  <SignatureCanvas
                    onSignatureChange={setSignatureDataUrl}
                    width={600}
                    height={200}
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-ring border-input rounded"
                  />
                  <label htmlFor="agree" className="ml-2 text-sm text-foreground">
                    I have read and agree to the terms of this contract
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSign}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing...' : 'Sign Contract'}
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={loading}
                    className="px-6 py-3 bg-card text-foreground font-medium border border-input rounded-lg hover:bg-background disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Contract Signed!</h2>
          <p className="text-muted-foreground mb-6">
            Your contract has been successfully signed.
          </p>
          <div className="bg-background rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-1">Contract Number</p>
            <p className="font-semibold">{signedData?.contractNumber}</p>
            <p className="text-sm text-muted-foreground mt-3 mb-1">Signed At</p>
            <p className="font-semibold">{new Date(signedData?.signedAt).toLocaleString()}</p>
          </div>

          {signedData?.signedPdfPath && (
            <a
              href={`http://localhost:3002${signedData.signedPdfPath}`}
              download={`${signedData.contractNumber}_signed.pdf`}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mb-4"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Signed Contract
            </a>
          )}

          <p className="text-sm text-muted-foreground">
            A copy of the signed contract has been sent to your email.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
