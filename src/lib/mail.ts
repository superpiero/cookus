import "server-only";

// Abstrakce e-mailů (docs/02 §1): s RESEND_API_KEY posílá přes Resend API,
// bez něj loguje do konzole (dev/demo). Selhání e-mailu nikdy neshodí akci.
type Mail = { to: string; subject: string; text: string };

export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail:log] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Cookus <onboarding@resend.dev>",
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
      }),
    });
    if (!res.ok) console.error(`[mail:error] ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("[mail:error]", err);
  }
}

export function appUrl(path: string) {
  return `${process.env.APP_URL ?? "http://localhost:3000"}${path}`;
}
