const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  async function login(email) {
    await page.goto('http://localhost:5173/login');
    await page.locator('input[type=email]').fill(email);
    await page.locator('input[type=password]').fill('Campus@123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(800);
  }

  await page.goto('http://localhost:5173/');
  await page.getByText('Every campus issue').waitFor();

  await login('student@campus.edu');
  await page.waitForURL(/\/student$/);
  await page.getByRole('heading', { name: /Welcome back/ }).waitFor();

  await page.getByRole('link', { name: 'Submit complaint' }).first().click();
  await page.locator('input[placeholder="Brief summary of the issue"]').fill('Browser verification complaint');
  await page.locator('textarea').fill('Browser automation verified complaint submission.');
  await page.locator('select').nth(0).selectOption({ label: 'Cleanliness and sanitation' });
  await page.locator('select').nth(1).selectOption({ label: 'Medium' });
  await page.locator('input[placeholder="e.g. Engineering Hostel"]').fill('Browser Test Hall');
  await page.locator('input[placeholder="e.g. Block B"]').fill('Test Block');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('button', { hasText: 'Submit complaint' }).click();
  await page.waitForURL(/\/student\/complaints\/[a-z0-9]+$/);
  await page.getByText('Browser verification complaint').waitFor();

  await page.goto('http://localhost:5173/student/notifications');
  await page.getByRole('heading', { name: 'Notifications', level: 1 }).waitFor();

  await page.evaluate(() => localStorage.clear());
  await login('admin@campus.edu');
  await page.waitForURL(/\/admin$/);
  await page.getByText('Command center').waitFor();
  await page.goto('http://localhost:5173/admin/complaints');
  await page.getByRole('heading', { name: 'All complaints', level: 1 }).waitFor();

  await page.evaluate(() => localStorage.clear());
  await login('maintenance@campus.edu');
  await page.waitForURL(/\/maintenance$/);
  await page.getByText('My work overview').waitFor();

  await page.evaluate(() => localStorage.clear());
  await login('management@campus.edu');
  await page.waitForURL(/\/management$/);
  await page.getByText('Campus performance').waitFor();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('http://localhost:5173/login');
  await mobile.getByRole('heading', { name: 'Welcome back' }).waitFor();

  await page.goto('http://localhost:5173/forgot-password');
  await page.getByRole('heading', { name: 'Reset password', level: 1 }).waitFor();

  console.log(JSON.stringify({
    landing: 'passed',
    studentSubmission: 'passed',
    studentNotifications: 'passed',
    adminDashboardAndComplaints: 'passed',
    maintenanceDashboard: 'passed',
    managementDashboard: 'passed',
    mobileLogin: 'passed',
    forgotPasswordPage: 'passed',
    browserErrors: errors
  }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
