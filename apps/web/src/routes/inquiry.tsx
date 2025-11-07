import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  CheckCircle,
  Camera,
  Calendar,
  MapPin,
  DollarSign,
} from 'lucide-react';

const INQUIRY_TYPES = [
  { value: 'WEDDING', label: 'Wedding', icon: '💒' },
  { value: 'PORTRAIT', label: 'Portrait', icon: '👤' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: '🏢' },
  { value: 'EVENT', label: 'Event', icon: '🎉' },
  { value: 'FAMILY', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'PRODUCT', label: 'Product', icon: '📦' },
  { value: 'REAL_ESTATE', label: 'Real Estate', icon: '🏠' },
  { value: 'HEADSHOT', label: 'Headshot', icon: '📸' },
  { value: 'OTHER', label: 'Other', icon: '❓' },
];

const BUDGET_RANGES = [
  { value: '0-500', label: 'Under £500' },
  { value: '500-1000', label: '£500 - £1,000' },
  { value: '1000-2500', label: '£1,000 - £2,500' },
  { value: '2500-5000', label: '£2,500 - £5,000' },
  { value: '5000+', label: '£5,000+' },
];

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  inquiryType: string;
  shootDate: string;
  shootDescription: string;
  location: string;
  specialRequirements: string;
  budgetMin: string;
  budgetMax: string;
  attachmentUrls: string[];
}

interface FormErrors {
  [key: string]: string;
}

const DRAFT_STORAGE_KEY = 'inquiry-form-draft';

export default function InquiryPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    inquiryType: '',
    shootDate: '',
    shootDescription: '',
    location: '',
    specialRequirements: '',
    budgetMin: '',
    budgetMax: '',
    attachmentUrls: [],
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = 'Invalid email address';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    }

    if (currentStep === 2) {
      if (!formData.inquiryType) newErrors.inquiryType = 'Inquiry type is required';
      const description = formData.shootDescription?.trim() || '';
      if (!description) {
        newErrors.shootDescription = 'Description is required';
      } else if (description.length < 10) {
        newErrors.shootDescription = 'Description must be at least 10 characters';
      }
    }

    if (currentStep === 3) {
      if (!formData.budgetMin && !formData.budgetMax) {
        newErrors.budget = 'Please select a budget range';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((file) => {
      const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
      const isSmall = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage) {
        alert(`${file.name} is not a supported image format (JPG, PNG, GIF only)`);
        return false;
      }
      if (!isSmall) {
        alert(`${file.name} exceeds 10MB size limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length + formData.attachmentUrls.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    for (const file of validFiles) {
      setUploadingFiles((prev) => [...prev, file.name]);

      try {
        // Create a temporary URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const url = e.target.result as string;
            updateField('attachmentUrls', [...formData.attachmentUrls, url]);
            setUploadingFiles((prev) => prev.filter((f) => f !== file.name));
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload file:', error);
        setUploadingFiles((prev) => prev.filter((f) => f !== file.name));
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    updateField(
      'attachmentUrls',
      formData.attachmentUrls.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      // Convert shootDate to ISO datetime if it exists
      let shootDateISO = null;
      if (formData.shootDate) {
        const date = new Date(formData.shootDate);
        if (!isNaN(date.getTime())) {
          shootDateISO = date.toISOString();
        }
      }

      const response = await fetch('http://localhost:3002/inquiries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          company: formData.company?.trim() || null,
          inquiryType: formData.inquiryType,
          shootDate: shootDateISO,
          shootDescription: formData.shootDescription.trim(),
          location: formData.location?.trim() || null,
          specialRequirements: formData.specialRequirements?.trim() || null,
          budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
          source: 'website',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit inquiry');
      }

      const data = await response.json();
      console.log('✅ Inquiry submitted:', data);

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Show success
      setSubmitted(true);
    } catch (error) {
      console.error('❌ Failed to submit inquiry:', error);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your inquiry has been received. We'll review it and get back to you within 24 hours.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Check your email for a confirmation message.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Let's Plan Your Shoot</h1>
          <p className="text-muted-foreground">Tell us about your photography needs</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s === step
                      ? 'bg-blue-600 text-white scale-110'
                      : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      s < step ? 'bg-green-500' : 'bg-muted'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Contact Info</span>
            <span>Shoot Details</span>
            <span>Budget</span>
            <span>Review</span>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Contact Information'}
              {step === 2 && 'Shoot Details'}
              {step === 3 && 'Budget & Attachments'}
              {step === 4 && 'Review Your Information'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'How can we reach you?'}
              {step === 2 && "Tell us about your photography needs"}
              {step === 3 && 'What are your budget and needs?'}
              {step === 4 && 'Please review your information before submitting'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Contact Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    Full Name *
                  </Label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="John Smith"
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    Email Address *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    Phone Number *
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+44 123 456 7890"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-destructive text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    Company (Optional)
                  </Label>
                  <Input
                    type="text"
                    value={formData.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    placeholder="Your company name"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Shoot Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-3">
                    Type of Photography *
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {INQUIRY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => updateField('inquiryType', type.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          formData.inquiryType === type.value
                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-slate-700'
                            : 'border-border dark:border-slate-600 hover:border-input dark:hover:border-slate-500'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                  {errors.inquiryType && (
                    <p className="text-destructive text-sm mt-2">{errors.inquiryType}</p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    When are you planning to shoot? (Optional)
                  </Label>
                  <Input
                    type="date"
                    value={formData.shootDate}
                    onChange={(e) => updateField('shootDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    Tell us about your shoot *
                  </Label>
                  <textarea
                    value={formData.shootDescription}
                    onChange={(e) => updateField('shootDescription', e.target.value)}
                    placeholder="Describe what you're looking for in detail..."
                    className="w-full px-3 py-2 border border-input dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-slate-500"
                    rows={4}
                  />
                  {errors.shootDescription && (
                    <p className="text-destructive text-sm mt-1">{errors.shootDescription}</p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    Location (Optional)
                  </Label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="London, UK"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-1">
                    Special Requirements (Optional)
                  </Label>
                  <textarea
                    value={formData.specialRequirements}
                    onChange={(e) => updateField('specialRequirements', e.target.value)}
                    placeholder="e.g., drone photography, studio setup, outdoor location, etc."
                    className="w-full px-3 py-2 border border-input dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-slate-500"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Budget & Attachments */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-3">
                    Budget Range (Optional)
                  </Label>
                  <div className="space-y-2">
                    {BUDGET_RANGES.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          const [min, max] = range.value.split('-');
                          updateField('budgetMin', min === '0' ? '' : min);
                          updateField('budgetMax', max === '+' ? '' : max);
                        }}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          (formData.budgetMin || formData.budgetMax) &&
                          (range.value === `${formData.budgetMin}-${formData.budgetMax}` ||
                            range.value === `${formData.budgetMin}-+`)
                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-slate-700'
                            : 'border-border dark:border-slate-600 hover:border-input dark:hover:border-slate-500'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  {errors.budget && (
                    <p className="text-destructive text-sm mt-2">{errors.budget}</p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-3">
                    Upload Reference Images (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload portfolio examples or inspiration images (max 5 files, 10MB each)
                  </p>

                  {/* File Upload Area */}
                  <div
                    className="border-2 border-dashed border-input dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#2563eb';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files);
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/gif"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-foreground font-medium">
                        Drag files here or click to browse
                      </p>
                      <p className="text-muted-foreground text-sm">JPG, PNG, or GIF (up to 10MB)</p>
                    </label>
                  </div>

                  {/* File List */}
                  {formData.attachmentUrls.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.attachmentUrls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <span className="text-sm text-foreground truncate">
                              Image {index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-destructive hover:text-red-800"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadingFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadingFiles.map((file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between p-3 bg-blue-50 dark:bg-slate-700 rounded-lg"
                        >
                          <span className="text-sm text-foreground">{file}</span>
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-background rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{formData.company || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{formData.inquiryType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Shoot Date</p>
                      <p className="font-medium">
                        {formData.shootDate
                          ? new Date(formData.shootDate).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{formData.location || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">
                        {formData.budgetMin || formData.budgetMax
                          ? `£${formData.budgetMin || 0} - £${formData.budgetMax || '∞'}`
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="font-medium whitespace-pre-wrap">
                      {formData.shootDescription}
                    </p>
                  </div>

                  {formData.specialRequirements && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Special Requirements</p>
                      <p className="font-medium whitespace-pre-wrap">
                        {formData.specialRequirements}
                      </p>
                    </div>
                  )}

                  {formData.attachmentUrls.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                      <div className="grid grid-cols-4 gap-2">
                        {formData.attachmentUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 rounded object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1 w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    I want to receive a quote for my project
                  </span>
                </label>
              </div>
            )}
          </CardContent>

          {/* Footer with Navigation */}
          <div className="border-t border-border px-6 py-4 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1}
            >
              <ChevronLeft size={18} className="mr-2" />
              Previous
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight size={18} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Submitting...' : 'Submit Inquiry'}
                <CheckCircle size={18} className="ml-2" />
              </Button>
            )}
          </div>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Your information is safe and secure. We'll never share your details with anyone.</p>
        </div>
      </div>
    </div>
  );
}
