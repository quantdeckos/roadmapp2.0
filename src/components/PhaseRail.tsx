import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface PhaseRailProps {
  activePhase: number;
  maxPhase: number;
}

export const PhaseRail = ({ activePhase, maxPhase }: PhaseRailProps) => {
  const visiblePhases = Array.from({ length: 5 }, (_, i) => activePhase - 2 + i).filter(
    (phase) => phase > 0 && phase <= maxPhase
  );

  return (
    <View style={styles.wrapper}>
      {visiblePhases.map((phase) => {
        const isActive = phase === activePhase;
        return (
          <View key={phase} style={styles.phaseRow}>
            <Text style={[styles.phaseNumber, isActive && styles.activePhaseNumber]}>{phase}</Text>
            <View style={[styles.tick, isActive && styles.activeTick]} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 62,
    paddingTop: 12,
    alignItems: "center"
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
