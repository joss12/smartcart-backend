import "dotenv/config";

type OllamaGenerateResponse = {
  response: string;
};

export async function generateProductDescription(input: {
  name: string;
  features: string[];
}) {
  const baseUrl = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL ?? "gemma:2b";

  const aiEnabled = (process.env.AI_ENABLED ?? "true").toLowerCase() === "true";
  if (!aiEnabled) {
    throw new Error("AI is disabled in this environment.");
  }

  const prompt = `

JSON schema:
{
  "title": "string",
  "description": "string",
  "bullets": ["string"]
}

Rules:
- title <= 60 characters
- description <= 320 characters
- bullets: 3 to 5 items
- Do NOT invent specifications (no DPI, battery hours, etc.)

Product name: ${input.name}
Features: ${input.features.join(", ")}
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    let data: { response: string };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON from Ollama: ${text.slice(0, 200)}`);
    }

    const raw = data.response.trim();

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`Model did not return JSON. Got: ${raw.slice(0, 200)}`);
    }

    const jsonText = raw.slice(start, end + 1);

    let parsed: {
      title: string;
      description: string;
      bullets: string[];
    };

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error(`Failed to parse model JSON: ${jsonText.slice(0, 200)}`);
    }

    if (!Array.isArray(parsed.bullets)) {
      parsed.bullets = [];
    }

    return parsed;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Ollama request timed out (20s). Try smaller model.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
