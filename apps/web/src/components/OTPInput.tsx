import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  onChange?: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OTPInput({
  length = 6,
  onComplete,
  onChange,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange?.(otpString);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete if all digits filled
    if (otpString.length === length && !otpString.includes('')) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      }
      e.preventDefault();
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();

    // Only process if pasted data contains only digits
    if (!/^\d+$/.test(pastedData)) return;

    const pastedDigits = pastedData.slice(0, length).split('');
    const newOtp = [...otp];

    pastedDigits.forEach((digit, idx) => {
      if (idx < length) {
        newOtp[idx] = digit;
      }
    });

    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange?.(otpString);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    // Call onComplete if filled
    if (otpString.length === length && !otpString.includes('')) {
      onComplete?.(otpString);
    }
  };

  const handleFocus = (index: number) => {
    // Select the content when focused
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`
            w-12 h-14 text-center text-2xl font-semibold
            border-2 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-ring
            disabled:bg-muted disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-input'}
            ${!disabled && !error ? 'hover:border-gray-400' : ''}
          `}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
