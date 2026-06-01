import { GenerateNameRequest, NameEntry } from "./types";
import { buildPrompt } from "./prompt";
import { validateName } from "./validate";
import { getFallbackName } from "@/data/names";

export async function generateName(
  req: GenerateNameRequest,
  baziPrompt?: string
): Promise<NameEntry> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    console.warn("DeepSeek API key not configured — using fallback");
    return {
      ...getFallbackName(req.sourceCategory),
      _fallback: true,
    } as NameEntry;
  }

  const prompt = buildPrompt(req, baziPrompt);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `DeepSeek API error: ${response.status} ${response.statusText}`
      );
      return { ...getFallbackName(req.sourceCategory), _fallback: true } as NameEntry;
    }

    const data = await response.json();
    const raw = JSON.parse(data.choices[0].message.content);

    const validated = validateName(raw);
    if (!validated) {
      console.warn("AI response failed validation — using fallback");
      return { ...getFallbackName(req.sourceCategory), _fallback: true } as NameEntry;
    }

    return { ...validated, sourceCategory: req.sourceCategory };
  } catch (error) {
    console.error("Name generation failed:", error);
    return { ...getFallbackName(req.sourceCategory), _fallback: true } as NameEntry;
  }
}
