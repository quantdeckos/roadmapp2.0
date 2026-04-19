import { initialRoadmapProject } from "../data/mockRoadmap";
import { AiGeneratedPlan, RoadmapPhase, RoadmapProject, RoadmapTask } from "../types/domain";
import { isSupabaseConfigured, supabase } from "./supabase";

type DbProjectRow = {
  id: string;
  name: string;
  due_date: string | null;
  current_phase_number: number;
};

type DbPhaseRow = {
  id: string;
  project_id: string;
  phase_number: number;
  title: string;
};

type DbTaskRow = {
  id: string;
  phase_id: string;
  title: string;
  exp: number;
  duration_minutes: number;
  category: RoadmapTask["category"];
  completed: boolean;
  repeat_until_done: boolean;
  sort_order: number;
};

const formatDueDateLabel = (dateInput: string | null) => {
  if (!dateInput) {
    return "No due date";
  }

  const date = new Date(dateInput);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const convertRowsToProject = (
  projectRow: DbProjectRow,
  phases: DbPhaseRow[],
  tasks: DbTaskRow[]
): RoadmapProject => {
  const tasksByPhaseId = new Map<string, DbTaskRow[]>();
  tasks.forEach((task) => {
    const phaseTasks = tasksByPhaseId.get(task.phase_id) ?? [];
    phaseTasks.push(task);
    tasksByPhaseId.set(task.phase_id, phaseTasks);
  });

  const projectPhases: RoadmapPhase[] = phases
    .sort((a, b) => a.phase_number - b.phase_number)
    .map((phase) => ({
      id: phase.id,
      number: phase.phase_number,
      title: phase.title,
      tasks: (tasksByPhaseId.get(phase.id) ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((task) => ({
          id: task.id,
          title: task.title,
          exp: task.exp,
          durationMinutes: task.duration_minutes,
          category: task.category,
          completed: task.completed,
          repeatUntilDone: task.repeat_until_done
        }))
    }));

  return {
    id: projectRow.id,
    name: projectRow.name,
    dueDateLabel: formatDueDateLabel(projectRow.due_date),
    currentPhaseNumber: projectRow.current_phase_number,
    phases: projectPhases
  };
};

const seedDefaultProject = async (): Promise<RoadmapProject> => {
  if (!supabase) {
    return initialRoadmapProject;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 90);

  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: initialRoadmapProject.name,
      due_date: dueDate.toISOString().slice(0, 10),
      current_phase_number: initialRoadmapProject.currentPhaseNumber,
      phase_count: initialRoadmapProject.phases.length
    })
    .select("id, name, due_date, current_phase_number")
    .single<DbProjectRow>();

  if (projectError || !projectData) {
    throw new Error(projectError?.message ?? "Unable to create project.");
  }

  const phaseRows = initialRoadmapProject.phases.map((phase) => ({
    project_id: projectData.id,
    phase_number: phase.number,
    title: phase.title,
    is_locked: phase.number > initialRoadmapProject.currentPhaseNumber
  }));

  const { data: phasesData, error: phasesError } = await supabase
    .from("phases")
    .insert(phaseRows)
    .select("id, project_id, phase_number, title");

  if (phasesError || !phasesData) {
    throw new Error(phasesError?.message ?? "Unable to create phases.");
  }

  const phaseIdByNumber = new Map<number, string>();
  phasesData.forEach((phase) => phaseIdByNumber.set(phase.phase_number, phase.id));

  const taskRows = initialRoadmapProject.phases.flatMap((phase) =>
    phase.tasks.map((task, index) => ({
      phase_id: phaseIdByNumber.get(phase.number),
      title: task.title,
      exp: task.exp,
      duration_minutes: task.durationMinutes,
      category: task.category,
      completed: task.completed,
      repeat_until_done: task.repeatUntilDone,
      sort_order: index
    }))
  );

  const { error: tasksError } = await supabase.from("tasks").insert(taskRows);
  if (tasksError) {
    throw new Error(tasksError.message);
  }

  return fetchRoadmapProject(projectData.id);
};

export const fetchRoadmapProject = async (projectId?: string): Promise<RoadmapProject> => {
  if (!isSupabaseConfigured || !supabase) {
    return initialRoadmapProject;
  }

  let query = supabase
    .from("projects")
    .select("id, name, due_date, current_phase_number")
    .order("created_at", { ascending: true })
    .limit(1);

  if (projectId) {
    query = query.eq("id", projectId);
  }

  const { data: projectRows, error: projectError } = await query;
  if (projectError) {
    throw new Error(projectError.message);
  }

  const project = projectRows?.[0];
  if (!project) {
    return seedDefaultProject();
  }

  const { data: phaseRows, error: phaseError } = await supabase
    .from("phases")
    .select("id, project_id, phase_number, title")
    .eq("project_id", project.id);

  if (phaseError) {
    throw new Error(phaseError.message);
  }

  const phaseIds = (phaseRows ?? []).map((phase) => phase.id);
  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .select("id, phase_id, title, exp, duration_minutes, category, completed, repeat_until_done, sort_order")
    .in("phase_id", phaseIds.length > 0 ? phaseIds : ["00000000-0000-0000-0000-000000000000"]);

  if (taskError) {
    throw new Error(taskError.message);
  }

  return convertRowsToProject(project as DbProjectRow, (phaseRows ?? []) as DbPhaseRow[], (taskRows ?? []) as DbTaskRow[]);
};

export const updateTaskCompletion = async (taskId: string, completed: boolean) => {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase.from("tasks").update({ completed }).eq("id", taskId);
  if (error) {
    throw new Error(error.message);
  }
};

export const updateProjectPhase = async (projectId: string, nextPhaseNumber: number) => {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { error: projectError } = await supabase
    .from("projects")
    .update({ current_phase_number: nextPhaseNumber })
    .eq("id", projectId);
  if (projectError) {
    throw new Error(projectError.message);
  }

  const { error: unlockError } = await supabase
    .from("phases")
    .update({ is_locked: false })
    .eq("project_id", projectId)
    .eq("phase_number", nextPhaseNumber);
  if (unlockError) {
    throw new Error(unlockError.message);
  }
};

export const createProjectFromAiPlan = async (
  projectName: string,
  phaseCount: number,
  plan: AiGeneratedPlan
): Promise<RoadmapProject> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Add env values first.");
  }

  const normalizedPhases = plan.phases
    .slice(0, phaseCount)
    .map((phase, index) => ({
      phaseNumber: index + 1,
      title: phase.goal.trim() || `Phase ${index + 1}`,
      tasks: phase.tasks.length > 0 ? phase.tasks : ["Define deliverable", "Execute work block", "Review outcomes"]
    }));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Math.max(phaseCount * 4, 30));

  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: projectName,
      due_date: dueDate.toISOString().slice(0, 10),
      phase_count: normalizedPhases.length,
      current_phase_number: 1
    })
    .select("id, name, due_date, current_phase_number")
    .single();

  if (projectError || !projectData) {
    throw new Error(projectError?.message ?? "Unable to create AI project.");
  }

  const phaseRows = normalizedPhases.map((phase) => ({
    project_id: projectData.id,
    phase_number: phase.phaseNumber,
    title: phase.title,
    is_locked: phase.phaseNumber !== 1
  }));

  const { data: insertedPhases, error: phaseError } = await supabase
    .from("phases")
    .insert(phaseRows)
    .select("id, phase_number");
  if (phaseError || !insertedPhases) {
    throw new Error(phaseError?.message ?? "Unable to insert AI phases.");
  }

  const phaseIdMap = new Map<number, string>();
  insertedPhases.forEach((phase) => phaseIdMap.set(phase.phase_number, phase.id));

  const taskRows = normalizedPhases.flatMap((phase) =>
    phase.tasks.slice(0, 8).map((task, index) => ({
      phase_id: phaseIdMap.get(phase.phaseNumber),
      title: task.trim() || `Task ${index + 1}`,
      exp: 10,
      duration_minutes: 20,
      category: "strategy",
      completed: false,
      repeat_until_done: true,
      sort_order: index
    }))
  );

  const { error: taskError } = await supabase.from("tasks").insert(taskRows);
  if (taskError) {
    throw new Error(taskError.message);
  }

  return fetchRoadmapProject(projectData.id);
};
