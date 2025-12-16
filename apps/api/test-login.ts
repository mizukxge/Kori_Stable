import { AuthService } from './src/services/auth.js';

async function testLogin() {
  try {
    console.log('Testing login with credentials...\n');
    console.log('Email: michael@shotbymizu.co.uk');
    console.log('Password: #Admin:123\n');

    const result = await AuthService.login({
      email: 'michael@shotbymizu.co.uk',
      password: '#Admin:123'
    });

    if (result) {
      console.log('✅ Login successful!');
      console.log('User data:', result);
    } else {
      console.log('❌ Login failed - returned null');
      console.log('\nTrying other test users:');

      const testUsers = [
        { email: 'admin@kori.dev', password: 'password' },
        { email: 'manager@kori.dev', password: 'password' },
        { email: 'user@kori.dev', password: 'password' },
      ];

      for (const user of testUsers) {
        console.log(`\nTesting ${user.email}...`);
        const result = await AuthService.login(user);
        console.log(result ? '✅ Success' : '❌ Failed');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();
