export async function POST(req) {
  try {
    const { text, tone, addHashtags, addEmoji } = await req.json();
    const instructions = [
      "Traduis et reformule ce contenu en français.",
      "Garde le même sens mais reformule avec tes propres mots.",
      tone === "pro" && "Ton professionnel et soigné.",
      tone === "casual" && "Ton décontracté et naturel.",
      tone === "punchy" && "Ton percutant et direct.",
      addHashtags && "Ajoute 2-3 hashtags pertinents en français à la fin.",
      addEmoji && "Ajoute quelques emojis bien placés.",
      "Réponds UNIQUEMENT avec le texte reformulé, sans guillemets ni explication.",
      "Si le contenu est long, écris-le entièrement sans le tronquer.",
    ].filter(Boolean).join(" ");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "user", content: `${instructions}\n\nContenu original:\n"${text}"` }
        ],
        max_tokens: 2000,
      }),
    });
    const data = await res.json();
    const result = data.choices?.[0]?.message?.content?.trim() || "";
    return Response.json({ result });
  } catch (err) {
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
