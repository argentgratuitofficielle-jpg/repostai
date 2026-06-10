import crypto from "crypto";

function percentEncode(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g, "%21").replace(/'/g, "%27")
    .replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
}

function signRequest(method, url, credentials) {
  const { apiKey, apiSecret, accessToken, accessTokenSecret } = credentials;
  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };
  const sortedParams = Object.keys(oauthParams).sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join("&");
  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(sortedParams)].join("&");
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauthParams.oauth_signature = signature;
  const headerParts = Object.keys(oauthParams).sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");
  return `OAuth ${headerParts}`;
}

export async function POST(req) {
  try {
    const { text, apiKey, apiSecret, accessToken, accessTokenSecret } = await req.json();
    if (!text || !apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return Response.json({ error: "Champs manquants" }, { status: 400 });
    }
    if (text.length > 280) {
      return Response.json({ error: "Dépasse 280 caractères" }, { status: 400 });
    }
    const url = "https://api.twitter.com/2/tweets";
    const authorization = signRequest("POST", url, { apiKey, apiSecret, accessToken, accessTokenSecret });
    const twitterRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ text }),
    });
    const data = await twitterRes.json();
    if (!twitterRes.ok) {
      return Response.json({ error: data?.detail || "Erreur Twitter API", details: data }, { status: twitterRes.status });
    }
    return Response.json({ success: true, tweet_id: data?.data?.id }, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
