import { useEffect, useMemo, useState } from "react";
import { initialRoadmapProject } from "../data/mockRoadmap";
import { RoadmapPhase, RoadmapProject, RoadmapTask } from "../types/domain";
import { generateRoadmapPlan } from "../services/aiPlanner";
import {
  createProjectFromAiPlan,
  fetchRoadmapProject,
  updateProjectPhase,
  updateTaskCompletion
} from "../services/roadmapRepo";

const areAllTasksComplete = (phase: RoadmapPhase) => phase.tasks.every((task) => task.completed);

interface ManualTaskInput {
  title: string;
  description?: string;
  details?: string;
  location?: string;
  date?: string;
  time?: string;
  tags?: string[];
  dueDate?: string;
  attachments?: { name: string; uri: string }[];
}

interface ManualTaskCreateInput {
  title: string;
  description?: string;
  details?: string;
  location?: string;
  date?: string;
  time?: string;
  tags?: string[];
  dueDate?: string;
  attachments?: { name: string; uri: string }[];
}

export const useRoadmap = () => {
  const [project, setProject] = useState<RoadmapProject>(initialRoadmapProject);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [generatingAiProject, setGeneratingAiProject] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [phaseStartedAtMap, setPhaseStartedAtMap] = useState<Record<number, number>>({});
  const [liveNow, setLiveNow] = useState(Date.now());

  useEffect(() => {
    const loadProject = async () => {
      try {
        await fetchRoadmapProject();
        // Always boot into a blank canvas so roadmap creation starts from zero.
        setProject(initialRoadmapProject);
        setSyncError(null);
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : "Failed to load project data.");
      } finally {
        setLoading(false);
      }
    };

    loadProject().catch(() => {
      setLoading(false);
      setSyncError("Failed to load project data.");
    });
  }, []);

  const currentPhase = useMemo(() => {
    if (project.phases.length === 0) {
      return null;
    }
    return project.phases.find((phase) => phase.number === project.currentPhaseNumber) ?? project.phases[0];
  }, [project]);

  useEffect(() => {
    const tick = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const nextPhaseLocked = useMemo(() => {
    if (!currentPhase) {
      return true;
    }
    return !areAllTasksComplete(currentPhase);
  }, [currentPhase]);

  const toggleTask = async (taskId: string) => {
    if (!currentPhase) {
      return;
    }

    let updatedCompletion = false;

    setProject((prev) => {
      const phases = prev.phases.map((phase) =>
        phase.number === prev.currentPhaseNumber
          ? {
              ...phase,
              tasks: phase.tasks.map((task) => {
                if (task.id === taskId) {
                  updatedCompletion = !task.completed;
                  return { ...task, completed: updatedCompletion };
                }
                return task;
              })
            }
          : phase
      );

      return { ...prev, phases };
    });

    try {
      await updateTaskCompletion(taskId, updatedCompletion);
      setSyncError(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Failed to sync task update.");
      setProject((prev) => {
        const phases = prev.phases.map((phase) =>
          phase.number === prev.currentPhaseNumber
            ? {
                ...phase,
                tasks: phase.tasks.map((task) =>
                  task.id === taskId ? { ...task, completed: !task.completed } : task
                )
              }
            : phase
        );

        return { ...prev, phases };
      });
    }
  };

  const moveToNextPhase = async () => {
    if (!currentPhase) {
      return;
    }

    let nextNumberCandidate: number | null = null;

    setProject((prev) => {
      const current = prev.phases.find((phase) => phase.number === prev.currentPhaseNumber);
      if (!current || !areAllTasksComplete(current)) {
        return prev;
      }

      const nextNumber = prev.currentPhaseNumber + 1;
      nextNumberCandidate = nextNumber;
      if (!prev.phases.some((phase) => phase.number === nextNumber)) {
        nextNumberCandidate = null;
        return prev;
      }

      return { ...prev, currentPhaseNumber: nextNumber };
    });

    if (!nextNumberCandidate) {
      return;
    }

    try {
      await updateProjectPhase(project.id, nextNumberCandidate);
      setSyncError(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Failed to sync phase advance.");
      setProject((prev) => ({ ...prev, currentPhaseNumber: Math.max(prev.currentPhaseNumber - 1, 1) }));
    }
    if (nextNumberCandidate) {
      setPhaseStartedAtMap((prevMap) =>
        prevMap[nextNumberCandidate] ? prevMap : { ...prevMap, [nextNumberCandidate]: Date.now() }
      );
    }
  };

  const selectPhase = (phaseNumber: number) => {
    setProject((prev) => {
      if (!prev.phases.some((phase) => phase.number === phaseNumber)) {
        return prev;
      }
      return { ...prev, currentPhaseNumber: phaseNumber };
    });
  };

  const completedTaskCount = useMemo(
    () => project.phases.flatMap((phase) => phase.tasks).filter((task) => task.completed).length,
    [project]
  );

  const totalTaskCount = useMemo(() => project.phases.flatMap((phase) => phase.tasks).length, [project]);
  const progressPercent = totalTaskCount === 0 ? 0 : Math.round((completedTaskCount / totalTaskCount) * 100);
  const currentPhaseElapsedSeconds = useMemo(() => {
    if (!currentPhase) {
      return 0;
    }
    const startedAt = phaseStartedAtMap[currentPhase.number];
    if (!startedAt) {
      return 0;
    }
    return Math.max(0, Math.floor((liveNow - startedAt) / 1000));
  }, [currentPhase, phaseStartedAtMap, liveNow]);

  const generateProjectWithAi = async (input: {
    projectName: string;
    objective: string;
    phaseCount: number;
  }): Promise<boolean> => {
    setGeneratingAiProject(true);
    setAiGenerationError(null);

    try {
      const plan = await generateRoadmapPlan({
        projectName: input.projectName,
        objective: input.objective,
        phaseCount: input.phaseCount
      });

      const createdProject = await createProjectFromAiPlan(input.projectName, input.phaseCount, plan);
      setProject(createdProject);
      setSyncError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate roadmap.";
      setAiGenerationError(message);
      return false;
    } finally {
      setGeneratingAiProject(false);
    }
  };

  const addPhaseWithTasks = (input: { tasks: ManualTaskInput[] }) => {
    setProject((prev) => {
      const nextPhaseNumber = prev.phases.length + 1;
      const tasks = input.tasks
        .filter((task) => task.title.trim().length > 0)
        .map((task, index) => ({
          id: `manual-phase-${nextPhaseNumber}-task-${Date.now()}-${index + 1}`,
          title: task.title.trim(),
          description: task.description?.trim() || undefined,
          details: task.details?.trim() || undefined,
          location: task.location?.trim() || undefined,
          date: task.date?.trim() || undefined,
          time: task.time?.trim() || undefined,
          tags: task.tags?.filter((tag) => tag.trim().length > 0).map((tag) => tag.trim()) ?? [],
          dueDate: task.dueDate?.trim() || undefined,
          attachments: task.attachments ?? [],
          exp: 10,
          durationMinutes: 20,
          category: "strategy" as const,
          completed: false,
          repeatUntilDone: true
        }));

      const createdPhase: RoadmapPhase = {
        id: `manual-phase-${nextPhaseNumber}-${Date.now()}`,
        number: nextPhaseNumber,
        title: `Phase ${nextPhaseNumber}`,
        tasks
      };

      setPhaseStartedAtMap((prevMap) => ({ ...prevMap, [nextPhaseNumber]: Date.now() }));

      return {
        ...prev,
        phases: [...prev.phases, createdPhase],
        currentPhaseNumber: nextPhaseNumber
      };
    });
  };

  const updateTask = (
    taskId: string,
    updates: Partial<
      Pick<
        RoadmapTask,
        "title" | "description" | "details" | "location" | "date" | "time" | "dueDate" | "tags" | "attachments"
      >
    >
  ) => {
    setProject((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
      }))
    }));
  };

  const addTaskAttachment = (taskId: string, attachment: { name: string; uri: string }) => {
    setProject((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                attachments: [
                  ...(task.attachments ?? []),
                  { id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...attachment }
                ]
              }
            : task
        )
      }))
    }));
  };

  const addTaskToPhase = (phaseNumber: number, input: ManualTaskCreateInput) => {
    if (!input.title.trim()) {
      return;
    }

    setProject((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) => {
        if (phase.number !== phaseNumber) {
          return phase;
        }
        const newTask = {
          id: `manual-phase-${phaseNumber}-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: input.title.trim(),
          description: input.description?.trim() || undefined,
          details: input.details?.trim() || undefined,
          location: input.location?.trim() || undefined,
          date: input.date?.trim() || undefined,
          time: input.time?.trim() || undefined,
          tags: input.tags?.filter((tag) => tag.trim().length > 0).map((tag) => tag.trim()) ?? [],
          dueDate: input.dueDate?.trim() || undefined,
          attachments: input.attachments ?? [],
          exp: 10,
          durationMinutes: 20,
          category: "strategy" as const,
          completed: false,
          repeatUntilDone: true
        };
        return { ...phase, tasks: [...phase.tasks, newTask] };
      })
    }));
  };

  const deleteTaskFromPhase = (taskId: string) => {
    setProject((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.filter((task) => task.id !== taskId)
      }))
    }));
  };

  return {
    project,
    currentPhase,
    nextPhaseLocked,
    progressPercent,
    currentPhaseElapsedSeconds,
    loading,
    syncError,
    generatingAiProject,
    aiGenerationError,
    toggleTask,
    moveToNextPhase,
    selectPhase,
    updateTask,
    deleteTaskFromPhase,
    addTaskAttachment,
    addTaskToPhase,
    generateProjectWithAi,
    addPhaseWithTasks
  };
};
