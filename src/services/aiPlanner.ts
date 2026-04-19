import { AiSuggestionInput } from "../types/domain";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export const generateRoadmapPlan = async (input: AiSuggestionInput) => {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_OPENAI_API_KEY");
  }

  const prompt = `
You are an expert productivity planner.
Create a phased roadmap in JSON with this structure:
{
  "phases": [
    { "phaseNumber": 1, "goal": "...", "tasks": ["...", "..."] }
  ]
}
Constraints:
- Project name: ${input.projectName}
- Objective: ${input.objective}
- Number of phases: ${input.phaseCount}
- Tasks should be actionable and short.
- Keep each phase at 3-5 tasks.
Return JSON only.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: prompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI generation failed: ${errorText}`);
  }

  const data = await response.json();
  const outputText = data.output_text ?? "";

  return outputText;
};
