import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { scaleByWidth } from "../theme/responsive";
import { colors } from "../theme/colors";

interface ProgressSectionProps {
  progressPercent: number;
  dueDateLabel: string;
}

export const ProgressSection = ({ progressPercent, dueDateLabel }: ProgressSectionProps) => {
  const { width } = useWindowDimensions();
  const titleSize = scaleByWidth(width, 28, 0.82, 1.02);
  const percentSize = scaleByWidth(width, 56, 0.74, 1.02);
  const dueSize = scaleByWidth(width, 19, 0.82, 1.0);
  const trackHeight = scaleByWidth(width, 48, 0.84, 1.0);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { fontSize: titleSize }]}>Project Progress</Text>
      <Text style={[styles.percent, { fontSize: percentSize, lineHeight: Math.round(percentSize * 1.07) }]}>{progressPercent}%</Text>
      <View style={[styles.progressTrack, { height: trackHeight, borderRadius: Math.round(trackHeight / 2) }]}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        <Text style={[styles.dueText, { fontSize: dueSize }]}>Due {dueDateLabel}</Text>
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
    fontWeight: "500"
  },
  percent: {
    color: colors.textPrimary,
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
    marginRight: 18,
    fontWeight: "500"
  }
});
