import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { RoadmapPhase, RoadmapTask } from "../types/domain";
import { colors } from "../theme/colors";
type EditPickerField = "date" | "time" | "dueDate";

interface TaskListProps {
  phase: RoadmapPhase | null;
  phaseElapsedSeconds: number;
  nextPhaseLocked: boolean;
  showCompletionActions: boolean;
  onToggleTask: (taskId: string) => void;
  onMoveToNextPhase: () => void;
  onUpdateTask: (
    taskId: string,
    updates: Partial<
      Pick<
        RoadmapTask,
        "title" | "description" | "details" | "location" | "date" | "time" | "dueDate" | "tags" | "attachments"
      >
    >
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onUploadTaskFile: (taskId: string, attachment: { name: string; uri: string }) => void;
  onAddTaskToPhase: (
    phaseNumber: number,
    task: {
      title: string;
      description?: string;
      details?: string;
      location?: string;
      date?: string;
      time?: string;
      tags?: string[];
      dueDate?: string;
      attachments?: { id?: string; name: string; uri: string }[];
    }
  ) => void;
  onStartRoadmap: () => void;
  onArchiveProject: () => void;
  onStartNewProject: () => void;
}

const formatElapsed = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

const pastelTagColors = ["#FBD5E5", "#D7F3E3", "#DCE8FF", "#FDECC8", "#E7D9FF", "#FFD9C9"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const periodOptions = ["AM", "PM"] as const;
const wheelRowHeight = 40;
const wheelEdgePaddingRows = 2;
const isImageAttachment = (uri: string, name: string) =>
  /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(uri) || /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(name);
const googleMapsSearchUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const to12HourTime = (timeValue: string) => {
  const normalized = timeValue.trim().toUpperCase();
  if (normalized.includes("AM") || normalized.includes("PM")) {
    return timeValue;
  }
  const matched = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!matched) {
    return timeValue;
  }
  const hours = Number(matched[1]);
  const minutes = matched[2];
  if (Number.isNaN(hours) || hours < 0 || hours > 23) {
    return timeValue;
  }
  const suffix = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${suffix}`;
};
const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isBeforeDate = (left: Date, right: Date) => normalizeDate(left).getTime() < normalizeDate(right).getTime();
const to24Hour = (hour: number, period: "AM" | "PM") => {
  const normalized = hour % 12;
  return period === "PM" ? normalized + 12 : normalized;
};
const isPastTimeForDate = (dateValue: string, hour: number, minute: string, period: "AM" | "PM") => {
  const selectedDate = parseDateValue(dateValue);
  if (!selectedDate) {
    return false;
  }
  if (normalizeDate(selectedDate).getTime() !== startOfToday().getTime()) {
    return false;
  }
  const now = new Date();
  const selectedMinutes = to24Hour(hour, period) * 60 + Number(minute);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return selectedMinutes <= currentMinutes;
};
const parseDateValue = (value?: string) => {
  if (!value) {
    return null;
  }
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) {
    return null;
  }
  const date = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};
const parseTimeValue = (value?: string) => {
  if (!value) {
    return { hour: 9, minute: "00", period: "AM" as const };
  }
  const upper = value.trim().toUpperCase();
  const twelveMatch = upper.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveMatch) {
    const hour = Number(twelveMatch[1]);
    if (hour >= 1 && hour <= 12) {
      return { hour, minute: twelveMatch[2], period: twelveMatch[3] as "AM" | "PM" };
    }
  }
  const twentyFourMatch = upper.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    const hour24 = Number(twentyFourMatch[1]);
    const minute = twentyFourMatch[2];
    if (hour24 >= 0 && hour24 <= 23) {
      const period = hour24 >= 12 ? "PM" : "AM";
      const hour = hour24 % 12 || 12;
      return { hour, minute, period };
    }
  }
  return { hour: 9, minute: "00", period: "AM" as const };
};
const buildCalendarGrid = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
};

export const TaskList = ({
  phase,
  phaseElapsedSeconds,
  nextPhaseLocked,
  showCompletionActions,
  onToggleTask,
  onMoveToNextPhase,
  onUpdateTask,
  onDeleteTask,
  onUploadTaskFile,
  onAddTaskToPhase,
  onStartRoadmap,
  onArchiveProject,
  onStartNewProject
}: TaskListProps) => {
  const [editingTask, setEditingTask] = useState<RoadmapTask | null>(null);
  const [editTagInput, setEditTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAttachments, setEditAttachments] = useState<{ id?: string; name: string; uri: string }[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<{ name: string; uri: string } | null>(null);
  const [editPickerField, setEditPickerField] = useState<EditPickerField | null>(null);
  const [isAddingNewTaskFromEdit, setIsAddingNewTaskFromEdit] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
  const [editPickerError, setEditPickerError] = useState<string | null>(null);
  const [timeHour, setTimeHour] = useState(9);
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    details: "",
    location: "",
    date: "",
    time: "",
    dueDate: ""
  });

  const editTagPreview = useMemo(() => editTags.map((tag, idx) => ({ tag, idx })), [editTags]);
  const calendarGrid = useMemo(() => buildCalendarGrid(calendarMonth), [calendarMonth]);
  const editTagInputRef = useRef<TextInput | null>(null);
  const pickerMinDate = useMemo(() => {
    const today = startOfToday();
    if (!editPickerField) {
      return today;
    }
    if (editPickerField === "dueDate") {
      const taskDate = parseDateValue(editDraft.date);
      if (taskDate && isBeforeDate(today, taskDate)) {
        return normalizeDate(taskDate);
      }
    }
    return today;
  }, [editDraft.date, editPickerField]);
  const hourWheelRef = useRef<ScrollView | null>(null);
  const minuteWheelRef = useRef<ScrollView | null>(null);
  const periodWheelRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (editPickerField !== "time") {
      return;
    }
    const timeout = setTimeout(() => {
      hourWheelRef.current?.scrollTo({ y: (timeHour - 1) * wheelRowHeight, animated: false });
      minuteWheelRef.current?.scrollTo({ y: Number(timeMinute) * wheelRowHeight, animated: false });
      periodWheelRef.current?.scrollTo({ y: (timePeriod === "AM" ? 0 : 1) * wheelRowHeight, animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [editPickerField, timeHour, timeMinute, timePeriod]);

  const pickAndUploadTaskFile = async (taskId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || result.assets.length === 0) {
        return;
      }
      const file = result.assets[0];
      onUploadTaskFile(taskId, { name: file.name || "Attachment", uri: file.uri });
    } catch {
      // Silent fail for now; can surface a toast later.
    }
  };

  const pickAttachmentForEdit = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || result.assets.length === 0) {
        return;
      }
      const file = result.assets[0];
      setEditAttachments((prev) => [
        ...prev,
        {
          id: `edit-att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name || "Attachment",
          uri: file.uri
        }
      ]);
    } catch {
      // no-op
    }
  };

  const openAddressInMaps = async (address: string) => {
    try {
      await Linking.openURL(googleMapsSearchUrl(address));
    } catch {
      // no-op
    }
  };
  const openEditPicker = (field: EditPickerField) => {
    setEditPickerError(null);
    setEditPickerField(field);
    if (field === "time") {
      const parsed = parseTimeValue(editDraft.time);
      setTimeHour(parsed.hour);
      setTimeMinute(parsed.minute);
      setTimePeriod(parsed.period);
      return;
    }
    const currentValue = field === "date" ? editDraft.date : editDraft.dueDate;
    const rawDate = parseDateValue(currentValue) ?? new Date();
    const today = startOfToday();
    const minDate =
      field === "dueDate" && editDraft.date
        ? (() => {
            const taskDate = parseDateValue(editDraft.date);
            if (taskDate && isBeforeDate(today, taskDate)) {
              return normalizeDate(taskDate);
            }
            return today;
          })()
        : today;
    const parsedDate = isBeforeDate(rawDate, minDate) ? minDate : rawDate;
    setCalendarSelectedDate(parsedDate);
    setCalendarMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
  };
  const applyEditPickerValue = (value: string) => {
    if (!editPickerField) {
      return;
    }
    setEditDraft((prev) => {
      if (editPickerField === "date") {
        const nextDraft = { ...prev, date: value };
        const nextDate = parseDateValue(value);
        const dueDate = parseDateValue(prev.dueDate);
        if (nextDate && dueDate && isBeforeDate(dueDate, nextDate)) {
          nextDraft.dueDate = value;
        }
        if (prev.time && isPastTimeForDate(value, parseTimeValue(prev.time).hour, parseTimeValue(prev.time).minute, parseTimeValue(prev.time).period)) {
          nextDraft.time = "";
        }
        return nextDraft;
      }
      if (editPickerField === "dueDate") {
        const nextDueDate = parseDateValue(value);
        const taskDate = parseDateValue(prev.date);
        if (nextDueDate && taskDate && isBeforeDate(nextDueDate, taskDate)) {
          return { ...prev, dueDate: formatDate(taskDate) };
        }
        return { ...prev, dueDate: value };
      }
      return { ...prev, time: value };
    });
    setEditPickerError(null);
    setEditPickerField(null);
  };
  const openQuickNewTask = () => {
    setEditingTask(null);
    setIsAddingNewTaskFromEdit(true);
    setEditPickerField(null);
    setEditPickerError(null);
    setEditDraft({
      title: "",
      description: "",
      details: "",
      location: "",
      date: "",
      time: "",
      dueDate: ""
    });
    setEditTags([]);
    setEditAttachments([]);
    setEditTagInput("");
  };
  const createTaskFromDraft = (closeAfterCreate: boolean) => {
    if (!phase || !editDraft.title.trim()) {
      return;
    }
    onAddTaskToPhase(phase.number, {
      title: editDraft.title.trim(),
      description: editDraft.description.trim() || undefined,
      details: editDraft.details.trim() || undefined,
      location: editDraft.location.trim() || undefined,
      date: editDraft.date.trim() || undefined,
      time: editDraft.time.trim() || undefined,
      dueDate: editDraft.dueDate.trim() || undefined,
      tags: editTags,
      attachments: editAttachments
    });
    if (closeAfterCreate) {
      setEditingTask(null);
      setIsAddingNewTaskFromEdit(false);
      return;
    }
    setEditDraft({
      title: "",
      description: "",
      details: "",
      location: "",
      date: "",
      time: "",
      dueDate: ""
    });
    setEditTags([]);
    setEditAttachments([]);
    setEditTagInput("");
  };

  if (!phase) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Blank roadmap canvas</Text>
          <Text style={styles.emptyBody}>No phase yet. Tap + or Ask AI to create your first roadmap.</Text>
          <TouchableOpacity onPress={onStartRoadmap} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Start roadmap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.phaseTitleRow}>
        <View style={styles.dot} />
        <Text style={styles.phaseTitle}>phase {phase.number}</Text>
        <TouchableOpacity style={styles.phaseQuickAddButton} onPress={openQuickNewTask}>
          <Ionicons name="add" size={14} color={colors.charcoal} />
        </TouchableOpacity>
        <View style={styles.liveTimerPill}>
          <Text style={styles.liveTimerText}>{formatElapsed(phaseElapsedSeconds)}</Text>
        </View>
      </View>

      <ScrollView style={styles.taskScroll} contentContainerStyle={styles.taskStack} showsVerticalScrollIndicator={false}>
        {phase.tasks.map((task) => (
          <TouchableOpacity key={task.id} onPress={() => onToggleTask(task.id)} style={styles.taskRow}>
            <View style={[styles.circle, task.completed && styles.circleDone]}>
              {task.completed ? <Ionicons name="checkmark" size={14} color={colors.charcoal} /> : null}
            </View>
            <View style={styles.taskContentRow}>
              <View style={styles.taskCopy}>
                <Text style={[styles.taskText, task.completed && styles.taskDone]}>{task.title}</Text>
                {task.description ? <Text style={styles.taskDescription}>{task.description}</Text> : null}
                {task.details ? <Text style={styles.taskDetails}>{task.details}</Text> : null}
                {task.location ? (
                  <TouchableOpacity
                    onPress={() => {
                      void openAddressInMaps(task.location ?? "");
                    }}
                    style={styles.addressLinkWrap}
                  >
                    <Text style={styles.addressLink}>{task.location}</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.taskScheduleMeta}>
                  {[
                    task.date ? `Date ${task.date}` : null,
                    task.time ? `Time ${to12HourTime(task.time)}` : null,
                    task.dueDate ? `Due ${task.dueDate}` : null
                  ]
                    .filter(Boolean)
                    .join(" • ") || `${task.durationMinutes}min`}
                </Text>
                {task.tags && task.tags.length > 0 ? (
                  <View style={styles.taskTagsWrap}>
                    {task.tags.map((tag, idx) => (
                      <View
                        key={`${task.id}-tag-${tag}-${idx}`}
                        style={[styles.taskTagChip, { backgroundColor: pastelTagColors[idx % pastelTagColors.length] }]}
                      >
                        <Text style={styles.taskTagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {task.attachments && task.attachments.length > 0 ? (
                  <View style={styles.taskAttachmentList}>
                    {task.attachments.map((file, idx) => (
                      <TouchableOpacity
                        key={`${task.id}-attachment-${file.id ?? idx}`}
                        style={styles.taskAttachmentChip}
                        onPress={() => setSelectedAttachment({ name: file.name, uri: file.uri })}
                      >
                        <Text style={styles.taskAttachmentChipText}>{file.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
              <View style={styles.taskActionsRight}>
                <TouchableOpacity
                  style={styles.taskActionButtonLight}
                  onPress={() => {
                    setEditingTask(task);
                    setIsAddingNewTaskFromEdit(false);
                    setEditDraft({
                      title: task.title,
                      description: task.description ?? "",
                      details: task.details ?? "",
                      location: task.location ?? "",
                      date: task.date ?? "",
                      time: task.time ?? "",
                      dueDate: task.dueDate ?? ""
                    });
                    setEditTags(task.tags ?? []);
                    setEditAttachments(task.attachments ?? []);
                    setEditTagInput("");
                  }}
                >
                  <Text style={styles.taskActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.taskActionButtonLight}
                  onPress={() => {
                    void pickAndUploadTaskFile(task.id);
                  }}
                >
                  <Text style={styles.taskActionText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showCompletionActions ? (
        <View style={styles.completionActionsRow}>
          <TouchableOpacity style={[styles.nextButton, styles.archiveButton]} onPress={onArchiveProject}>
            <Text style={[styles.nextButtonText, styles.archiveButtonText]}>Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.nextButton, styles.startNewProjectButton]} onPress={onStartNewProject}>
            <Text style={styles.nextButtonText}>Start New Project</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onMoveToNextPhase}
          disabled={nextPhaseLocked}
          style={[styles.nextButton, nextPhaseLocked && styles.nextButtonLocked]}
        >
          <Text style={[styles.nextButtonText, nextPhaseLocked && styles.nextButtonTextLocked]}>
            {nextPhaseLocked ? "Complete all tasks to unlock phase" : "Move to next phase"}
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={editingTask !== null || isAddingNewTaskFromEdit}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditingTask(null);
          setIsAddingNewTaskFromEdit(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isAddingNewTaskFromEdit ? "New Task" : "Edit Task"}</Text>
            <TextInput
              value={editDraft.title}
              onChangeText={(value) => setEditDraft((prev) => ({ ...prev, title: value }))}
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor="#737A89"
            />
            <TextInput
              value={editDraft.description}
              onChangeText={(value) => setEditDraft((prev) => ({ ...prev, description: value }))}
              style={styles.modalInput}
              placeholder="Description"
              placeholderTextColor="#737A89"
            />
            <TextInput
              value={editDraft.details}
              onChangeText={(value) => setEditDraft((prev) => ({ ...prev, details: value }))}
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Details"
              placeholderTextColor="#737A89"
              multiline
            />
            <TextInput
              value={editDraft.location}
              onChangeText={(value) => setEditDraft((prev) => ({ ...prev, location: value }))}
              style={styles.modalInput}
              placeholder="Location"
              placeholderTextColor="#737A89"
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.modalPickerButton, styles.modalHalf]} onPress={() => openEditPicker("date")}>
                <Text style={editDraft.date ? styles.modalPickerValue : styles.modalPickerPlaceholder}>
                  {editDraft.date || "Pick date"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalPickerButton, styles.modalHalf]} onPress={() => openEditPicker("time")}>
                <Text style={editDraft.time ? styles.modalPickerValue : styles.modalPickerPlaceholder}>
                  {editDraft.time || "Pick time"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalPickerButton} onPress={() => openEditPicker("dueDate")}>
              <Text style={editDraft.dueDate ? styles.modalPickerValue : styles.modalPickerPlaceholder}>
                {editDraft.dueDate || "Pick due date"}
              </Text>
            </TouchableOpacity>
            <View style={styles.editTagsWrap}>
              {editTagPreview.map(({ tag, idx }) => (
                <TouchableOpacity key={`${tag}-${idx}`} style={styles.editTagChip} onPress={() => setEditTags((prev) => prev.filter((t) => t !== tag))}>
                  <Text style={styles.editTagText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              ref={editTagInputRef}
              value={editTagInput}
              onChangeText={setEditTagInput}
              onSubmitEditing={() => {
                const clean = editTagInput.trim().replace(/^#/, "");
                if (!clean) {
                  requestAnimationFrame(() => {
                    editTagInputRef.current?.focus();
                  });
                  return;
                }
                setEditTags((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
                setEditTagInput("");
                requestAnimationFrame(() => {
                  editTagInputRef.current?.focus();
                });
              }}
              blurOnSubmit={false}
              style={styles.modalInput}
              placeholder="Add tag and press Enter"
              placeholderTextColor="#737A89"
              returnKeyType="done"
            />
            <Text style={styles.modalSectionTitle}>Attachments</Text>
            {editAttachments.length === 0 ? <Text style={styles.modalHint}>No attachments yet.</Text> : null}
            {editAttachments.map((file, fileIndex) => (
              <View key={file.id ?? `${file.name}-${fileIndex}`} style={styles.editAttachmentRow}>
                <TextInput
                  value={file.name}
                  onChangeText={(value) =>
                    setEditAttachments((prev) =>
                      prev.map((item, idx) => (idx === fileIndex ? { ...item, name: value } : item))
                    )
                  }
                  style={[styles.modalInput, styles.editAttachmentNameInput]}
                  placeholder="File name"
                  placeholderTextColor="#737A89"
                />
                <TouchableOpacity
                  style={styles.editAttachmentOpen}
                  onPress={async () => {
                    try {
                      await Linking.openURL(file.uri);
                    } catch {
                      // no-op
                    }
                  }}
                >
                  <Text style={styles.editAttachmentOpenText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editAttachmentRemove}
                  onPress={() => setEditAttachments((prev) => prev.filter((_, idx) => idx !== fileIndex))}
                >
                  <Text style={styles.editAttachmentRemoveText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.modalAddNew}
              onPress={() => {
                void pickAttachmentForEdit();
              }}
            >
              <Text style={styles.modalAddNewText}>+ Upload attachment</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              {isAddingNewTaskFromEdit && !editingTask ? (
                <TouchableOpacity style={styles.modalSave} onPress={() => createTaskFromDraft(true)}>
                  <Text style={styles.modalSaveText}>Done</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.modalAddNew}
                onPress={() => {
                  createTaskFromDraft(false);
                  setIsAddingNewTaskFromEdit(true);
                }}
              >
                <Text style={styles.modalAddNewText}>+ Add another task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setEditingTask(null);
                  setIsAddingNewTaskFromEdit(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              {editingTask ? (
                <TouchableOpacity
                  style={styles.modalDelete}
                  onPress={() => {
                    onDeleteTask(editingTask.id);
                    setEditingTask(null);
                    setIsAddingNewTaskFromEdit(false);
                  }}
                >
                  <Text style={styles.modalDeleteText}>Delete task</Text>
                </TouchableOpacity>
              ) : null}
              {editingTask ? (
                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={() => {
                    onUpdateTask(editingTask.id, {
                      title: editDraft.title.trim() || editingTask.title,
                      description: editDraft.description.trim() || undefined,
                      details: editDraft.details.trim() || undefined,
                      location: editDraft.location.trim() || undefined,
                      date: editDraft.date.trim() || undefined,
                      time: editDraft.time.trim() || undefined,
                      dueDate: editDraft.dueDate.trim() || undefined,
                      tags: editTags,
                      attachments: editAttachments
                    });
                    setEditingTask(null);
                    setIsAddingNewTaskFromEdit(false);
                  }}
                >
                  <Text style={styles.modalSaveText}>Update current task</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editPickerField !== null}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setEditPickerField(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditPickerField(null)}>
          <Pressable style={styles.pickerModalCard} onPress={() => null}>
            <Text style={styles.modalTitle}>
              {editPickerField === "time" ? "Select Time" : editPickerField === "dueDate" ? "Select Due Date" : "Select Date"}
            </Text>
            {editPickerField === "time" ? (
              <View style={styles.wheelContainer}>
                <ScrollView
                  ref={hourWheelRef}
                  style={styles.wheelColumn}
                  contentContainerStyle={styles.wheelContent}
                  snapToInterval={wheelRowHeight}
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.y / wheelRowHeight);
                    const clamped = Math.max(0, Math.min(index, hourOptions.length - 1));
                    setTimeHour(hourOptions[clamped]);
                  }}
                >
                  {hourOptions.map((hour) => (
                    <TouchableOpacity key={`hour-${hour}`} style={styles.wheelRow} onPress={() => setTimeHour(hour)}>
                      <Text style={[styles.wheelText, timeHour === hour && styles.wheelTextActive]}>{hour}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView
                  ref={minuteWheelRef}
                  style={styles.wheelColumn}
                  contentContainerStyle={styles.wheelContent}
                  snapToInterval={wheelRowHeight}
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.y / wheelRowHeight);
                    const clamped = Math.max(0, Math.min(index, minuteOptions.length - 1));
                    setTimeMinute(minuteOptions[clamped]);
                  }}
                >
                  {minuteOptions.map((minute) => (
                    <TouchableOpacity key={`minute-${minute}`} style={styles.wheelRow} onPress={() => setTimeMinute(minute)}>
                      <Text style={[styles.wheelText, timeMinute === minute && styles.wheelTextActive]}>{minute}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView
                  ref={periodWheelRef}
                  style={styles.wheelColumn}
                  contentContainerStyle={styles.wheelContent}
                  snapToInterval={wheelRowHeight}
                  decelerationRate="fast"
                  showsVerticalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.y / wheelRowHeight);
                    const clamped = Math.max(0, Math.min(index, periodOptions.length - 1));
                    setTimePeriod(periodOptions[clamped]);
                  }}
                >
                  {periodOptions.map((period) => (
                    <TouchableOpacity key={`period-${period}`} style={styles.wheelRow} onPress={() => setTimePeriod(period)}>
                      <Text style={[styles.wheelText, timePeriod === period && styles.wheelTextActive]}>{period}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View pointerEvents="none" style={styles.wheelCenterOverlay} />
              </View>
            ) : (
              <>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    style={styles.calendarArrow}
                    onPress={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  >
                    <Text style={styles.calendarArrowText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthLabel}>
                    {monthLabels[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity
                    style={styles.calendarArrow}
                    onPress={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  >
                    <Text style={styles.calendarArrowText}>›</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarDayHeaderRow}>
                  {dayLabels.map((day) => (
                    <Text key={day} style={styles.calendarDayHeaderText}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarGrid.map((day, idx) => {
                    if (!day) {
                      return <View key={`empty-${idx}`} style={styles.calendarCell} />;
                    }
                    const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                    const disabled = isBeforeDate(cellDate, pickerMinDate);
                    const selected =
                      !disabled &&
                      calendarSelectedDate &&
                      calendarSelectedDate.getFullYear() === calendarMonth.getFullYear() &&
                      calendarSelectedDate.getMonth() === calendarMonth.getMonth() &&
                      calendarSelectedDate.getDate() === day;
                    return (
                      <TouchableOpacity
                        key={`day-${day}-${idx}`}
                        disabled={disabled}
                        style={[
                          styles.calendarCell,
                          styles.calendarDayCell,
                          disabled && styles.calendarDayCellDisabled,
                          selected && styles.calendarDayCellSelected
                        ]}
                        onPress={() => {
                          if (disabled) {
                            return;
                          }
                          setCalendarSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                          setEditPickerError(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            disabled && styles.calendarDayTextDisabled,
                            selected && styles.calendarDayTextSelected
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            {editPickerError ? <Text style={styles.pickerErrorText}>{editPickerError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => applyEditPickerValue("")}>
                <Text style={styles.modalCancelText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => {
                  if (editPickerField === "time") {
                    if (editDraft.date && isPastTimeForDate(editDraft.date, timeHour, timeMinute, timePeriod)) {
                      setEditPickerError("Past times are blocked for today.");
                      return;
                    }
                    applyEditPickerValue(`${timeHour}:${timeMinute} ${timePeriod}`);
                    return;
                  }
                  if (calendarSelectedDate) {
                    if (isBeforeDate(calendarSelectedDate, pickerMinDate)) {
                      setEditPickerError("Past dates are blocked.");
                      return;
                    }
                    applyEditPickerValue(formatDate(calendarSelectedDate));
                  }
                }}
              >
                <Text style={styles.modalSaveText}>Set</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={selectedAttachment !== null} transparent animationType="fade" onRequestClose={() => setSelectedAttachment(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Attachment Preview</Text>
            <Text style={styles.previewName}>{selectedAttachment?.name}</Text>
            {selectedAttachment && isImageAttachment(selectedAttachment.uri, selectedAttachment.name) ? (
              <Image source={{ uri: selectedAttachment.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <Text style={styles.previewUri}>{selectedAttachment?.uri}</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSelectedAttachment(null)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={async () => {
                  if (!selectedAttachment) {
                    return;
                  }
                  try {
                    await Linking.openURL(selectedAttachment.uri);
                  } catch {
                    // no-op
                  }
                }}
              >
                <Text style={styles.modalSaveText}>Open file</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.panelDark,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    overflow: "hidden"
  },
  phaseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.neon,
    marginRight: 10
  },
  phaseTitle: {
    color: colors.neon,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700"
  },
  phaseQuickAddButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neon,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4
  },
  liveTimerPill: {
    marginLeft: "auto",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4E5668",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#2A2E38"
  },
  liveTimerText: {
    color: colors.neon,
    fontSize: 12,
    fontWeight: "700"
  },
  taskStack: {
    gap: 12,
    paddingBottom: 8,
    paddingRight: 2
  },
  taskScroll: {
    flex: 1,
    minHeight: 0,
    marginRight: 2
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  taskContentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  taskCopy: {
    flex: 1
  },
  circle: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#757B88",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  circleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success
  },
  taskText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500"
  },
  taskDescription: {
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 2
  },
  taskDetails: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  taskDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted
  },
  taskMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3
  },
  addressLinkWrap: {
    alignSelf: "flex-start",
    marginTop: 3
  },
  addressLink: {
    color: "#9ED2FF",
    fontSize: 12,
    textDecorationLine: "underline"
  },
  taskScheduleMeta: {
    color: colors.neon,
    fontSize: 12,
    marginTop: 3,
    fontWeight: "700"
  },
  taskTagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5
  },
  taskTagChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  taskTagText: {
    color: "#2A2E38",
    fontSize: 12,
    fontWeight: "700"
  },
  taskAttachmentMeta: {
    color: "#C9D0DE",
    fontSize: 12,
    marginTop: 3
  },
  taskAttachmentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5
  },
  taskAttachmentChip: {
    backgroundColor: "#2A2E38",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  taskAttachmentChipText: {
    color: "#C9D0DE",
    fontSize: 12
  },
  taskActionsRight: {
    alignSelf: "center",
    gap: 6
  },
  taskActionButtonLight: {
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 50,
    alignItems: "center"
  },
  taskActionText: {
    color: colors.charcoal,
    fontSize: 10,
    fontWeight: "700"
  },
  nextButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: colors.neon,
    paddingVertical: 12,
    alignItems: "center"
  },
  nextButtonLocked: {
    backgroundColor: "#2B2F38"
  },
  nextButtonText: {
    color: colors.charcoal,
    fontWeight: "700"
  },
  nextButtonTextLocked: {
    color: colors.textMuted
  },
  completionActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10
  },
  archiveButton: {
    flex: 1,
    backgroundColor: "#2B2F38"
  },
  archiveButtonText: {
    color: colors.textPrimary
  },
  startNewProjectButton: {
    flex: 1
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700"
  },
  emptyBody: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22
  },
  emptyButton: {
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: colors.neon,
    paddingHorizontal: 18,
    paddingVertical: 11
  },
  emptyButtonText: {
    color: colors.charcoal,
    fontWeight: "700",
    fontSize: 15
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  modalCard: {
    backgroundColor: colors.panelDark,
    borderRadius: 14,
    padding: 14
  },
  pickerModalCard: {
    backgroundColor: colors.panelDark,
    borderRadius: 16,
    padding: 14
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10
  },
  previewName: {
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 8
  },
  previewUri: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 10
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#1E222B",
    marginBottom: 10
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B404D",
    backgroundColor: "#262A33",
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8
  },
  modalPickerButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B404D",
    backgroundColor: "#262A33",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8
  },
  modalPickerPlaceholder: {
    color: "#737A89"
  },
  modalPickerValue: {
    color: colors.neon,
    fontWeight: "700"
  },
  modalTextarea: {
    minHeight: 68,
    textAlignVertical: "top"
  },
  modalRow: {
    flexDirection: "row",
    gap: 8
  },
  modalHalf: {
    flex: 1
  },
  editTagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8
  },
  modalSectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 6
  },
  modalHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8
  },
  editAttachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  editAttachmentNameInput: {
    flex: 1,
    marginBottom: 6
  },
  editAttachmentOpen: {
    borderRadius: 8,
    backgroundColor: "#2A2E38",
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginBottom: 6
  },
  editAttachmentOpenText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600"
  },
  editAttachmentRemove: {
    borderRadius: 8,
    backgroundColor: "#3A2A2A",
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginBottom: 6
  },
  editAttachmentRemoveText: {
    color: "#F5B8B8",
    fontSize: 12,
    fontWeight: "700"
  },
  editTagChip: {
    backgroundColor: "#E7D9FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  editTagText: {
    color: "#2A2E38",
    fontSize: 12,
    fontWeight: "700"
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8
  },
  modalActionsRowTop: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  calendarHeader: {
    marginTop: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  calendarArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#2A2E38",
    alignItems: "center",
    justifyContent: "center"
  },
  calendarArrowText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  calendarMonthLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  calendarDayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  calendarDayHeaderText: {
    width: "14.28%",
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 12
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  calendarCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  calendarDayCell: {
    borderRadius: 10
  },
  calendarDayCellDisabled: {
    opacity: 0.35
  },
  calendarDayCellSelected: {
    backgroundColor: colors.neon
  },
  calendarDayText: {
    color: colors.textPrimary,
    fontSize: 13
  },
  calendarDayTextDisabled: {
    color: "#5C6474"
  },
  calendarDayTextSelected: {
    color: colors.charcoal,
    fontWeight: "700"
  },
  pickerErrorText: {
    marginTop: 8,
    color: "#FF9A7D",
    fontSize: 13
  },
  wheelContainer: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    height: wheelRowHeight * 5
  },
  wheelColumn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#262A33"
  },
  wheelContent: {
    paddingVertical: wheelRowHeight * wheelEdgePaddingRows
  },
  wheelRow: {
    height: wheelRowHeight,
    alignItems: "center",
    justifyContent: "center"
  },
  wheelCenterOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: wheelRowHeight * 2,
    height: wheelRowHeight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B404D",
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  wheelText: {
    color: colors.textMuted,
    fontSize: 16
  },
  wheelTextActive: {
    color: colors.neon,
    fontWeight: "700"
  },
  quickButton: {
    backgroundColor: "#2A2E38",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  quickButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 12
  },
  modalCancel: {
    borderRadius: 10,
    backgroundColor: "#2A2E38",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  modalCancelText: {
    color: colors.textPrimary,
    fontWeight: "600"
  },
  modalDelete: {
    borderRadius: 10,
    backgroundColor: "#3A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  modalDeleteText: {
    color: "#F5B8B8",
    fontWeight: "700"
  },
  modalSave: {
    borderRadius: 10,
    backgroundColor: colors.neon,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  modalAddNew: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A5260",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  modalAddNewText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 12
  },
  modalSaveText: {
    color: colors.charcoal,
    fontWeight: "700"
  }
});
