import { useEffect, useMemo, useState } from "react";
import { initialRoadmapProject } from "../data/mockRoadmap";
import { RoadmapPhase, RoadmapProject } from "../types/domain";
import { fetchRoadmapProject, updateProjectPhase, updateTaskCompletion } from "../services/roadmapRepo";

const areAllTasksComplete = (phase: RoadmapPhase) => phase.tasks.every((task) => task.completed);

export const useRoadmap = () => {
  const [project, setProject] = useState<RoadmapProject>(initialRoadmapProject);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const loadedProject = await fetchRoadmapProject();
        setProject(loadedProject);
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

  const currentPhase = useMemo(
    () => project.phases.find((phase) => phase.number === project.currentPhaseNumber) ?? project.phases[0],
    [project]
  );

  const nextPhaseLocked = useMemo(() => !areAllTasksComplete(currentPhase), [currentPhase]);

  const toggleTask = async (taskId: string) => {
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
  };

  const completedTaskCount = useMemo(
    () => project.phases.flatMap((phase) => phase.tasks).filter((task) => task.completed).length,
    [project]
  );

  const totalTaskCount = useMemo(() => project.phases.flatMap((phase) => phase.tasks).length, [project]);
  const progressPercent = Math.round((completedTaskCount / totalTaskCount) * 100);

  return {
    project,
    currentPhase,
    nextPhaseLocked,
    progressPercent,
    loading,
    syncError,
    toggleTask,
    moveToNextPhase
  };
};
