import sgMail from '@sendgrid/mail';

export function initSendgrid(apiKey: string) {
  if (!apiKey) throw new Error('SENDGRID_API_KEY is required');
  sgMail.setApiKey(apiKey);
}

export async function sendApplyEmail(opts: {
  from: { email: string; name?: string };
  to: string;
  subject: string;
  text: string;
  attachments: Array<{ filename: string; contentBase64: string; type: string }>;
}) {
  const { from, to, subject, text, attachments } = opts;
  await sgMail.send({
    from,
    to,
    subject,
    text,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.contentBase64,
      type: a.type,
      disposition: 'attachment'
    }))
  });
}
