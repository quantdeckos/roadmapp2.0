import * as DocumentPicker from "expo-document-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { colors } from "../theme/colors";

type PickerField = "date" | "dueDate" | "time";

interface TaskDraft {
  title: string;
  description: string;
  details: string;
  location: string;
  date: string;
  time: string;
  dueDate: string;
  tags: string[];
  tagInput: string;
  attachments: { name: string; uri: string }[];
}

interface PhaseBuilderModalProps {
  visible: boolean;
  nextPhaseNumber: number;
  onClose: () => void;
  onCreate: (input: {
    tasks: {
      title: string;
      description?: string;
      details?: string;
      location?: string;
      date?: string;
      time?: string;
      tags?: string[];
      dueDate?: string;
      attachments?: { name: string; uri: string }[];
    }[];
  }) => void;
}

const pastelTagColors = ["#FBD5E5", "#D7F3E3", "#DCE8FF", "#FDECC8", "#E7D9FF", "#FFD9C9"];
const addressSuggestions = [
  "1600 Amphitheatre Pkwy, Mountain View, CA 94043",
  "1 Apple Park Way, Cupertino, CA 95014",
  "350 Fifth Avenue, New York, NY 10118",
  "405 Lexington Ave, New York, NY 10174",
  "233 S Wacker Dr, Chicago, IL 60606",
  "111 S Grand Ave, Los Angeles, CA 90012",
  "500 S Buena Vista St, Burbank, CA 91521",
  "200 Park Ave, New York, NY 10166",
  "2211 N First St, San Jose, CA 95131",
  "600 Congress Ave, Austin, TX 78701"
];

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

const createDraft = (): TaskDraft => ({
  title: "",
  description: "",
  details: "",
  location: "",
  date: "",
  time: "",
  dueDate: "",
  tags: [],
  tagInput: "",
  attachments: []
});

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

export const PhaseBuilderModal = ({ visible, nextPhaseNumber, onClose, onCreate }: PhaseBuilderModalProps) => {
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([createDraft()]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [pickerTaskIndex, setPickerTaskIndex] = useState<number | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [activeLocationIndex, setActiveLocationIndex] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
  const [timeHour, setTimeHour] = useState(9);
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");

  const tagInputRefs = useRef<Record<number, TextInput | null>>({});
  const hourWheelRef = useRef<ScrollView | null>(null);
  const minuteWheelRef = useRef<ScrollView | null>(null);
  const periodWheelRef = useRef<ScrollView | null>(null);

  const canSubmit = useMemo(() => taskDrafts.some((task) => task.title.trim().length > 0), [taskDrafts]);
  const calendarGrid = useMemo(() => buildCalendarGrid(calendarMonth), [calendarMonth]);
  const pickerTask = pickerTaskIndex !== null ? taskDrafts[pickerTaskIndex] : null;
  const pickerMinDate = useMemo(() => {
    const today = startOfToday();
    if (!pickerTask || !pickerField) {
      return today;
    }
    if (pickerField === "dueDate") {
      const taskDate = parseDateValue(pickerTask.date);
      if (taskDate && isBeforeDate(today, taskDate)) {
        return normalizeDate(taskDate);
      }
    }
    return today;
  }, [pickerField, pickerTask]);

  useEffect(() => {
    if (pickerField !== "time") {
      return;
    }
    const timeout = setTimeout(() => {
      hourWheelRef.current?.scrollTo({ y: (timeHour - 1) * wheelRowHeight, animated: false });
      minuteWheelRef.current?.scrollTo({ y: Number(timeMinute) * wheelRowHeight, animated: false });
      periodWheelRef.current?.scrollTo({ y: (timePeriod === "AM" ? 0 : 1) * wheelRowHeight, animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [pickerField, timeHour, timeMinute, timePeriod]);

  const updateTask = (index: number, key: keyof TaskDraft, value: string) => {
    setTaskDrafts((prev) => prev.map((task, i) => (i === index ? { ...task, [key]: value } : task)));
  };

  const resetForm = () => {
    setTaskDrafts([createDraft()]);
    setValidationError(null);
    setPickerField(null);
    setPickerTaskIndex(null);
    setActiveLocationIndex(null);
    setCalendarSelectedDate(null);
    setCalendarMonth(new Date());
    setTimeHour(9);
    setTimeMinute("00");
    setTimePeriod("AM");
    setPickerError(null);
  };

  const addTag = (taskIndex: number) => {
    setTaskDrafts((prev) =>
      prev.map((task, i) => {
        if (i !== taskIndex) {
          return task;
        }
        const cleanTag = task.tagInput.trim().replace(/^#/, "");
        if (!cleanTag) {
          return task;
        }
        if (task.tags.includes(cleanTag)) {
          return { ...task, tagInput: "" };
        }
        return { ...task, tags: [...task.tags, cleanTag], tagInput: "" };
      })
    );
    requestAnimationFrame(() => {
      tagInputRefs.current[taskIndex]?.focus();
    });
  };

  const removeTag = (taskIndex: number, tag: string) => {
    setTaskDrafts((prev) =>
      prev.map((task, i) => (i === taskIndex ? { ...task, tags: task.tags.filter((item) => item !== tag) } : task))
    );
  };

  const openPicker = (taskIndex: number, field: PickerField) => {
    setPickerError(null);
    setPickerTaskIndex(taskIndex);
    setPickerField(field);

    if (field === "time") {
      const parsed = parseTimeValue(taskDrafts[taskIndex]?.time);
      setTimeHour(parsed.hour);
      setTimeMinute(parsed.minute);
      setTimePeriod(parsed.period);
      return;
    }

    const currentValue = field === "date" ? taskDrafts[taskIndex]?.date : taskDrafts[taskIndex]?.dueDate;
    const rawDate = parseDateValue(currentValue) ?? new Date();
    const today = startOfToday();
    const minDate =
      field === "dueDate" && taskDrafts[taskIndex]?.date
        ? (() => {
            const taskDate = parseDateValue(taskDrafts[taskIndex]?.date);
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

  const applyPickerValue = (value: string) => {
    if (pickerTaskIndex === null || !pickerField) {
      return;
    }
    setTaskDrafts((prev) =>
      prev.map((task, idx) => {
        if (idx !== pickerTaskIndex) {
          return task;
        }
        if (pickerField === "date") {
          const nextTask = { ...task, date: value };
          const nextDate = parseDateValue(value);
          const dueDate = parseDateValue(task.dueDate);
          if (nextDate && dueDate && isBeforeDate(dueDate, nextDate)) {
            nextTask.dueDate = value;
          }
          if (task.time && isPastTimeForDate(value, parseTimeValue(task.time).hour, parseTimeValue(task.time).minute, parseTimeValue(task.time).period)) {
            nextTask.time = "";
          }
          return nextTask;
        }
        if (pickerField === "dueDate") {
          const nextDueDate = parseDateValue(value);
          const taskDate = parseDateValue(task.date);
          if (nextDueDate && taskDate && isBeforeDate(nextDueDate, taskDate)) {
            return { ...task, dueDate: formatDate(taskDate) };
          }
          return { ...task, dueDate: value };
        }
        return { ...task, time: value };
      })
    );
    setPickerError(null);
    setPickerField(null);
    setPickerTaskIndex(null);
  };

  const pickAndAttachFile = async (taskIndex: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || result.assets.length === 0) {
        return;
      }
      const file = result.assets[0];
      const name = file.name || "Attachment";
      const uri = file.uri;
      setTaskDrafts((prev) =>
        prev.map((task, i) => (i === taskIndex ? { ...task, attachments: [...task.attachments, { name, uri }] } : task))
      );
    } catch {
      // no-op
    }
  };

  const submit = () => {
    if (!canSubmit) {
      setValidationError("Add at least one task title.");
      return;
    }

    onCreate({
      tasks: taskDrafts
        .filter((task) => task.title.trim().length > 0)
        .map((task) => ({
          title: task.title.trim(),
          description: task.description.trim() || undefined,
          details: task.details.trim() || undefined,
          location: task.location.trim() || undefined,
          date: task.date.trim() || undefined,
          time: task.time.trim() || undefined,
          tags: task.tags,
          dueDate: task.dueDate.trim() || undefined,
          attachments: task.attachments
        }))
    });

    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => null}>
          <Text style={styles.title}>Create Phase {nextPhaseNumber}</Text>

          <ScrollView style={styles.tasksScroll} showsVerticalScrollIndicator={false}>
            {taskDrafts.map((task, index) => (
              <View key={`task-draft-${index}`} style={styles.taskBlock}>
                <Text style={styles.taskBlockTitle}>Task {index + 1}</Text>
                <TextInput
                  value={task.title}
                  onChangeText={(value) => updateTask(index, "title", value)}
                  style={styles.input}
                  placeholder="Task title"
                  placeholderTextColor="#737A89"
                />
                <TextInput
                  value={task.description}
                  onChangeText={(value) => updateTask(index, "description", value)}
                  style={styles.input}
                  placeholder="Description"
                  placeholderTextColor="#737A89"
                />
                <TextInput
                  value={task.details}
                  onChangeText={(value) => updateTask(index, "details", value)}
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Details"
                  placeholderTextColor="#737A89"
                  multiline
                />
                <TextInput
                  value={task.location}
                  onChangeText={(value) => updateTask(index, "location", value)}
                  onFocus={() => setActiveLocationIndex(index)}
                  onBlur={() => {
                    if (activeLocationIndex === index) {
                      setActiveLocationIndex(null);
                    }
                  }}
                  style={styles.input}
                  placeholder="Location"
                  placeholderTextColor="#737A89"
                />
                {activeLocationIndex === index && task.location.trim().length >= 1 ? (
                  <View style={styles.suggestionWrap}>
                    {(addressSuggestions.filter((address) =>
                      address.toLowerCase().includes(task.location.toLowerCase())
                    ).length > 0
                      ? addressSuggestions.filter((address) =>
                          address.toLowerCase().includes(task.location.toLowerCase())
                        )
                      : addressSuggestions)
                      .slice(0, 5)
                      .map((address) => (
                        <TouchableOpacity
                          key={`${index}-${address}`}
                          style={styles.suggestionItem}
                          onPress={() => {
                            updateTask(index, "location", address);
                            setActiveLocationIndex(null);
                          }}
                        >
                          <Text style={styles.suggestionText}>{address}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                ) : null}

                <View style={styles.row}>
                  <TouchableOpacity style={[styles.inputButton, styles.halfInput]} onPress={() => openPicker(index, "date")}>
                    <Text style={task.date ? styles.inputButtonValue : styles.inputButtonPlaceholder}>
                      {task.date || "Pick date"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.inputButton, styles.halfInput]} onPress={() => openPicker(index, "time")}>
                    <Text style={task.time ? styles.inputButtonValue : styles.inputButtonPlaceholder}>
                      {task.time || "Pick time"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.inputButton} onPress={() => openPicker(index, "dueDate")}>
                  <Text style={task.dueDate ? styles.inputButtonValue : styles.inputButtonPlaceholder}>
                    {task.dueDate || "Pick due date"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.tagsWrap}>
                  {task.tags.map((tag, tagIndex) => (
                    <TouchableOpacity
                      key={`${tag}-${tagIndex}`}
                      onPress={() => removeTag(index, tag)}
                      style={[styles.tagChip, { backgroundColor: pastelTagColors[tagIndex % pastelTagColors.length] }]}
                    >
                      <Text style={styles.tagText}>#{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  ref={(ref) => {
                    tagInputRefs.current[index] = ref;
                  }}
                  value={task.tagInput}
                  onChangeText={(value) => updateTask(index, "tagInput", value)}
                  onSubmitEditing={() => addTag(index)}
                  blurOnSubmit={false}
                  style={styles.input}
                  placeholder="Type tag and press Enter"
                  placeholderTextColor="#737A89"
                  returnKeyType="done"
                />
                {task.attachments.length > 0 ? (
                  <Text style={styles.attachmentMeta}>Files: {task.attachments.map((file) => file.name).join(", ")}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    void pickAndAttachFile(index);
                  }}
                >
                  <Text style={styles.uploadButtonText}>Upload file</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={() => setTaskDrafts((prev) => [...prev, createDraft()])} style={styles.addTaskButton}>
              <Text style={styles.addTaskButtonText}>+ Add another task</Text>
            </TouchableOpacity>
          </ScrollView>

          {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}>
              <Text style={styles.primaryButtonText}>Create phase</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>

      <Modal visible={pickerField !== null} transparent animationType="fade" onRequestClose={() => setPickerField(null)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setPickerField(null)}>
          <Pressable style={styles.pickerModal} onPress={() => null}>
            <Text style={styles.pickerTitle}>
              {pickerField === "time" ? "Select Time" : pickerField === "dueDate" ? "Select Due Date" : "Select Date"}
            </Text>

            {pickerField === "time" ? (
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
                          setPickerError(null);
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
            {pickerError ? <Text style={styles.pickerErrorText}>{pickerError}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => applyPickerValue("")}>
                <Text style={styles.secondaryButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  if (pickerField === "time") {
                    if (pickerTask?.date && isPastTimeForDate(pickerTask.date, timeHour, timeMinute, timePeriod)) {
                      setPickerError("Past times are blocked for today.");
                      return;
                    }
                    applyPickerValue(`${timeHour}:${timeMinute} ${timePeriod}`);
                    return;
                  }
                  if (calendarSelectedDate) {
                    if (isBeforeDate(calendarSelectedDate, pickerMinDate)) {
                      setPickerError("Past dates are blocked.");
                      return;
                    }
                    applyPickerValue(formatDate(calendarSelectedDate));
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  modal: {
    backgroundColor: colors.panelDark,
    borderRadius: 18,
    padding: 16,
    maxHeight: "88%"
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700"
  },
  tasksScroll: {
    marginTop: 10
  },
  taskBlock: {
    backgroundColor: "#232732",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  taskBlockTitle: {
    color: colors.neon,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  halfInput: {
    flex: 1
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B404D",
    backgroundColor: "#262A33",
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8
  },
  inputButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B404D",
    backgroundColor: "#262A33",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8
  },
  inputButtonPlaceholder: {
    color: "#737A89"
  },
  inputButtonValue: {
    color: colors.neon,
    fontWeight: "700"
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: "top"
  },
  suggestionWrap: {
    marginTop: -4,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B404D",
    overflow: "hidden"
  },
  suggestionItem: {
    backgroundColor: "#262A33",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#343A47"
  },
  suggestionText: {
    color: colors.textPrimary,
    fontSize: 12
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8
  },
  tagChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  tagText: {
    color: "#2A2E38",
    fontSize: 12,
    fontWeight: "700"
  },
  attachmentMeta: {
    color: "#C9D0DE",
    fontSize: 12,
    marginBottom: 8
  },
  uploadButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A5260",
    paddingVertical: 9,
    alignItems: "center",
    marginBottom: 8
  },
  uploadButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13
  },
  addTaskButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A5260",
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2
  },
  addTaskButtonText: {
    color: colors.textPrimary,
    fontWeight: "600"
  },
  errorText: {
    marginTop: 8,
    color: "#FF9A7D",
    fontSize: 13
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10
  },
  secondaryButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#2A2E38"
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "600"
  },
  primaryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.neon
  },
  primaryButtonDisabled: {
    opacity: 0.55
  },
  primaryButtonText: {
    color: colors.charcoal,
    fontWeight: "700"
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    justifyContent: "center",
    paddingHorizontal: 22
  },
  pickerModal: {
    backgroundColor: colors.panelDark,
    borderRadius: 16,
    padding: 14
  },
  pickerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700"
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
  }
});
