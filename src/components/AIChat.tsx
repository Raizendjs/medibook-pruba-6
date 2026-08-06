


import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hola, soy el asistente virtual de Zenix. Estoy aquí para ayudarte con Diseño Web, SEO, Marketing Digital, Tiendas Online y más."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const getResponse = (text: string) => {
    const msg = text.toLowerCase();

    if (msg.includes("seo") || msg.includes("google")) {
      return "Nuestro servicio SEO ayuda a posicionar tu empresa en Google para atraer más clientes potenciales.";
    }

    if (
      msg.includes("pagina") ||
      msg.includes("web") ||
      msg.includes("sitio")
    ) {
      return "Podemos desarrollar una página web moderna, rápida, optimizada para SEO y enfocada en generar ventas.";
    }

    if (msg.includes("marketing") || msg.includes("publicidad")) {
      return "Nuestro servicio de Marketing Digital combina SEO, campañas publicitarias y estrategias de conversión para aumentar tus ventas.";
    }

    if (
      msg.includes("precio") ||
      msg.includes("costo") ||
      msg.includes("cotizacion")
    ) {
      return "Con gusto podemos ayudarte. ¿Qué servicio te interesa cotizar: Diseño Web, SEO, Marketing Digital o Tienda Online?";
    }

    if (msg.includes("tienda") || msg.includes("ecommerce")) {
      return "Desarrollamos tiendas online profesionales integradas con pagos, inventario y herramientas de marketing.";
    }

    if (msg.includes("contacto") || msg.includes("whatsapp")) {
      return "Puedes escribirnos por WhatsApp o dejarnos tus datos para que uno de nuestros asesores se comunique contigo.";
    }

    return "Gracias por tu consulta. Cuéntame más sobre tu proyecto y te recomendaré la mejor solución para tu negocio.";
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userText = input;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText }
    ]);

    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = getResponse(userText);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response }
      ]);

      setLoading(false);
    }, 1200);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-white shadow-2xl hover:scale-105 transition-all"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          🤖
        </div>

        <div className="text-left">
          <div className="font-bold">Asistente IA</div>
          <div className="text-xs opacity-80">Estamos en línea</div>
        </div>
      </button>

      {/* CHAT */}
      <div
        className={`fixed bottom-24 right-6 z-[9999]
        flex h-[650px] w-[400px] flex-col overflow-hidden rounded-3xl border shadow-2xl
        bg-white text-black border-zinc-200
        dark:bg-zinc-900 dark:text-white dark:border-zinc-700
        transition-all duration-300
        ${
          open
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* HEADER */}
        <div className="relative bg-gradient-to-r from-blue-600 to-violet-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              🤖
            </div>

            <div>
              <h3 className="font-bold text-lg">Asistente IA</h3>
              <p className="text-sm opacity-80">Marketing y Ventas</p>
            </div>
          </div>
        </div>

        {/* MENSAJES */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-800">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white shadow dark:bg-zinc-700 dark:text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="inline-block rounded-2xl px-4 py-3 shadow bg-white dark:bg-zinc-700">
              Escribiendo...
            </div>
          )}
        </div>

        {/* ACCIONES RÁPIDAS */}
        <div className="border-t px-4 py-3 dark:border-zinc-700">
          <div className="flex gap-2 overflow-x-auto">
            {[
              "Necesito una página web",
              "Necesito SEO",
              "Necesito Marketing Digital",
              "Quiero una cotización"
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q)}
                className="rounded-full px-4 py-2 text-sm transition bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
              >
                {q.replace("Necesito ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* INPUT */}
        <div className="border-t p-4 bg-white dark:bg-zinc-900 dark:border-zinc-700">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Escribe tu consulta..."
              className="flex-1 rounded-xl border px-4 py-3 outline-none bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />

            <button
              onClick={sendMessage}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 text-white font-bold"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}