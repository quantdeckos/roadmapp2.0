import { AiGeneratedPlan, AiSuggestionInput } from "../types/domain";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const buildFallbackPlan = (input: AiSuggestionInput): AiGeneratedPlan => ({
  phases: Array.from({ length: input.phaseCount }, (_, index) => ({
    phaseNumber: index + 1,
    goal: `Phase ${index + 1}: ${input.objective}`,
    tasks: [
      "Define the smallest measurable deliverable",
      "Execute one focused work block",
      "Review progress and adjust next action"
    ]
  }))
});

const extractJsonObject = (text: string) => {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return text.slice(firstBrace, lastBrace + 1);
};

const normalizePlan = (candidate: unknown, phaseCount: number): AiGeneratedPlan | null => {
  if (!candidate || typeof candidate !== "object" || !Array.isArray((candidate as { phases?: unknown[] }).phases)) {
    return null;
  }

  const rawPhases = (candidate as { phases: unknown[] }).phases;
  const phases = rawPhases
    .map((phase, index) => {
      const item = phase as { phaseNumber?: unknown; goal?: unknown; tasks?: unknown };
      const tasks = Array.isArray(item.tasks)
        ? item.tasks.filter((task): task is string => typeof task === "string")
        : [];

      return {
        phaseNumber: typeof item.phaseNumber === "number" ? item.phaseNumber : index + 1,
        goal: typeof item.goal === "string" ? item.goal : `Phase ${index + 1}`,
        tasks: tasks.slice(0, 6)
      };
    })
    .filter((phase) => phase.tasks.length > 0);

  if (phases.length === 0) {
    return null;
  }

  return {
    phases: phases.slice(0, phaseCount).map((phase, index) => ({
      ...phase,
      phaseNumber: index + 1
    }))
  };
};

export const generateRoadmapPlan = async (input: AiSuggestionInput): Promise<AiGeneratedPlan> => {
  if (!OPENAI_API_KEY) {
    return buildFallbackPlan(input);
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
    return buildFallbackPlan(input);
  }

  const data = await response.json();
  const outputText = data.output_text ?? "";
  const candidateJson = extractJsonObject(outputText);
  if (!candidateJson) {
    return buildFallbackPlan(input);
  }

  try {
    const parsed = JSON.parse(candidateJson);
    return normalizePlan(parsed, input.phaseCount) ?? buildFallbackPlan(input);
  } catch {
    return buildFallbackPlan(input);
  }
};
