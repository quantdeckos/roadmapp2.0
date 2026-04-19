import { useMemo, useState } from "react";
import { initialRoadmapProject } from "../data/mockRoadmap";
import { RoadmapPhase, RoadmapProject } from "../types/domain";

const areAllTasksComplete = (phase: RoadmapPhase) => phase.tasks.every((task) => task.completed);

export const useRoadmap = () => {
  const [project, setProject] = useState<RoadmapProject>(initialRoadmapProject);

  const currentPhase = useMemo(
    () => project.phases.find((phase) => phase.number === project.currentPhaseNumber) ?? project.phases[0],
    [project]
  );

  const nextPhaseLocked = useMemo(() => !areAllTasksComplete(currentPhase), [currentPhase]);

  const toggleTask = (taskId: string) => {
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
  };

  const moveToNextPhase = () => {
    setProject((prev) => {
      const current = prev.phases.find((phase) => phase.number === prev.currentPhaseNumber);
      if (!current || !areAllTasksComplete(current)) {
        return prev;
      }

      const nextNumber = prev.currentPhaseNumber + 1;
      if (!prev.phases.some((phase) => phase.number === nextNumber)) {
        return prev;
      }

      return { ...prev, currentPhaseNumber: nextNumber };
    });
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
    toggleTask,
    moveToNextPhase
  };
};
