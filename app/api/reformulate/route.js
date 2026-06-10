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

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: `${instructions}\n\nContenu original:\n"${text}"` }],
      }),
    });
    const data = await res.json();
    const result = data.content?.[0]?.text?.trim() || "";
    return Response.json({ result });
  } catch (err) {
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
