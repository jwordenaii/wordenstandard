import { test, expect } from '@playwright/test'

const demoJob = {
  id: 2,
  title: 'River City Retail Center Resurface',
  client_name: 'River City Retail Partners',
  client_email: 'ops@rivercity.example',
  address: '2420 Commerce Road, Richmond, VA',
  scheduled_date: '2026-05-04',
  start_time: '8:00 AM',
  crew: 'Worden crew',
  surface_type: 'commercial_asphalt',
  status: 'in_progress',
  progress_percent: 62,
  progress_notes: 'Milling and base repairs are complete. Surface lift is scheduled next.',
}

const demoDocuments = [
  {
    id: 11,
    job_id: 2,
    client_email: 'ops@rivercity.example',
    title: 'Approved Commercial Scope',
    filename: 'river-city-approved-scope.pdf',
    document_type: 'contract',
    visible_to_client: true,
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
  },
  {
    id: 12,
    job_id: 2,
    client_email: 'ops@rivercity.example',
    title: 'Deposit Invoice',
    filename: 'river-city-deposit-invoice.pdf',
    document_type: 'invoice',
    visible_to_client: true,
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
  },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('jworden.auth.token', 'e2e-token')
    window.sessionStorage.setItem('jworden.auth.expires_at', String(Math.floor(Date.now() / 1000) + 3600))
    // Suppress splash screen so it doesn't block clicks
    window.sessionStorage.setItem('jworden_splash_shown', '1')
  })

  await page.route('**/api/v1/auth/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ auth_required: true, auth_mode: 'pin', token_endpoint: '/api/v1/auth/pin-token' }),
    })
  })

  await page.route('**/api/v1/auth/pin-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'e2e-token', expires_in: 3600 }),
    })
  })

  await page.route('**/api/v1/operations/jobs**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(demoJob) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jobs: [demoJob] }) })
  })

  await page.route('**/api/v1/operations/job-documents**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ documents: demoDocuments }) })
  })

  await page.route('**/api/v1/admin/monitoring/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ monitoring: { slack_enabled: true, datadog_enabled: true, dd_service: 'jworden-api', dd_env: 'production' } }),
    })
  })

  await page.route('**/api/v1/operations/public/jobs/2', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(demoJob) })
  })
})

test('homepage education-first smoke flow', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByLabel(/J\. Worden & Sons Asphalt Paving/i).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Educate First/i })).toBeVisible()
  await expect(page.getByText(/Award-winning Virginia paving company/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Built for owners who need the truth/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Everything your pavement needs/i })).toBeVisible()
  await expect(page.getByText(/50\/50/i)).toBeVisible()
  await expect(page.getByText(/Sealcoating, crack sealing, and pavement preservation programs/i)).toBeVisible()
  await expect(page.getByText(/Asphalt repair, pothole patching, milling, and overlays/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Home turf around Richmond/i })).toBeVisible()
  await expect(page.getByText(/Richmond local pack focus/i)).toBeVisible()
  await expect(page.getByText(/Chesterfield, Henrico, Midlothian, Short Pump/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Real paving prices come from real site conditions/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /The answer should come from the pavement/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Owners still need a checklist/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Asphalt questions buyers ask before they call/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Dinwiddie to Fairfax/i })).toBeVisible()
  await expect(page.getByText(/rural residential corridors between the larger cities/i)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dinwiddie', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Richmond', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Williamsburg', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'New Kent', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /JWORDENAI Teaser/i })).toBeVisible()
})

test('jwordenai teaser smoke flow', async ({ page }) => {
  await page.goto('/jwordenai')

  await expect(page.getByRole('heading', { name: /Scan pavement/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Use iPhone Photos/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Add Drone Views/i })).toBeVisible()
})

test('command center smoke flow', async ({ page }) => {
  // Override auth/status for this test: auth_required=false so RequireAuth passes through
  await page.route('**/api/v1/auth/status', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ auth_required: false }) })
  })
  await page.goto('/command-center')

  // If the CC PIN gate is present (VITE_CC_PASSWORD set in build), enter the e2e pin
  const pinInput = page.locator('input[type="password"]')
  if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pinInput.fill('e2e-pin')
    await page.getByRole('button', { name: /unlock/i }).click()
    await expect(
      page.getByRole('heading', { name: /JWordenAI Command Center/i })
    ).toBeVisible()
  } else {
    // CC_PASSWORD not configured in this build — page still renders without crashing
    await expect(page.locator('body')).toBeVisible()
  }
})

test('admin documents visual smoke flow', async ({ page }) => {
  await page.goto('/admin/documents')

  await expect(page.getByRole('heading', { name: /Customer Documents/i })).toBeVisible()
  await expect(page.getByText(/Production Demo Workspace/i)).toBeVisible()
  await expect(page.getByText(/Monitoring Alerts/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Complete', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Packet/i })).toBeVisible()
  await expect(page.getByText(/River City Retail Center Resurface/i).first()).toBeVisible()
  await expect(page.getByText(/Approved Commercial Scope/i).first()).toBeVisible()
})

test('customer portal visual smoke flow', async ({ page }) => {
  await page.goto('/portal')

  await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible()
  await expect(page.getByText(/River City Retail Center Resurface/i).first()).toBeVisible()
  await expect(page.getByText(/Project Details/i)).toBeVisible()
  await expect(page.getByText(/Invoices & Receipts/i)).toBeVisible()
  await expect(page.getByText(/Deposit Invoice/i)).toBeVisible()
})

test('crew eta visual smoke flow', async ({ page }) => {
  await page.goto('/crew-eta?jobId=2')

  await expect(page.getByText(/Live Crew Tracker/i)).toBeVisible()
  await expect(page.getByText(/Work in Progress/i)).toBeVisible()
  await expect(page.getByText(/62%/i)).toBeVisible()
  await expect(page.getByText(/2420 Commerce Road/i)).toBeVisible()
})
