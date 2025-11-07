/**
 * Integration Test Suite for Lead Capture Form Builder - Phase 4
 * Tests core functionality of the inquiry system
 */

// Use native fetch available in Node.js 18+

const API_BASE_URL = 'http://localhost:3002';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

// Utility function to make API calls
async function apiCall(
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>
) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    return {
      status: response.status,
      data: await response.json(),
      ok: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      data: null,
      ok: false,
      error: String(error),
    };
  }
}

// Test helper
async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({
      name,
      status: 'PASS',
      message: 'Test passed',
      duration,
    });
    console.log(`✅ PASS: ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({
      name,
      status: 'FAIL',
      message: String(error),
      duration,
    });
    console.log(`❌ FAIL: ${name} (${duration}ms)`);
    console.log(`   Error: ${error}`);
  }
}

// Test 1: Complete form submission
async function testCompleteFormSubmission() {
  const response = await apiCall('POST', '/inquiries/create', {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+44 123 456 7890',
    company: 'ABC Events',
    inquiryType: 'WEDDING',
    shootDate: new Date('2025-06-15'),
    shootDescription: 'Wedding photography for 200 guests with reception coverage',
    location: 'London, UK',
    specialRequirements: 'Aerial drone shots, same-day edit video',
    budgetMin: 2000,
    budgetMax: 5000,
    attachmentUrls: [],
    attachmentCount: 0,
    tags: ['wedding', 'high-value'],
  });

  if (!response.ok || response.status !== 201) {
    throw new Error(
      `Expected 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`
    );
  }

  if (!response.data.inquiryId) {
    throw new Error('No inquiryId in response');
  }

  // Store for later tests
  (global as any).testInquiryId = response.data.inquiryId;
}

// Test 2: Form validation - missing required fields
async function testFormValidationMissingFields() {
  const response = await apiCall('POST', '/inquiries/create', {
    fullName: '', // Empty
    email: 'test@example.com',
    phone: '+1234567890',
    inquiryType: 'PORTRAIT',
    shootDescription: 'Test',
  });

  if (response.status === 201) {
    throw new Error('Should reject empty fullName');
  }
}

// Test 3: Email validation
async function testFormValidationEmailFormat() {
  const response = await apiCall('POST', '/inquiries/create', {
    fullName: 'Test User',
    email: 'invalid-email-format', // Invalid
    phone: '+1234567890',
    inquiryType: 'PORTRAIT',
    shootDescription: 'Test description here',
  });

  if (response.status === 201) {
    throw new Error('Should reject invalid email format');
  }
}

// Test 4: Phone validation
async function testFormValidationPhoneRequired() {
  const response = await apiCall('POST', '/inquiries/create', {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '', // Empty
    inquiryType: 'PORTRAIT',
    shootDescription: 'Test description here',
  });

  if (response.status === 201) {
    throw new Error('Should reject missing phone');
  }
}

// Test 5: Description minimum length
async function testFormValidationDescriptionLength() {
  const response = await apiCall('POST', '/inquiries/create', {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    inquiryType: 'PORTRAIT',
    shootDescription: 'Too', // Less than 10 chars
  });

  if (response.status === 201) {
    throw new Error('Should reject description less than 10 characters');
  }
}

// Test 6: Verify created inquiry
async function testGetCreatedInquiry() {
  const inquiryId = (global as any).testInquiryId;
  if (!inquiryId) {
    throw new Error('No inquiry created in previous test');
  }

  // This would require authentication - for now just verify it exists
  // In a real test, you'd login first and get auth token
}

// Test 7: All inquiry types accepted
async function testAllInquiryTypes() {
  const types = [
    'WEDDING',
    'PORTRAIT',
    'COMMERCIAL',
    'EVENT',
    'FAMILY',
    'PRODUCT',
    'REAL_ESTATE',
    'HEADSHOT',
    'OTHER',
  ];

  for (const type of types) {
    const response = await apiCall('POST', '/inquiries/create', {
      fullName: `Test User ${type}`,
      email: `test.${type.toLowerCase()}@example.com`,
      phone: '+1234567890',
      inquiryType: type,
      shootDescription: `Test inquiry for ${type} photography`,
    });

    if (response.status !== 201) {
      throw new Error(`Failed to create inquiry for type ${type}`);
    }
  }
}

// Test 8: Budget ranges accepted
async function testBudgetRanges() {
  const budgetTests = [
    { min: null, max: 500 },
    { min: 500, max: 1000 },
    { min: 1000, max: 2000 },
    { min: 2000, max: 5000 },
    { min: 5000, max: null },
  ];

  for (const budget of budgetTests) {
    const response = await apiCall('POST', '/inquiries/create', {
      fullName: 'Budget Test User',
      email: `budget.${budget.min}-${budget.max}@example.com`,
      phone: '+1234567890',
      inquiryType: 'WEDDING',
      shootDescription: 'Test budget inquiry',
      budgetMin: budget.min,
      budgetMax: budget.max,
    });

    if (response.status !== 201) {
      throw new Error(
        `Failed to create inquiry with budget ${budget.min}-${budget.max}`
      );
    }
  }
}

// Test 9: Duplicate emails allowed
async function testDuplicateEmails() {
  const email = 'duplicate.test@example.com';

  // Submit first inquiry
  const response1 = await apiCall('POST', '/inquiries/create', {
    fullName: 'First User',
    email,
    phone: '+1111111111',
    inquiryType: 'WEDDING',
    shootDescription: 'First inquiry test description',
  });

  if (response1.status !== 201) {
    throw new Error('Failed to create first inquiry');
  }

  // Submit second inquiry with same email
  const response2 = await apiCall('POST', '/inquiries/create', {
    fullName: 'Second User',
    email,
    phone: '+2222222222',
    inquiryType: 'PORTRAIT',
    shootDescription: 'Second inquiry test description',
  });

  if (response2.status !== 201) {
    throw new Error('Should allow duplicate emails in inquiries');
  }
}

// Test 10: Health check
async function testHealthCheck() {
  const response = await fetch(`${API_BASE_URL}/healthz`);
  if (response.status !== 200) {
    throw new Error(`API health check failed: ${response.status}`);
  }
}

// Test 11: Readiness check
async function testReadinessCheck() {
  const response = await fetch(`${API_BASE_URL}/readyz`);
  if (response.status !== 200) {
    throw new Error(`API readiness check failed: ${response.status}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 Lead Capture Form Builder - Integration Tests');
  console.log('==============================================\n');

  console.log('📋 Running Tests...\n');

  // API connectivity
  await runTest('API Health Check', testHealthCheck);
  await runTest('API Readiness Check', testReadinessCheck);

  // Core functionality
  await runTest('Complete Form Submission', testCompleteFormSubmission);
  await runTest('All Inquiry Types Accepted', testAllInquiryTypes);
  await runTest('Budget Ranges Accepted', testBudgetRanges);
  await runTest('Duplicate Emails Allowed', testDuplicateEmails);

  // Form validation
  await runTest('Validation: Missing Full Name', testFormValidationMissingFields);
  await runTest('Validation: Invalid Email Format', testFormValidationEmailFormat);
  await runTest('Validation: Missing Phone', testFormValidationPhoneRequired);
  await runTest(
    'Validation: Description Too Short',
    testFormValidationDescriptionLength
  );

  // Summary
  console.log('\n==============================================');
  console.log('📊 Test Summary');
  console.log('==============================================\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Time: ${totalTime}ms\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
  }

  console.log('\n==============================================');
  console.log(passed === total ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('==============================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
