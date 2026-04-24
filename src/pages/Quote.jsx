import { useState } from 'react'
import SchemaMarkup from '../components/SchemaMarkup'
import { api, trackEvent } from '../api/client'
import { estimatePrice } from '../lib/pricing'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Property' },
  { id: 3, label: 'Contact' },
  { id: 4, label: 'Confirm' },
]

const SERVICES = [
  { value: 'paving',       label: '🛣 Asphalt Paving' },
  { value: 'sealcoating',  label: '🖤 Sealcoating' },
  { value: 'crackfill',    label: '🔧 Crack Filling' },
  { value: 'parking_lot',  label: '🏢 Parking Lot' },
  { value: 'driveway',     label: '🏠 Driveway' },
  { value: 'maintenance',  label: '🔄 Maintenance Plan' },
]

const URGENCIES = [
  { value: 'asap',          label: 'ASAP' },
  { value: 'within_1_week', label: 'Within 1 week' },
  { value: 'within_1_month',label: 'Within 1 month' },
  { value: 'flexible',      label: 'Flexible / Planning ahead' },
]

const INITIAL_FORM = {
  service_type: '',
  property_type: 'residential',
  project_size_sqft: '',
  urgency: 'flexible',
  address: '',
  name: '',
  email: '',
  phone: '',
  message: '',
}

// ── Helper components ────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step.id < current
                ? 'bg-green-500 text-white'
                : step.id === current
                ? 'bg-brand-amber text-brand-navy'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {step.id < current ? '✓' : step.id}
          </div>
          <span
            className={`text-xs hidden sm:block ${
              step.id === current ? 'font-semibold text-brand-navy' : 'text-gray-400'
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-px ${
                step.id < current ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-brand-navy mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-3 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors'

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Quote() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const handleChange = (e) => set(e.target.name, e.target.value)

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => s - 1)

  const handleSubmit = async () => {
    setStatus('submitting')
    try {
      const payload = {
        ...form,
        project_size_sqft: form.project_size_sqft
          ? parseFloat(form.project_size_sqft)
          : null,
      }
      const data = await api.submitQuote(payload)
      setResult(data)
      setStatus('success')
      trackEvent('quote_form_submit', {
        service: form.service_type,
        urgency: form.urgency,
        priority: data.lead_score,
      })
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
      trackEvent('quote_form_submit', { success: false })
    }
  }

  if (status === 'success') {
    return (
      <>
        <SchemaMarkup
          title="Request a Free Asphalt Estimate"
          description="Get a free no-obligation asphalt paving estimate from J. Worden & Sons. Multi-step quote form with instant response."
          canonical="/quote"
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 px-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display font-black text-3xl text-brand-navy mb-3">
              Quote Request Received!
            </h2>
            <p className="text-brand-navy/60 mb-6">
              Thanks, <strong>{form.name}</strong>! We&apos;ll reach out to{' '}
              <strong>{form.email}</strong> shortly.
            </p>
            {result && (
              <div
                className={`inline-block px-5 py-2 rounded-full text-sm font-bold mb-6 ${
                  result.lead_score === 'HOT'
                    ? 'bg-red-100 text-red-700'
                    : result.lead_score === 'WARM'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {result.follow_up_sla}
              </div>
            )}
            <a href="/" className="btn-primary">
              Back to Home
            </a>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SchemaMarkup
        title="Request a Free Asphalt Estimate"
        description="Get a free no-obligation asphalt paving estimate from J. Worden & Sons. Multi-step quote form — takes less than 2 minutes."
        canonical="/quote"
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Get a Quote', path: '/quote' },
        ]}
      />

      {/* Header */}
      <div className="bg-brand-navy pt-32 pb-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="font-display font-black text-4xl md:text-5xl mb-4">
            Get Your <span className="text-brand-amber">Free Quote</span>
          </h1>
          <p className="text-white/70">No obligation. We respond within 24 hours.</p>
        </div>
      </div>

      <section className="py-16 bg-gray-50 min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <StepIndicator current={step} />

            {/* Step 1 — Service */}
            {step === 1 && (
              <div>
                <h2 className="font-display font-bold text-2xl text-brand-navy mb-6">
                  What service do you need?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('service_type', value)}
                      className={`p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                        form.service_type === value
                          ? 'border-brand-amber bg-brand-amber/10 text-brand-navy'
                          : 'border-gray-200 hover:border-brand-amber/50 text-brand-navy/70'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={next}
                    disabled={!form.service_type}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Property Details →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Property */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-2xl text-brand-navy mb-6">
                  Tell us about the property
                </h2>

                <div>
                  <FieldLabel required>Property Type</FieldLabel>
                  <div className="flex gap-3">
                    {[
                      { value: 'residential', label: '🏠 Residential' },
                      { value: 'commercial',  label: '🏢 Commercial' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('property_type', value)}
                        className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          form.property_type === value
                            ? 'border-brand-amber bg-brand-amber/10 text-brand-navy'
                            : 'border-gray-200 text-brand-navy/60 hover:border-brand-amber/50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <FieldLabel>Approximate Project Size (sq ft)</FieldLabel>
                  <input
                    name="project_size_sqft"
                    type="number"
                    placeholder="e.g. 2000"
                    min="0"
                    value={form.project_size_sqft}
                    onChange={handleChange}
                    className={inputCls}
                  />
                  <p className="text-xs text-brand-navy/40 mt-1">
                    Don&apos;t know exactly? An estimate is fine.
                  </p>
                  {/* Live ballpark estimate */}
                  {(() => {
                    const est = estimatePrice(
                      form.service_type,
                      form.property_type,
                      form.project_size_sqft
                    )
                    if (!est) return null
                    return (
                      <div className="mt-3 bg-brand-amber/10 border border-brand-amber/30 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-amber mb-1">
                          Ballpark Estimate
                        </p>
                        <p className="font-display font-black text-brand-navy text-xl">
                          {est.lowFmt} – {est.highFmt}
                        </p>
                        <p className="text-xs text-brand-navy/50 mt-1 leading-relaxed">
                          {est.disclaimer}
                        </p>
                      </div>
                    )
                  })()}
                </div>

                <div>
                  <FieldLabel required>How soon do you need this done?</FieldLabel>
                  <select
                    name="urgency"
                    value={form.urgency}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    {URGENCIES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Project Address or General Area</FieldLabel>
                  <input
                    name="address"
                    type="text"
                    placeholder="123 Main St, City, ST"
                    value={form.address}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>

                <div className="flex justify-between mt-8">
                  <button type="button" onClick={back} className="btn-outline">
                    ← Back
                  </button>
                  <button type="button" onClick={next} className="btn-primary">
                    Next: Contact Info →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Contact */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-2xl text-brand-navy mb-6">
                  How do we reach you?
                </h2>

                {[
                  { name: 'name',  label: 'Full Name',     type: 'text',  required: true,  placeholder: 'John Smith' },
                  { name: 'email', label: 'Email Address', type: 'email', required: true,  placeholder: 'john@example.com' },
                  { name: 'phone', label: 'Phone Number',  type: 'tel',   required: true,  placeholder: '(555) 555-5555' },
                ].map(({ name, label, type, required, placeholder }) => (
                  <div key={name}>
                    <FieldLabel required={required}>{label}</FieldLabel>
                    <input
                      name={name}
                      type={type}
                      required={required}
                      placeholder={placeholder}
                      value={form[name]}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                ))}

                <div>
                  <FieldLabel>Additional Details (optional)</FieldLabel>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Describe your project, special requirements, or questions…"
                    value={form.message}
                    onChange={handleChange}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="flex justify-between mt-8">
                  <button type="button" onClick={back} className="btn-outline">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={!form.name || !form.email || !form.phone}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review &amp; Submit →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 — Confirm */}
            {step === 4 && (
              <div>
                <h2 className="font-display font-bold text-2xl text-brand-navy mb-6">
                  Review Your Request
                </h2>

                <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm mb-8">
                  {[
                    ['Service',       SERVICES.find((s) => s.value === form.service_type)?.label || form.service_type],
                    ['Property Type', form.property_type],
                    ['Size',          form.project_size_sqft ? `${form.project_size_sqft} sq ft` : 'Not specified'],
                    ['Urgency',       URGENCIES.find((u) => u.value === form.urgency)?.label],
                    ['Address',       form.address || 'Not specified'],
                    ['Name',          form.name],
                    ['Email',         form.email],
                    ['Phone',         form.phone],
                  ].map(([key, val]) => (
                    <div key={key} className="flex gap-3">
                      <span className="font-semibold text-brand-navy/50 w-28 flex-shrink-0">
                        {key}
                      </span>
                      <span className="text-brand-navy">{val}</span>
                    </div>
                  ))}
                </div>

                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
                    {errorMsg || 'Submission failed. Please try again.'}
                  </div>
                )}

                <div className="flex justify-between">
                  <button type="button" onClick={back} className="btn-outline">
                    ← Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === 'submitting'}
                    className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? 'Submitting…' : 'Submit Request ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
