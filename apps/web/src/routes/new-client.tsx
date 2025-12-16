import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CLIENT_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual', description: 'Personal use or freelancer' },
  { value: 'business', label: 'Small Business', description: 'Business with company details' },
  { value: 'organization', label: 'Organization', description: 'Corporate, non-profit, or agency' },
];

const COUNTRY_CODES = [
  { code: 'GB', name: 'United Kingdom', prefix: '+44' },
  { code: 'US', name: 'United States', prefix: '+1' },
  { code: 'CA', name: 'Canada', prefix: '+1' },
  { code: 'AU', name: 'Australia', prefix: '+61' },
  { code: 'NZ', name: 'New Zealand', prefix: '+64' },
  { code: 'IE', name: 'Ireland', prefix: '+353' },
  { code: 'DE', name: 'Germany', prefix: '+49' },
  { code: 'FR', name: 'France', prefix: '+33' },
  { code: 'IT', name: 'Italy', prefix: '+39' },
  { code: 'ES', name: 'Spain', prefix: '+34' },
  { code: 'NL', name: 'Netherlands', prefix: '+31' },
  { code: 'SE', name: 'Sweden', prefix: '+46' },
  { code: 'NO', name: 'Norway', prefix: '+47' },
  { code: 'DK', name: 'Denmark', prefix: '+45' },
  { code: 'JP', name: 'Japan', prefix: '+81' },
  { code: 'SG', name: 'Singapore', prefix: '+65' },
  { code: 'HK', name: 'Hong Kong', prefix: '+852' },
];

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Found us on our website' },
  { value: 'google', label: 'Google Search' },
  { value: 'social', label: 'Social Media' },
  { value: 'referral', label: 'Referred by a friend' },
  { value: 'other', label: 'Other' },
];

const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'both', label: 'Both Email & Phone' },
];

interface FormData {
  // Step 0: Email (with OTP verification)
  email: string;

  // Step 1: Client Type
  clientType: 'individual' | 'business' | 'organization' | '';

  // Step 2: Contact Info (email pre-filled, disabled)
  name: string;
  phone: string;
  phoneCountry: string;

  // Step 3: Address (optional for business/organization)
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Step 4: Preferences
  source: string;
  preferredContactMethod: string;
}

interface OTPState {
  clientId: string;
  email: string;
}

const initialFormData: FormData = {
  email: '',
  clientType: '',
  name: '',
  phone: '',
  phoneCountry: 'GB',
  company: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'GB',
  source: '',
  preferredContactMethod: '',
};

export default function NewClientPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // 0=email, 1=type, 2=contact, 3=address, 4=preferences, 5=review, 6=otp, 7=success
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // OTP verification state (happens between step 0 and step 1)
  const [otpState, setOtpState] = useState<OTPState | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const hasAddressStep = formData.clientType === 'business' || formData.clientType === 'organization';

  // Calculate review step based on whether address step exists
  // This should return the actual currentStep value when showing review
  const getReviewStep = () => {
    if (formData.clientType === 'individual') return 4; // 0 (email), 0.5 (OTP), 1 (type), 2 (contact), 3 (preferences), 4 (review)
    return 5; // 0 (email), 0.5 (OTP), 1 (type), 2 (contact), 3 (address), 4 (preferences), 5 (review)
  };

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('newClientFormDraft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    localStorage.setItem('newClientFormDraft', JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Step 0: Email validation
  const validateEmail = (): boolean => {
    const stepErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      stepErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      stepErrors.email = 'Please enter a valid email address';
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Step 1: Client type validation
  const validateClientType = (): boolean => {
    const stepErrors: Record<string, string> = {};
    if (!formData.clientType) {
      stepErrors.clientType = 'Please select a client type';
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Step 2: Contact info validation
  const validateContact = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      stepErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      stepErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      stepErrors.phone = 'Phone number is required';
    } else {
      const fullPhone = `${COUNTRY_CODES.find((c) => c.code === formData.phoneCountry)?.prefix}${formData.phone.replace(/\D/g, '')}`;
      if (!isValidPhoneNumber(fullPhone, formData.phoneCountry as any)) {
        stepErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Step 3: Address validation
  const validateAddress = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (hasAddressStep && !formData.company.trim()) {
      stepErrors.company = 'Company name is required';
    }

    if (formData.zipCode && !/^[a-zA-Z0-9\s-]{1,20}$/.test(formData.zipCode)) {
      stepErrors.zipCode = 'Please enter a valid postal code';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Step 4: Preferences validation
  const validatePreferences = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (!formData.source) {
      stepErrors.source = 'Please select how you found us';
    }

    if (!formData.preferredContactMethod) {
      stepErrors.preferredContactMethod = 'Please select a preferred contact method';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Request OTP for email verification
  const handleRequestEmailOTP = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/clients/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      const result = await response.json();

      // Move to OTP verification step
      setOtpState({
        clientId: result.clientId,
        email: formData.email.trim(),
      });
      setOtpInput('');
      setOtpError(null);
      setCurrentStep(0.5); // OTP verification step (between 0 and 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(message);
      console.error('Error requesting OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpState || otpInput.length !== 6) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/clients/${otpState.clientId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otpCode: otpInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid OTP code');
      }

      // OTP verified, move to client type selection
      setOtpState(null);
      setOtpInput('');
      setCurrentStep(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP';
      setOtpError(message);
      console.error('Error verifying OTP:', error);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!otpState) return;

    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/clients/${otpState.clientId}/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend OTP');
      }

      alert('OTP code resent to ' + otpState.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend OTP';
      setOtpError(message);
      console.error('Error resending OTP:', error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 0) {
      handleRequestEmailOTP();
      return;
    } else if (currentStep === 1) {
      isValid = validateClientType();
    } else if (currentStep === 2) {
      isValid = validateContact();
    } else if (currentStep === 3 && hasAddressStep) {
      isValid = validateAddress();
    } else if (currentStep === 3 && !hasAddressStep) {
      isValid = validatePreferences();
    } else if (currentStep === 4 && hasAddressStep) {
      isValid = validatePreferences();
    }

    if (isValid) {
      let nextStep = currentStep + 1;

      // Note: Do NOT skip step 3 for individuals - it contains preferences
      // Step 3 = Address (business/org) or Preferences (individual)
      // Step 4 = Preferences (business/org) or Review (individual)
      // Step 5 = Review (individual)
      // Step 6 = Review (business/org)

      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep === 0.5) {
      // From OTP back to email
      setOtpState(null);
      setCurrentStep(0);
      return;
    }

    let prevStep = currentStep - 1;

    // Note: Do NOT skip step 3 when going back
    // The step flow is continuous for both individual and business/org types

    setCurrentStep(prevStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation
    if (!validatePreferences()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const countryPrefix =
        COUNTRY_CODES.find((c) => c.code === formData.phoneCountry)?.prefix || '+44';
      const phoneNumber = `${countryPrefix}${formData.phone.replace(/\D/g, '')}`;

      const response = await fetch(`${API_BASE_URL}/clients/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientType: formData.clientType,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: phoneNumber,
          company: formData.company.trim() || undefined,
          address: formData.address.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          zipCode: formData.zipCode.trim() || undefined,
          country: formData.country,
          source: formData.source,
          preferredContactMethod: formData.preferredContactMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      localStorage.removeItem('newClientFormDraft');
      setCurrentStep(7); // Success screen
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(message);
      console.error('Error submitting signup:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCountryPrefix = () => {
    return COUNTRY_CODES.find((c) => c.code === formData.phoneCountry)?.prefix || '+44';
  };

  const getCountryName = (code: string) => {
    return COUNTRY_CODES.find((c) => c.code === code)?.name || code;
  };

  const getStepTitle = () => {
    if (currentStep === 0) return 'Email Address';
    if (currentStep === 0.5) return 'Verify Email';
    if (currentStep === 1) return 'Client Type';
    if (currentStep === 2) return 'Contact Information';
    if (currentStep === 3 && hasAddressStep) return 'Address Details';
    if (currentStep === 3 && !hasAddressStep) return 'Communication Preferences';
    if (currentStep === 4 && hasAddressStep) return 'Communication Preferences';
    if (currentStep === 4 && !hasAddressStep) return 'Review Information'; // Individual review
    if (currentStep === 5 && hasAddressStep) return 'Review Information'; // Business/org review
    return '';
  };

  // Progress bar calculation
  // Step flow:
  // Individual: Step 0 (email) -> 0.5 (OTP) -> 1 (type) -> 2 (contact) -> 3 (preferences) -> 4 (review)
  // Business/Org: Step 0 (email) -> 0.5 (OTP) -> 1 (type) -> 2 (contact) -> 3 (address) -> 4 (preferences) -> 5 (review)
  const getTotalSteps = () => {
    if (!formData.clientType) return 2; // email + type
    if (formData.clientType === 'individual') return 4; // Shown as: Step 1 (email), Step 2 (type), Step 3 (contact), Step 4 (preferences/review combined display)
    return 5; // Shown as: Step 1 (email), Step 2 (type), Step 3 (contact), Step 4 (address), Step 5 (preferences/review combined display)
  };

  const getProgressStep = () => {
    if (currentStep === 0 || currentStep === 0.5) return 1; // Email step
    if (currentStep === 1) return 1; // Client type (shown as step 1)
    if (currentStep === 2) return 2; // Contact info (shown as step 2)
    if (currentStep === 3) return hasAddressStep ? 3 : 3; // Address (step 3 for business) or Preferences (step 3 for individual)
    if (currentStep === 4) return hasAddressStep ? 4 : 4; // Preferences (step 4 for business) or Review (step 4 for individual)
    if (currentStep === 5) return 5; // Review (business only)
    if (currentStep >= getReviewStep()) return getTotalSteps();
    return getTotalSteps();
  };

  if (currentStep === 7) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700 text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-slate-300 mb-6">
              Your details have been received. We'll review your information and contact you shortly.
            </p>
            <p className="text-sm text-slate-500">
              Redirecting you home in a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join Our Studio</h1>
          <p className="text-slate-400">
            {currentStep < 7
              ? `Step ${getProgressStep()} of ${getTotalSteps()} - ${getStepTitle()}`
              : 'Welcome!'}
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep < 7 && currentStep !== 0.5 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: getTotalSteps() }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full mx-1 transition-colors ${
                    i < getProgressStep()
                      ? 'bg-blue-500'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          {submitError && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400">Error</h3>
                <p className="text-red-300 text-sm">{submitError}</p>
              </div>
            </div>
          )}

          {/* Step 0: Email */}
          {currentStep === 0 && (
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>
            </form>
          )}

          {/* Step 0.5: OTP Verification */}
          {currentStep === 0.5 && otpState && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Verify Your Email</h3>
                <p className="text-slate-400 text-sm mb-6">
                  We've sent a 6-digit verification code to<br />
                  <strong>{otpState.email}</strong>
                </p>
              </div>

              {otpError && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-400">Verification Error</h3>
                    <p className="text-red-300 text-sm">{otpError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  Verification Code *
                </label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpInput(value);
                    if (otpError) setOtpError(null);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-2xl text-center font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-widest"
                />
              </div>

              <button
                onClick={handleResendOTP}
                disabled={otpLoading}
                className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          )}

          {/* Step 1: Client Type */}
          {currentStep === 1 && (
            <form className="space-y-4">
              <label className="block text-sm font-medium text-slate-200 mb-4">
                How would you like to work with us? *
              </label>
              <div className="space-y-3">
                {CLIENT_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.clientType === option.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="clientType"
                        value={option.value}
                        checked={formData.clientType === option.value}
                        onChange={handleInputChange}
                        className="w-4 h-4 mt-1 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">{option.label}</div>
                        <div className="text-sm text-slate-400 mt-1">{option.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.clientType && (
                <p className="mt-2 text-sm text-red-400">{errors.clientType}</p>
              )}
            </form>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <form className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 bg-slate-600 border border-slate-600 rounded-lg text-slate-300 placeholder-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Verified email - cannot be changed</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Smith"
                  className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Phone Number *
                </label>
                <div className="flex gap-2">
                  <select
                    name="phoneCountry"
                    value={formData.phoneCountry}
                    onChange={handleInputChange}
                    className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.prefix} {country.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="7911 123456"
                    className={`flex-1 px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-slate-600'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                )}
              </div>
            </form>
          )}

          {/* Step 3: Address (only for business/organization) */}
          {currentStep === 3 && hasAddressStep && (
            <form className="space-y-6">
              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Acme Corporation"
                  className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    errors.company ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-400">{errors.company}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="London"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* State and Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    State / Region
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="England"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="SW1A 1AA"
                    className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.zipCode ? 'border-red-500' : 'border-slate-600'
                    }`}
                  />
                  {errors.zipCode && (
                    <p className="mt-1 text-sm text-red-400">{errors.zipCode}</p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          )}

          {/* Step 3 or 4: Communication Preferences */}
          {((currentStep === 3 && !hasAddressStep) || (currentStep === 4 && hasAddressStep)) && (
            <div className="w-full">
            <form className="space-y-6">
              {/* How Did You Find Us */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  How did you find us? *
                </label>
                <div className="space-y-2">
                  {SOURCE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="source"
                        value={option.value}
                        checked={formData.source === option.value}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 text-slate-200">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.source && (
                  <p className="mt-2 text-sm text-red-400">{errors.source}</p>
                )}
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  Preferred contact method *
                </label>
                <div className="space-y-2">
                  {CONTACT_METHOD_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="preferredContactMethod"
                        value={option.value}
                        checked={formData.preferredContactMethod === option.value}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 text-slate-200">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.preferredContactMethod && (
                  <p className="mt-2 text-sm text-red-400">
                    {errors.preferredContactMethod}
                  </p>
                )}
              </div>
            </form>
            </div>
          )}

          {/* Step 5 or 6: Review */}
          {currentStep === getReviewStep() && (
            <div className="space-y-6">
              <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">
                    Client Type
                  </h3>
                  <p className="text-lg text-white">
                    {CLIENT_TYPE_OPTIONS.find((o) => o.value === formData.clientType)?.label}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">
                      Email
                    </h3>
                    <p className="text-white">{formData.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">
                      Name
                    </h3>
                    <p className="text-white">{formData.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">
                      Phone
                    </h3>
                    <p className="text-white">
                      {getCountryPrefix()} {formData.phone}
                    </p>
                  </div>
                </div>
                {formData.company && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">
                      Company
                    </h3>
                    <p className="text-white">{formData.company}</p>
                  </div>
                )}
                {formData.address && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">
                      Address
                    </h3>
                    <p className="text-white">
                      {formData.address}
                      {formData.city && `, ${formData.city}`}
                      {formData.state && `, ${formData.state}`}
                      {formData.zipCode && ` ${formData.zipCode}`}
                      {formData.country && `, ${getCountryName(formData.country)}`}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">
                      How you found us
                    </h3>
                    <p className="text-white capitalize">
                      {SOURCE_OPTIONS.find((o) => o.value === formData.source)
                        ?.label}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">
                      Preferred contact
                    </h3>
                    <p className="text-white capitalize">
                      {CONTACT_METHOD_OPTIONS.find(
                        (o) => o.value === formData.preferredContactMethod
                      )?.label}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 text-center">
                Please review your information above. Click "Submit" to complete your signup.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 7 && (
            <div className="mt-8 flex justify-between gap-4">
              <button
                onClick={currentStep === 0.5 ? handlePrevious : handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentStep === 0.5 ? (
                <button
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpInput.length !== 6}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {otpLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Email
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : currentStep === getReviewStep() ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Already have an account?{' '}
            <a href="/" className="text-blue-400 hover:text-blue-300">
              Back to home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
