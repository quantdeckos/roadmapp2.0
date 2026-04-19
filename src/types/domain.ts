export type TabKey = "home" | "projects" | "roadmap" | "calendar" | "settings";

export type TaskCategory = "health" | "finance" | "strategy" | "execution";

export interface TaskAttachment {
  id: string;
  name: string;
  uri: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description?: string;
  details?: string;
  location?: string;
  date?: string;
  time?: string;
  timerMinutes?: number;
  tags?: string[];
  dueDate?: string;
  attachments?: TaskAttachment[];
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
