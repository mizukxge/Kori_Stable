/**
 * Test Email Script for Amazon SES
 *
 * Usage:
 *   npx tsx src/scripts/test-email.ts
 *
 * This script tests the SES email sending functionality.
 * Make sure your .env file has AWS credentials set before running.
 */

import { sendEmail, sendContractEmail } from '../services/ses';

async function testBasicEmail() {
  console.log('\n📧 Test 1: Sending basic test email...\n');

  try {
    const result = await sendEmail({
      to: process.env.TEST_EMAIL || 'michael@shotbymizu.co.uk',
      subject: 'Test Email from Amazon SES',
      htmlBody: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Amazon SES Test Email</h2>
            <p>This is a test email sent from Mizu Studio's photography platform using Amazon SES.</p>

            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Service: Amazon SES</li>
              <li>Region: eu-west-2 (Ireland)</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
              <li>Sender: michael@shotbymizu.co.uk</li>
            </ul>

            <p>If you received this email successfully, your SES configuration is working correctly!</p>

            <p>Best regards,<br>Mizu Studio</p>
          </body>
        </html>
      `,
      textBody: `
This is a test email sent from Mizu Studio's photography platform using Amazon SES.

Service: Amazon SES
Region: eu-west-2 (Ireland)
Timestamp: ${new Date().toISOString()}
Sender: michael@shotbymizu.co.uk

If you received this email successfully, your SES configuration is working correctly!

Best regards,
Mizu Studio
      `,
    });

    console.log('✅ Basic email test PASSED');
    console.log(`   Message ID: ${result.MessageId}\n`);
    return true;
  } catch (error) {
    console.error('❌ Basic email test FAILED');
    console.error(`   Error: ${error}\n`);
    return false;
  }
}

async function testContractEmail() {
  console.log('📧 Test 2: Sending contract email...\n');

  try {
    const result = await sendContractEmail(
      process.env.TEST_EMAIL || 'michael@shotbymizu.co.uk',
      'test-contract-123',
      'John Smith'
    );

    console.log('✅ Contract email test PASSED');
    console.log(`   Message ID: ${result.MessageId}\n`);
    return true;
  } catch (error) {
    console.error('❌ Contract email test FAILED');
    console.error(`   Error: ${error}\n`);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 Amazon SES Email Testing Suite');
  console.log('='.repeat(60));

  // Check environment variables
  console.log('\n🔍 Checking configuration...\n');

  const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'SENDER_EMAIL',
  ];

  let configValid = true;
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      const masked = envVar.includes('SECRET') ? '***' : value;
      console.log(`✅ ${envVar}: ${masked}`);
    } else {
      console.log(`❌ ${envVar}: NOT SET`);
      configValid = false;
    }
  }

  if (!configValid) {
    console.log('\n⚠️  Missing required environment variables!');
    console.log('Please set the following in your .env file:');
    console.log('  - AWS_REGION');
    console.log('  - AWS_ACCESS_KEY_ID');
    console.log('  - AWS_SECRET_ACCESS_KEY');
    console.log('  - SENDER_EMAIL');
    console.log('  - PUBLIC_URL (optional, defaults to https://shotbymizu.co.uk)');
    console.log('  - TEST_EMAIL (optional, defaults to michael@shotbymizu.co.uk)\n');
    process.exit(1);
  }

  console.log('\n✅ Configuration is valid\n');

  // Run tests
  let passedTests = 0;
  let totalTests = 2;

  if (await testBasicEmail()) {
    passedTests++;
  }

  if (await testContractEmail()) {
    passedTests++;
  }

  // Summary
  console.log('='.repeat(60));
  console.log(`✅ Tests Complete: ${passedTests}/${totalTests} passed`);
  console.log('='.repeat(60));

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your SES configuration is working correctly.\n');
    console.log('Next steps:');
    console.log('  1. Check your inbox for the test emails');
    console.log('  2. Verify the emails arrived in your inbox (not spam folder)');
    console.log('  3. Open one email and check the headers for SPF=pass and DKIM=pass');
    console.log('  4. You can now integrate email sending into your application\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check:');
    console.log('  1. AWS credentials are correct');
    console.log('  2. AWS region is set to eu-west-2');
    console.log('  3. Domain is verified in AWS SES (shotbymizu.co.uk)');
    console.log('  4. DKIM tokens are verified');
    console.log('  5. You have production access (or TEST_EMAIL is verified for sandbox)\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 Fatal error:\n', error);
  process.exit(1);
});
