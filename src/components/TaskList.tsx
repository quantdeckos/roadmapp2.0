import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RoadmapPhase } from "../types/domain";
import { colors } from "../theme/colors";

interface TaskListProps {
  phase: RoadmapPhase;
  nextPhaseLocked: boolean;
  onToggleTask: (taskId: string) => void;
  onMoveToNextPhase: () => void;
}

export const TaskList = ({ phase, nextPhaseLocked, onToggleTask, onMoveToNextPhase }: TaskListProps) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.phaseTitleRow}>
        <View style={styles.dot} />
        <Text style={styles.phaseTitle}>phase {phase.number}</Text>
      </View>

      <View style={styles.taskStack}>
        {phase.tasks.map((task) => (
          <TouchableOpacity key={task.id} onPress={() => onToggleTask(task.id)} style={styles.taskRow}>
            <View style={[styles.circle, task.completed && styles.circleDone]}>
              {task.completed ? <Ionicons name="checkmark" size={14} color={colors.charcoal} /> : null}
            </View>
            <View>
              <Text style={[styles.taskText, task.completed && styles.taskDone]}>{task.title} {task.exp} exp</Text>
              <Text style={styles.taskMeta}>
                {task.category} • {task.durationMinutes}min • repeat until done
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={onMoveToNextPhase}
        disabled={nextPhaseLocked}
        style={[styles.nextButton, nextPhaseLocked && styles.nextButtonLocked]}
      >
        <Text style={[styles.nextButtonText, nextPhaseLocked && styles.nextButtonTextLocked]}>
          {nextPhaseLocked ? "Complete all tasks to unlock phase" : "Move to next phase"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.panelDark,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  phaseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
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
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "700"
  },
  taskStack: {
    gap: 16
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
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
    fontSize: 17,
    fontWeight: "500"
  },
  taskDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted
  },
  taskMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3
  },
  nextButton: {
    marginTop: 20,
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
  }
});
