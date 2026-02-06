import nodemailer from 'nodemailer';

type SendParams = {
  to: string;
  subject: string;
  text: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !portRaw || !from) return null;
  const port = Number(portRaw);
  if (!Number.isFinite(port)) return null;

  const secure = (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || port === 465;

  return {
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    from,
  } as const;
}

export async function sendEmail(params: SendParams) {
  const smtp = getSmtpConfig();
  if (!smtp) {
    // Fallback de dev: não quebra o fluxo, só loga.
    // eslint-disable-next-line no-console
    console.log(`[mail] SMTP não configurado. Enviaria para: ${params.to}`);
    // eslint-disable-next-line no-console
    console.log(`[mail] Subject: ${params.subject}`);
    // eslint-disable-next-line no-console
    console.log(params.text);
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });

  await transport.sendMail({
    from: smtp.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
}

