import sgMail from '@sendgrid/mail';
export function initSendgrid(apiKey) {
    if (!apiKey)
        throw new Error('SENDGRID_API_KEY is required');
    sgMail.setApiKey(apiKey);
}
export async function sendApplyEmail(opts) {
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
