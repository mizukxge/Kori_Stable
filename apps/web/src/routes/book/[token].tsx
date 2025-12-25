import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Calendar, Clock, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface BookingStep {
  step: number;
  title: string;
}

const STEPS: BookingStep[] = [
  { step: 1, title: 'Select Date' },
  { step: 2, title: 'Select Time' },
  { step: 3, title: 'Your Details' },
  { step: 4, title: 'Confirm' },
];

export default function BookAppointmentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<any[]>([]);

  // Form data
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
    recordingConsentGiven: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch appointment and available dates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          setError('Invalid booking link');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/book/${token}`);

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || 'Failed to load booking info');
          return;
        }

        const result = await response.json();
        setAppointmentData(result.data);
        setAvailableDates(result.data.availableDates || []);
      } catch (err) {
        console.error('Error fetching booking data:', err);
        setError('Failed to load booking information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Fetch available times when date is selected
  useEffect(() => {
    if (!selectedDate || !token) return;

    const fetchTimes = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/book/${token}/available-times?date=${selectedDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to load available times');
        }

        const result = await response.json();
        setAvailableTimes(result.data.availableTimes || []);
        setSelectedTime(null);
      } catch (err) {
        console.error('Error fetching times:', err);
        setError('Failed to load available times');
      }
    };

    fetchTimes();
  }, [selectedDate, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const canProceedToStep2 = selectedDate !== null;
  const canProceedToStep3 = selectedDate !== null && selectedTime !== null;
  const canProceedToStep4 = formData.name && formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const handleSubmit = async () => {
    if (!selectedTime || !token) return;

    setSubmitting(true);
    setError(null);

    try {
      // Find the selected time slot to get the startDate
      const timeSlot = availableTimes.find((t) => t.startTime === selectedTime);
      if (!timeSlot) {
        setError('Invalid time selection');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/book/${token}?startTime=${timeSlot.startDate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to book appointment');
        return;
      }

      const result = await response.json();
      setCurrentStep(5); // Success state
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to complete booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className="text-slate-300">Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (error && currentStep < 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Booking Link Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact the studio at <strong>michael@shotbymizu.co.uk</strong> to schedule your appointment.
            </p>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div>
              <p className="text-muted-foreground mb-2">Your appointment has been confirmed.</p>
              <p className="text-sm text-muted-foreground">
                Check your email for details and the Teams meeting link.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">What's Next?</p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>✓ Check your email for confirmation</li>
                <li>✓ Click the Teams link at call time</li>
                <li>✓ Prepare your questions for the call</li>
              </ul>
            </div>

            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Book a Call</h1>
          <p className="text-slate-400">with Mizu Studio</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={`flex-1 ${s.step < STEPS.length ? 'mr-4' : ''}`}
            >
              <div
                className={`h-2 rounded-full transition-colors ${
                  currentStep >= s.step ? 'bg-blue-500' : 'bg-slate-700'
                }`}
              />
              <p className="text-xs text-slate-400 mt-2 text-center">{s.title}</p>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Select Your Preferred Date'}
              {currentStep === 2 && 'Select Your Preferred Time'}
              {currentStep === 3 && 'Tell Us About You'}
              {currentStep === 4 && 'Confirm Your Booking'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Choose a date within the next 14 days (Monday-Saturday)'}
              {currentStep === 2 && `Times available on ${selectedDate}`}
              {currentStep === 3 && 'Help us personalize your experience'}
              {currentStep === 4 && 'Review your appointment details'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Date Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.map((date) => {
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                    const dayNum = dateObj.toLocaleDateString('en-GB', { day: '2-digit' });

                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg text-center transition-colors ${
                          selectedDate === date
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <div className="text-xs font-medium">{dayName}</div>
                        <div className="text-lg font-bold">{dayNum}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Time Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {availableTimes.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => setSelectedTime(slot.startTime)}
                      className={`p-3 rounded-lg text-center transition-colors ${
                        selectedTime === slot.startTime
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-sm font-medium">{slot.startTime}</div>
                      <div className="text-xs text-slate-400">GMT</div>
                    </button>
                  ))}
                </div>
                {availableTimes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No times available for this date</p>
                )}
              </div>
            )}

            {/* Step 3: Client Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">
                    Full Name *
                  </Label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jane Smith"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full mt-2 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-300">
                    Email Address *
                  </Label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full mt-2 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-slate-300">
                    Notes (Optional)
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Tell us about your project, style preferences, or any questions..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full mt-2 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="recordingConsent"
                    name="recordingConsentGiven"
                    type="checkbox"
                    checked={formData.recordingConsentGiven}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                  />
                  <Label htmlFor="recordingConsent" className="text-sm text-slate-400 cursor-pointer">
                    I consent to recording this call for quality purposes
                  </Label>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-600">
                    <span className="text-slate-400">Appointment Type</span>
                    <span className="font-medium">{appointmentData?.type}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-600">
                    <span className="text-slate-400">Date & Time</span>
                    <span className="font-medium">
                      {selectedDate} at {selectedTime} GMT
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-600">
                    <span className="text-slate-400">Duration</span>
                    <span className="font-medium">60 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Your Name</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                </div>

                <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 text-sm text-blue-200">
                  <p className="mb-2">✓ A Teams meeting link will be sent to your email</p>
                  <p>✓ We'll send reminders before your call</p>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1 || submitting}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep < 4 && (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep3) ||
                    (currentStep === 3 && !canProceedToStep4)
                  }
                  className="flex items-center gap-2 flex-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>Questions? Email us at <strong>michael@shotbymizu.co.uk</strong></p>
        </div>
      </div>
    </div>
  );
}
