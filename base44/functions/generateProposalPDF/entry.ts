import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * Generate a branded asphalt paving proposal PDF for a given Lead.
 * - Uses Claude Sonnet to draft the executive summary, scope, and spec narrative.
 * - Builds a 2-page branded PDF with jsPDF.
 * - Uploads the PDF and emails it to the lead (and owner, cc'd).
 * - Updates the Lead status to "quoted".
 *
 * Payload: { lead_id: string }
 */

const AMBER = [255, 191, 0];
const DARK = [20, 20, 20];
const GRAY = [90, 90, 90];

// Pricing baselines (match agent config)
const RATES = {
  driveway: { perSqft: 6.5, label: 'Type II Fine Residential' },
  walkway: { perSqft: 8.0, label: 'Type II Fine Residential' },
  patio: { perSqft: 8.0, label: 'Type II Fine Residential' },
  parking_lot: { perSqft: 5.0, label: 'Type I Heavy Commercial' },
  commercial: { perSqft: 5.0, label: 'Type I Heavy Commercial' },
  industrial: { perSqft: 7.0, label: 'Superpave Industrial' },
};

const narrativeSchema = {
  type: 'object',
  properties: {
    executive_summary: { type: 'string', description: '3-4 sentence executive summary of the recommended scope' },
    scope_bullets: { type: 'array', items: { type: 'string' }, description: '5-7 specific scope line items (base prep, surface course, drainage, striping, etc.)' },
    technical_spec: { type: 'string', description: 'One paragraph explaining the engineered spec (binder grade, base depth, geotextile) and why it matches this property' },
    warranty_note: { type: 'string', description: 'One sentence on the 5-year workmanship warranty' },
  },
  required: ['executive_summary', 'scope_bullets', 'technical_spec', 'warranty_note'],
};

const estimateJob = (lead) => {
  const surfaceKey = (lead.surface_type || 'driveway').toLowerCase();
  const rate = RATES[surfaceKey] || RATES.driveway;
  const sqft = Number(lead.sqft) || (surfaceKey === 'parking_lot' ? 8000 : surfaceKey === 'industrial' ? 15000 : 800);
  const subtotal = Math.round(sqft * rate.perSqft);
  // Range ±12%
  const low = Math.round(subtotal * 0.92);
  const high = Math.round(subtotal * 1.12);
  return { sqft, rate, subtotal, low, high };
};

const buildNarrative = async (base44, lead, estimate) => {
  const prompt = `You are the senior estimator for J. Worden & Sons Asphalt Paving (Chester, VA — family-owned 40+ years).
Draft proposal copy for a real client. Be specific, technical, and confidence-inspiring. Never hype.

CLIENT:
- Name: ${lead.name}
- Address: ${lead.address || 'Not provided'}
- Surface Type: ${lead.surface_type || 'driveway'}
- Square Footage: ${estimate.sqft.toLocaleString()} sq ft
- Material Grade: ${estimate.rate.label}
- Timeline: ${lead.urgency || 'standard'}
- Customer Notes: ${lead.notes || 'none'}

WRITE:
1. executive_summary — 3-4 sentences. Reference their specific surface, area, and location. Mention family ownership and the engineered spec being appropriate for their conditions.
2. scope_bullets — 5-7 concrete line items (mill existing, subgrade prep, geotextile, aggregate base, binder course, surface course, striping/sealing). Be specific with depths and materials.
3. technical_spec — one paragraph explaining the binder grade (PG 64-22 inland / PG 70-22 commercial / PG 76-22 coastal / PG 70-28 freeze-thaw markets), base depth, and why it matches their property's soil and climate.
4. warranty_note — one sentence on the 5-year workmanship warranty and 3-year sealcoat schedule.

Return valid JSON matching the schema.`;

  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: narrativeSchema,
    model: 'claude_sonnet_4_6',
  });
};

const buildPdf = (lead, estimate, narrative) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48; // margin

  // ───── HEADER BAND
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 90, 'F');
  doc.setFillColor(...AMBER);
  doc.rect(0, 90, W, 4, 'F');

  // Logo block
  doc.setFillColor(...AMBER);
  doc.rect(M, 28, 44, 44, 'F');
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('JW', M + 22, 56, { align: 'center' });

  // Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('J. WORDEN & SONS', M + 60, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...AMBER);
  doc.text('ASPHALT PAVING  ·  EST. 1984  ·  CHESTER, VA', M + 60, 68);

  // Proposal meta (right)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PROPOSAL', W - M, 50, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(today, W - M, 66, { align: 'right' });

  // ───── CLIENT BLOCK
  let y = 130;
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PREPARED FOR', M, y);
  doc.setTextColor(...DARK);
  doc.setFontSize(14);
  y += 16;
  doc.text(lead.name || 'Client', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  y += 14;
  if (lead.address) { doc.text(lead.address, M, y); y += 13; }
  if (lead.phone) { doc.text(lead.phone, M, y); y += 13; }
  if (lead.email) { doc.text(lead.email, M, y); y += 13; }

  // ───── EXECUTIVE SUMMARY
  y = Math.max(y, 210);
  y += 10;
  doc.setTextColor(...AMBER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('//  EXECUTIVE SUMMARY', M, y);
  y += 18;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(narrative.executive_summary || '', W - M * 2);
  doc.text(summaryLines, M, y);
  y += summaryLines.length * 14 + 12;

  // ───── PROJECT DETAILS TABLE
  doc.setTextColor(...AMBER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('//  PROJECT DETAILS', M, y);
  y += 14;

  const rows = [
    ['Surface Type', (lead.surface_type || 'driveway').replace(/_/g, ' ').toUpperCase()],
    ['Estimated Area', `${estimate.sqft.toLocaleString()} sq ft`],
    ['Material Grade', estimate.rate.label],
    ['Timeline', (lead.urgency || 'standard').toUpperCase()],
    ['Proposal Valid', '30 days from issue'],
  ];

  doc.setDrawColor(220, 220, 220);
  rows.forEach(([label, val]) => {
    doc.line(M, y + 4, W - M, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), M, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(val, W - M, y + 18, { align: 'right' });
    y += 22;
  });
  doc.line(M, y + 4, W - M, y + 4);
  y += 22;

  // ───── SCOPE OF WORK
  doc.setTextColor(...AMBER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('//  SCOPE OF WORK', M, y);
  y += 16;

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  (narrative.scope_bullets || []).forEach((bullet) => {
    if (y > H - 150) { doc.addPage(); y = M; }
    doc.setFillColor(...AMBER);
    doc.circle(M + 4, y - 3, 2, 'F');
    const lines = doc.splitTextToSize(bullet, W - M * 2 - 16);
    doc.text(lines, M + 16, y);
    y += lines.length * 13 + 4;
  });
  y += 8;

  // ───── TECHNICAL SPEC
  if (y > H - 180) { doc.addPage(); y = M; }
  doc.setTextColor(...AMBER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('//  ENGINEERED SPECIFICATION', M, y);
  y += 16;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const specLines = doc.splitTextToSize(narrative.technical_spec || '', W - M * 2);
  doc.text(specLines, M, y);
  y += specLines.length * 13 + 12;

  // ───── INVESTMENT BLOCK
  if (y > H - 200) { doc.addPage(); y = M; }
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, W - M * 2, 90, 'F');
  doc.setFillColor(...AMBER);
  doc.rect(M, y, 4, 90, 'F');

  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PROJECT INVESTMENT ESTIMATE', M + 20, y + 22);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(
    `$${estimate.low.toLocaleString()} – $${estimate.high.toLocaleString()}`,
    M + 20, y + 52
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    `Based on ${estimate.sqft.toLocaleString()} sq ft at $${estimate.rate.perSqft.toFixed(2)}/sq ft installed (${estimate.rate.label}).`,
    M + 20, y + 72
  );
  doc.text(
    'Final pricing confirmed after on-site measurement. No surprises — written itemized estimate on request.',
    M + 20, y + 84
  );
  y += 108;

  // ───── WARRANTY STRIP
  doc.setFillColor(...DARK);
  doc.rect(M, y, W - M * 2, 32, 'F');
  doc.setTextColor(...AMBER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('5-YEAR WORKMANSHIP WARRANTY', M + 16, y + 19);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    narrative.warranty_note || 'Workmanship guaranteed in writing. Sealcoating at years 3, 6, and 9 recommended to reach full 25-year pavement life.',
    M + 16, y + 29, { maxWidth: W - M * 2 - 32 }
  );
  y += 48;

  // ───── NEXT STEPS FOOTER
  if (y > H - 130) { doc.addPage(); y = M; }
  doc.setTextColor(...AMBER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('//  NEXT STEPS', M, y);
  y += 16;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const steps = [
    '1. Reply to this proposal or call (804) 446-1296 to schedule an on-site measurement visit (free).',
    '2. We confirm final pricing and mix specification in writing within 48 hours of the visit.',
    '3. On contract signing, your job is typically placed on the schedule within 7–14 days (weather permitting).',
  ];
  steps.forEach((s) => {
    const lines = doc.splitTextToSize(s, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 13 + 2;
  });

  // ───── CONTACT FOOTER
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(1);
  doc.line(M, H - 70, W - M, H - 70);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('J. WORDEN & SONS ASPHALT PAVING', M, H - 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('1601 Ware Bottom Springs Rd, Suite 214  ·  Chester, VA 23836', M, H - 40);
  doc.text('(804) 446-1296  ·  j.wordenandsonspaving@gmail.com  ·  jwordenasphaltpaving.com', M, H - 28);
  doc.text('Licensed  ·  Bonded  ·  Insured  ·  Virginia Asphalt Association Member', M, H - 16);

  return doc.output('arraybuffer');
};

const OWNER_EMAIL = 'j.wordenandsonspaving@gmail.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id } = await req.json();
    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 1. Estimate
    const estimate = estimateJob(lead);

    // 2. Narrative via Claude
    const narrative = await buildNarrative(base44, lead, estimate);

    // 3. Build PDF
    const pdfBytes = buildPdf(lead, estimate, narrative);

    // 4. Upload PDF
    const safeName = (lead.name || 'client').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `proposal_${safeName}_${Date.now()}.pdf`;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    // 5. Email the proposal
    const emailBody = `Hi ${lead.name || 'there'},

Thank you for reaching out to J. Worden & Sons Asphalt Paving. Please find your custom proposal attached via the link below.

DOWNLOAD YOUR PROPOSAL:
${file_url}

Quick summary:
• Surface: ${(lead.surface_type || 'driveway').replace(/_/g, ' ')}
• Area: ${estimate.sqft.toLocaleString()} sq ft
• Material grade: ${estimate.rate.label}
• Investment estimate: $${estimate.low.toLocaleString()} – $${estimate.high.toLocaleString()}

This proposal is valid for 30 days. To lock in pricing and schedule your free on-site measurement, simply reply to this email or call us at (804) 446-1296.

We appreciate the opportunity to earn your business. 40+ years of family-owned paving — done right the first time.

— The J. Worden & Sons Team
1601 Ware Bottom Springs Rd, Suite 214 · Chester, VA 23836
(804) 446-1296 · j.wordenandsonspaving@gmail.com`;

    // Try to email the client directly. Base44 SendEmail may restrict sending to
    // non-app-users; if so, fall back to owner-only delivery.
    let clientEmailed = false;
    if (lead.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: lead.email,
          subject: `Your Asphalt Paving Proposal from J. Worden & Sons — $${estimate.low.toLocaleString()}–$${estimate.high.toLocaleString()}`,
          body: emailBody,
          from_name: 'J. Worden & Sons',
        });
        clientEmailed = true;
      } catch (sendErr) {
        console.warn('[generateProposalPDF] Could not email client directly:', sendErr?.message);
      }
    }

    // Always send a copy to the owner with a forward-ready email body
    const ownerSubject = clientEmailed
      ? `📄 Proposal Sent to ${lead.name}: $${estimate.low.toLocaleString()}–$${estimate.high.toLocaleString()}`
      : `📄 Proposal READY (FORWARD TO CLIENT): ${lead.name} — $${estimate.low.toLocaleString()}–$${estimate.high.toLocaleString()}`;

    const ownerBody = clientEmailed
      ? `✅ Proposal automatically emailed to ${lead.email}.\n\nClient: ${lead.name}\nPhone: ${lead.phone || '—'}\nEstimate: $${estimate.low.toLocaleString()}–$${estimate.high.toLocaleString()}\nPDF: ${file_url}\n\n— J. Worden Proposal System`
      : `📬 ACTION REQUIRED: Forward the email below to ${lead.email || 'the client (no email on file)'}.\n\nClient: ${lead.name}\nPhone: ${lead.phone || '—'}\nEstimate: $${estimate.low.toLocaleString()}–$${estimate.high.toLocaleString()}\nPDF: ${file_url}\n\n────── READY-TO-FORWARD EMAIL ──────\nSubject: Your Asphalt Paving Proposal from J. Worden & Sons\n\n${emailBody}\n────────────────────────────────────\n\n— J. Worden Proposal System`;

    let ownerEmailed = false;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        subject: ownerSubject,
        body: ownerBody,
        from_name: 'J. Worden Proposal System',
      });
      ownerEmailed = true;
    } catch (ownerErr) {
      console.warn('[generateProposalPDF] Could not email owner:', ownerErr?.message);
    }

    // 6. Update lead status to quoted
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      status: 'quoted',
    });

    return Response.json({
      success: true,
      file_url,
      estimate_low: estimate.low,
      estimate_high: estimate.high,
      emailed: clientEmailed,
      owner_emailed: ownerEmailed,
    });
  } catch (error) {
    console.error('[generateProposalPDF] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});