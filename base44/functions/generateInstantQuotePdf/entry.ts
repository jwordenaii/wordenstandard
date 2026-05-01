import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * Generates a branded PDF estimate for a submitted lead and emails it via Gmail.
 * Called right after a lead submits the QuoteEngine.
 *
 * Payload: { leadId }
 */

const fmt = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

const base64UrlEncode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Rough ballpark pricing per sqft by material (for estimate only — final quote is on-site).
const PRICE_PER_SQFT = {
  economy: 3.50,
  standard: 4.75,
  premium: 6.25,
  commercial: 5.50,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();
    if (!leadId) {
      return Response.json({ error: 'leadId required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const sqft = lead.sqft || 0;
    const rate = PRICE_PER_SQFT[lead.material] || PRICE_PER_SQFT.standard;
    const lowEst = Math.round(sqft * rate * 0.85);
    const highEst = Math.round(sqft * rate * 1.15);

    // --- Build the PDF ---
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const primary = [255, 191, 0]; // amber
    const dark = [20, 20, 20];
    const gray = [100, 100, 100];

    // Header band
    doc.setFillColor(...dark);
    doc.rect(0, 0, 612, 90, 'F');
    doc.setFillColor(...primary);
    doc.rect(0, 85, 612, 5, 'F');

    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('J. WORDEN & SONS', 40, 40);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Asphalt Paving · Central Virginia · Licensed & Insured', 40, 58);
    doc.setFontSize(9);
    doc.text('(804) 446-1296  ·  j.wordenandsonspaving@gmail.com  ·  jwordenasphaltpaving.com', 40, 74);

    // Title
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('PRELIMINARY ESTIMATE', 40, 135);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`Prepared for: ${lead.name || '—'}`, 40, 155);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, 170);
    doc.text(`Quote #: JW-${leadId.slice(-8).toUpperCase()}`, 40, 185);

    // Project details box
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.rect(40, 210, 532, 130);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PROJECT DETAILS', 55, 235);

    const details = [
      ['Surface Type:', fmt(lead.surface_type)],
      ['Estimated Area:', sqft ? `${Math.round(sqft).toLocaleString()} sq ft` : '—'],
      ['Material Grade:', fmt(lead.material)],
      ['Timeline:', fmt(lead.urgency)],
      ['Project Address:', lead.address || '—'],
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 260;
    details.forEach(([label, value]) => {
      doc.setTextColor(...gray);
      doc.text(label, 55, y);
      doc.setTextColor(...dark);
      doc.text(value, 180, y);
      y += 16;
    });

    // Price range box
    doc.setFillColor(...primary);
    doc.rect(40, 360, 532, 80, 'F');
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PRELIMINARY PRICE RANGE', 55, 385);
    doc.setFontSize(28);
    if (sqft > 0) {
      doc.text(`$${lowEst.toLocaleString()} — $${highEst.toLocaleString()}`, 55, 418);
    } else {
      doc.text('To be determined on-site', 55, 418);
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('*Final price confirmed after free on-site assessment. No obligation.', 55, 434);

    // What's included
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('WHAT YOUR PROJECT INCLUDES', 40, 475);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const includes = [
      '✓  Full site preparation and sub-base grading',
      '✓  State-spec asphalt mix engineered for Virginia climate',
      '✓  Machine-laid & rolled to manufacturer density',
      '✓  Edge sealing and smooth drainage pitch',
      '✓  Written warranty on materials and workmanship',
      '✓  Cleanup and final walk-through inspection',
    ];
    let iy = 495;
    includes.forEach((line) => {
      doc.text(line, 50, iy);
      iy += 16;
    });

    // Next steps
    doc.setFillColor(245, 245, 245);
    doc.rect(40, 605, 532, 80, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('NEXT STEPS', 55, 625);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('1.  A project consultant will call within 24 hours to schedule your free site visit.', 55, 645);
    doc.text('2.  We measure and inspect the site, then deliver a final itemized written quote.', 55, 660);
    doc.text('3.  Work scheduled around weather windows for the best-possible cure.', 55, 675);

    // Footer
    doc.setTextColor(...gray);
    doc.setFontSize(8);
    doc.text('J. Worden & Sons Asphalt Paving · 1601 Ware Bottom Springs Rd, Suite 214 · Chester, VA 23836', 40, 740);
    doc.text('This preliminary estimate is valid for 30 days. VA Class A Contractor · Licensed · Bonded · Insured.', 40, 752);

    // --- Email the PDF via Gmail ---
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    let emailed = false;
    if (lead.email) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const profile = await profileRes.json();
        const fromEmail = profile.emailAddress;

        const boundary = `bnd_${Date.now()}`;
        const firstName = lead.name?.split(' ')[0] || 'there';
        const textBody = `Hi ${firstName},\n\nAttached is your preliminary estimate from J. Worden & Sons Asphalt Paving. A consultant will call within 24 hours to schedule your free on-site assessment.\n\nQuestions? Reply to this email or call (804) 446-1296.\n\n— J. Worden & Sons`;

        const rawParts = [
          `From: J. Worden & Sons <${fromEmail}>`,
          `To: ${lead.email}`,
          `Subject: Your Preliminary Estimate — J. Worden & Sons`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          'Content-Transfer-Encoding: 7bit',
          '',
          textBody,
          '',
          `--${boundary}`,
          'Content-Type: application/pdf',
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="JWorden-Estimate.pdf"`,
          '',
          pdfBase64,
          '',
          `--${boundary}--`,
        ].join('\r\n');

        const raw = base64UrlEncode(rawParts);
        const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        });

        if (sendRes.ok) emailed = true;
        else console.error('[generateInstantQuotePdf] Gmail error:', await sendRes.text());
      } catch (e) {
        console.error('[generateInstantQuotePdf] Gmail send failed:', e.message);
      }
    }

    return Response.json({
      success: true,
      emailed,
      pdfDataUri: doc.output('datauristring'),
      priceRange: sqft > 0 ? { low: lowEst, high: highEst } : null,
    });
  } catch (error) {
    console.error('[generateInstantQuotePdf]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});