import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface ProgressSectionProps {
  progressPercent: number;
  dueDateLabel: string;
}

export const ProgressSection = ({ progressPercent, dueDateLabel }: ProgressSectionProps) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Project Progress</Text>
      <Text style={styles.percent}>{progressPercent}%</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(progressPercent, 8)}%` }]} />
        <Text style={styles.dueText}>Due {dueDateLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
    paddingHorizontal: 16
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "500"
  },
  percent: {
    color: colors.textPrimary,
    fontSize: 56,
    fontWeight: "700",
    lineHeight: 60
  },
  progressTrack: {
    marginTop: 6,
    height: 48,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#5C6470",
    justifyContent: "center"
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
    backgroundColor: colors.success
  },
  dueText: {
    alignSelf: "flex-end",
    color: colors.textPrimary,
    fontSize: 19,
    marginRight: 18,
    fontWeight: "500"
  }
});
