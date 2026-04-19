export type TabKey = "home" | "projects" | "roadmap" | "calendar" | "settings";

export type TaskCategory = "health" | "finance" | "strategy" | "execution";

export interface RoadmapTask {
  id: string;
  title: string;
  exp: number;
  durationMinutes: number;
  category: TaskCategory;
  completed: boolean;
  repeatUntilDone: boolean;
}

export interface RoadmapPhase {
  id: string;
  number: number;
  title: string;
  tasks: RoadmapTask[];
}

export interface RoadmapProject {
  id: string;
  name: string;
  dueDateLabel: string;
  phases: RoadmapPhase[];
  currentPhaseNumber: number;
}

export interface AiSuggestionInput {
  projectName: string;
  objective: string;
  phaseCount: number;
}

export interface AiGeneratedPhase {
  phaseNumber: number;
  goal: string;
  tasks: string[];
}

export interface AiGeneratedPlan {
  phases: AiGeneratedPhase[];
}
