import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface PhaseRailProps {
  activePhase: number;
  maxPhase: number;
}

export const PhaseRail = ({ activePhase, maxPhase }: PhaseRailProps) => {
  const phases = Array.from({ length: maxPhase }, (_, i) => i + 1);

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {phases.map((phase) => {
        const isActive = phase === activePhase;
        return (
          <View key={phase} style={styles.phaseRow}>
            <Text style={[styles.phaseNumber, isActive && styles.activePhaseNumber]}>{phase}</Text>
            <View style={[styles.tick, isActive && styles.activeTick]} />
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 62,
    paddingTop: 12
  },
  content: {
    alignItems: "center",
    paddingBottom: 12
  },
  phaseRow: {
    width: "100%",
    height: 58,
    alignItems: "center",
    justifyContent: "center"
  },
  phaseNumber: {
    color: colors.textMuted,
    fontSize: 34,
    fontWeight: "300",
    lineHeight: 36
  },
  activePhaseNumber: {
    color: colors.neon,
    textShadowColor: colors.neon,
    textShadowRadius: 8
  },
  tick: {
    width: 14,
    borderTopWidth: 1,
    borderTopColor: colors.lineMuted,
    marginTop: 4
  },
  activeTick: {
    borderTopColor: colors.neon,
    shadowColor: colors.neon,
    shadowOpacity: 0.8,
    shadowRadius: 6
  }
});
