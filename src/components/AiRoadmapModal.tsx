import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { colors } from "../theme/colors";

interface AiRoadmapModalProps {
  visible: boolean;
  generating: boolean;
  error: string | null;
  onClose: () => void;
  onGenerate: (input: { projectName: string; objective: string; phaseCount: number }) => Promise<void>;
}

export const AiRoadmapModal = ({ visible, generating, error, onClose, onGenerate }: AiRoadmapModalProps) => {
  const [projectName, setProjectName] = useState("RoadMapp AI Project");
  const [objective, setObjective] = useState("Launch and grow my product successfully.");
  const [phaseCountInput, setPhaseCountInput] = useState("12");

  const phaseCount = useMemo(() => {
    const parsed = Number(phaseCountInput);
    if (Number.isNaN(parsed)) {
      return 12;
    }
    return Math.max(1, Math.min(parsed, 30));
  }, [phaseCountInput]);

  const submit = async () => {
    await onGenerate({
      projectName: projectName.trim() || "RoadMapp AI Project",
      objective: objective.trim() || "Complete the project with measurable progress.",
      phaseCount
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => null}>
          <Text style={styles.title}>Generate Roadmap With AI</Text>
          <Text style={styles.label}>Project Name</Text>
          <TextInput value={projectName} onChangeText={setProjectName} style={styles.input} placeholder="Project name" />

          <Text style={styles.label}>Objective</Text>
          <TextInput
            value={objective}
            onChangeText={setObjective}
            style={[styles.input, styles.multilineInput]}
            placeholder="Describe your goal"
            multiline
          />

          <Text style={styles.label}>Phase Count (custom)</Text>
          <TextInput
            value={phaseCountInput}
            onChangeText={setPhaseCountInput}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="10-20"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.secondaryButton} disabled={generating}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} style={styles.primaryButton} disabled={generating}>
              {generating ? (
                <ActivityIndicator color={colors.charcoal} />
              ) : (
                <Text style={styles.primaryButtonText}>Generate</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  modal: {
    backgroundColor: colors.panelDark,
    borderRadius: 18,
    padding: 18
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14
  },
  label: {
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
    fontSize: 13
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B404D",
    backgroundColor: "#262A33",
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  multilineInput: {
    minHeight: 86,
    textAlignVertical: "top"
  },
  errorText: {
    marginTop: 10,
    color: "#FF9A7D",
    fontSize: 13
  },
  actions: {
    marginTop: 16,
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
    backgroundColor: colors.neon,
    minWidth: 94,
    alignItems: "center"
  },
  primaryButtonText: {
    color: colors.charcoal,
    fontWeight: "700"
  }
});
