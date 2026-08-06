import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY
});

export async function GET() {

  const response =
    await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: "Hola"
        }
      ]
    });

  return new Response(
    JSON.stringify({
      ok: true,
      answer:
        response.choices[0].message.content
    })
  );
}