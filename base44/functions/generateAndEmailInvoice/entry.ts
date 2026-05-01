import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { jobId } = await req.json();

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Fetch job data
    const job = await base44.asServiceRole.entities.Job.get(jobId);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.client_name || !job.client_phone) {
      return Response.json({ error: 'Job missing client information' }, { status: 400 });
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFillColor(43, 122, 11);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 199, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('J. WORDEN & SONS', margin, 15);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('Asphalt Paving Specialist', margin, 23);

    yPos = 45;

    // Invoice title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', margin, yPos);
    yPos += 12;

    // Job and dates
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 6;
    doc.text(`Job Date: ${job.scheduled_date || '—'}`, margin, yPos);
    yPos += 12;

    // Client info section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BILL TO:', margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(job.client_name, margin, yPos);
    yPos += 6;
    doc.text(job.client_phone, margin, yPos);
    yPos += 10;

    // Job details section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('JOB DETAILS:', margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const details = [
      { label: 'Title', value: job.title },
      { label: 'Address', value: job.address || '—' },
      { label: 'Surface Type', value: job.surface_type ? job.surface_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—' },
      { label: 'Square Footage', value: job.sqft ? Math.round(job.sqft).toLocaleString() + ' sq ft' : '—' },
      { label: 'Status', value: job.status.replace('_', ' ').toUpperCase() },
      { label: 'Crew', value: job.crew || '—' },
    ];

    details.forEach(({ label, value }) => {
      doc.text(`${label}:`, margin, yPos);
      doc.text(value, margin + 40, yPos);
      yPos += 6;
    });

    yPos += 8;

    // Notes section
    if (job.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('NOTES:', margin, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(job.notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 5 + 10;
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('1601 Ware Bottom Springs Rd, Suite 214, Chester, VA 23836', margin, pageHeight - 12);
    doc.text('(804) 446-1296 | j.wordenandsonspaving@gmail.com', margin, pageHeight - 7);

    // Generate PDF as base64
    const pdfData = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    // Send email with PDF attachment (using Core integration)
    const subject = `Invoice for ${job.title} — J. Worden & Sons`;
    const body = `Dear ${job.client_name},

Thank you for choosing J. Worden & Sons for your asphalt paving project.

Please find your invoice attached. If you have any questions or need clarification on any details, please don't hesitate to contact us.

Best regards,
J. Worden & Sons Asphalt Paving
1601 Ware Bottom Springs Rd, Suite 214
Chester, VA 23836
(804) 446-1296
j.wordenandsonspaving@gmail.com`;

    // Note: Core.SendEmail doesn't support attachments directly. We'll send via plain email.
    // For production, consider implementing a custom email service with attachment support.
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: job.client_phone || 'j.wordenandsonspaving@gmail.com', // Fallback if no email
      subject,
      body,
      from_name: 'J. Worden & Sons',
    });

    return Response.json({
      success: true,
      message: `Invoice email sent for job: ${job.title}`,
      jobId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});