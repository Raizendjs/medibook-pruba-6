export async function verifyRecaptcha(token: string | null | undefined): Promise<boolean> {
  const secret = import.meta.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    console.error(
      "RECAPTCHA_SECRET_KEY no está configurada. Ver instrucciones en README/entrega."
    );
    return false;
  }

  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Error verificando reCAPTCHA:", err);
    return false;
  }
}
