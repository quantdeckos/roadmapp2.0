import { RoadmapProject } from "../types/domain";

const buildPhaseTasks = (phaseNumber: number) => [
  {
    id: `phase-${phaseNumber}-task-1`,
    title: "Evening rituals",
    exp: 10,
    durationMinutes: 15,
    category: "health" as const,
    completed: false,
    repeatUntilDone: true
  },
  {
    id: `phase-${phaseNumber}-task-2`,
    title: "Drink 5 glasses of water",
    exp: 10,
    durationMinutes: 15,
    category: "health" as const,
    completed: false,
    repeatUntilDone: true
  },
  {
    id: `phase-${phaseNumber}-task-3`,
    title: "Review budget targets",
    exp: 10,
    durationMinutes: 15,
    category: "finance" as const,
    completed: false,
    repeatUntilDone: true
  },
  {
    id: `phase-${phaseNumber}-task-4`,
    title: "Meditation",
    exp: 10,
    durationMinutes: 10,
    category: "health" as const,
    completed: false,
    repeatUntilDone: true
  },
  {
    id: `phase-${phaseNumber}-task-5`,
    title: "Deep work sprint",
    exp: 15,
    durationMinutes: 45,
    category: "execution" as const,
    completed: false,
    repeatUntilDone: true
  },
  {
    id: `phase-${phaseNumber}-task-6`,
    title: "Review milestone blockers",
    exp: 10,
    durationMinutes: 20,
    category: "strategy" as const,
    completed: false,
    repeatUntilDone: true
  },
  {
    id: `phase-${phaseNumber}-task-7`,
    title: "Write progress summary",
    exp: 10,
    durationMinutes: 15,
    category: "execution" as const,
    completed: false,
    repeatUntilDone: true
  },
  {
    id: `phase-${phaseNumber}-task-8`,
    title: "Plan tomorrow priorities",
    exp: 10,
    durationMinutes: 12,
    category: "strategy" as const,
    completed: false,
    repeatUntilDone: true
  }
];

export const initialRoadmapProject: RoadmapProject = {
  id: "project-1",
  name: "RoadMapp Product Launch",
  dueDateLabel: "Jul 28",
  currentPhaseNumber: 1,
  phases: Array.from({ length: 20 }, (_, i) => ({
    id: `phase-${i + 1}`,
    number: i + 1,
    title: `Phase ${i + 1}`,
    tasks: buildPhaseTasks(i + 1)
  }))
};
