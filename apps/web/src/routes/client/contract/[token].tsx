/**
 * Contract Signing Portal
 * Public route for clients to view and sign contracts
 * Route: /contract/sign/:token
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { AlertCircle, Lock, Mail, Eye, Loader } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface SigningStage {
  stage: 'loading' | 'authentication' | 'review' | 'signature' | 'complete' | 'error';
  message?: string;
}

export default function ContractSigningPortal() {
  const { token } = useParams<{ token: string }>();
  const [signingStage, setSigningStage] = useState<SigningStage>({ stage: 'loading' });
  const [contract, setContract] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('type');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load contract on mount
  useEffect(() => {
    loadContract();
  }, [token]);

  // Request OTP when reaching authentication stage
  useEffect(() => {
    if (signingStage.stage === 'authentication' && contract?.id && !isLoading) {
      handleRequestOTP();
    }
  }, [signingStage.stage]);

  const loadContract = async () => {
    try {
      // Validate magic link token
      const response = await fetch(`/contract/validate/${token}`);
      if (!response.ok) {
        const error = await response.json();
        setSigningStage({
          stage: 'error',
          message: error.message || 'Contract not found or signing link has expired',
        });
        return;
      }

      const data = await response.json();
      const contractId = data.contractId;
      setContract({ id: contractId });

      // For now, always require OTP (can be enhanced later)
      setSigningStage({ stage: 'authentication', message: 'Enter the code sent to your email' });
    } catch (error) {
      console.error('Error loading contract:', error);
      setSigningStage({
        stage: 'error',
        message: 'Failed to load contract. Please try again later.',
      });
    }
  };


  // Request OTP before verification
  const handleRequestOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/contract/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: '' }), // Email will be entered by user
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Failed to request OTP');
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      alert('Failed to request OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/contract/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, otp: otpCode }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setSessionId(data.sessionId);
      setOtpCode(''); // Clear OTP

      // Now fetch the contract for review
      const contractResponse = await fetch(`/contract/view/${contract.id}?sessionId=${data.sessionId}`);
      const contractData = await contractResponse.json();
      setContract(contractData.data);

      setSigningStage({ stage: 'review', message: 'Review the contract below' });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Draw signature on canvas
  useEffect(() => {
    if (signatureType === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = canvas.offsetWidth;
      canvas.height = 200;

      let isDrawing = false;

      ctx!.strokeStyle = '#000';
      ctx!.lineWidth = 2;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';

      canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        ctx!.beginPath();
        ctx!.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      });

      canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx!.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx!.stroke();
      });

      canvas.addEventListener('mouseup', () => {
        isDrawing = false;
      });

      canvas.addEventListener('mouseout', () => {
        isDrawing = false;
      });

      setSignatureCanvas(canvas);
    }
  }, [signatureType]);

  // Clear canvas
  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Handle signature submission
  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let signatureDataUrl = '';

      if (signatureType === 'draw' && canvasRef.current) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      } else if (signatureType === 'type') {
        // For typed signatures, create a simple canvas with the typed text
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = '24px cursive';
          ctx.fillText(signerName, 20, 50);
        }
        signatureDataUrl = canvas.toDataURL('image/png');
      }

      const response = await fetch(`/contract/sign/${contract.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          signatureDataUrl,
          signerName,
          signerEmail: signerName, // Using signer name as email for now
          agreedToTerms: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setSigningStage({ stage: 'complete', message: 'Contract signed successfully!' });
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Failed to sign contract');
    } finally {
      setIsLoading(false);
    }
  };


  // Render loading state
  if (signingStage.stage === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading contract...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Render error state
  if (signingStage.stage === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <div className="p-6">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-center font-semibold text-destructive mb-2">Error</p>
            <p className="text-center text-muted-foreground">{signingStage.message}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Render completion state
  if (signingStage.stage === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Contract Signed Successfully</h2>
            <p className="text-muted-foreground mb-6">Your signature has been recorded and verified.</p>
            <p className="text-sm text-muted-foreground">
              A confirmation email with the signed contract has been sent to your email address.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Render authentication stage (OTP only)
  if (signingStage.stage === 'authentication') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Verify Your Identity</h2>
            </div>
            <p className="text-sm text-muted-foreground">{signingStage.message}</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">One-Time Code</label>
                <p className="text-xs text-muted-foreground mb-3">Check your email for the 6-digit code sent to you</p>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading || otpCode.length !== 6} className="w-full">
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRequestOTP}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Resend Code'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  // Render review stage
  if (signingStage.stage === 'review' && sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <Card className="mb-6">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{contract?.title}</h1>
                <p className="text-sm text-muted-foreground">Contract #{contract?.contractNumber}</p>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Contract Details */}
            <div className="p-6 grid grid-cols-2 gap-4 border-b">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{contract?.status}</p>
              </div>
              {contract?.signByAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Sign By</p>
                  <p className="font-medium">{new Date(contract.signByAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Contract Content */}
            <div className="p-6 border-b max-h-96 overflow-y-auto">
              {contract?.bodyHtml ? (
                <div dangerouslySetInnerHTML={{ __html: contract.bodyHtml }} className="prose prose-sm max-w-none" />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{contract?.content}</p>
              )}
            </div>
          </Card>

          {/* Signature Section */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-6">Your Signature</h2>

              <form onSubmit={handleSign} className="space-y-6">
                {/* Signer Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Signature Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">Signature Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureType"
                        value="type"
                        checked={signatureType === 'type'}
                        onChange={(e) => setSignatureType(e.target.value as any)}
                        disabled={isLoading}
                      />
                      <span className="text-sm">Type your name</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureType"
                        value="draw"
                        checked={signatureType === 'draw'}
                        onChange={(e) => setSignatureType(e.target.value as any)}
                        disabled={isLoading}
                      />
                      <span className="text-sm">Draw your signature</span>
                    </label>
                  </div>
                </div>

                {/* Draw Signature Canvas */}
                {signatureType === 'draw' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Draw your signature below</label>
                    <canvas
                      ref={canvasRef}
                      className="w-full border-2 border-dashed border-muted rounded-lg bg-white"
                      style={{ minHeight: '200px', cursor: 'crosshair' }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearCanvas}
                      className="mt-2"
                      disabled={isLoading}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {/* Acceptance Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    required
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground">
                    I accept the terms of this contract and authorize my signature to represent my legal agreement.
                  </span>
                </label>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!signerName || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Signing...' : 'Sign Contract'}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
