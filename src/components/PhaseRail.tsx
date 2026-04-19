import { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

interface PhaseRailProps {
  activePhase: number;
  maxPhase: number;
  onSelectPhase: (phaseNumber: number) => void;
}

const rowHeight = 54;
const minorTicks = Array.from({ length: 7 }, (_, i) => i);

export const PhaseRail = ({ activePhase, maxPhase, onSelectPhase }: PhaseRailProps) => {
  const phases = useMemo(() => Array.from({ length: maxPhase }, (_, i) => i + 1), [maxPhase]);
  const railRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (activePhase < 1) {
      return;
    }
    const index = Math.max(0, activePhase - 1);
    const offset = Math.max(0, index * rowHeight - rowHeight * 1.5);
    const timeout = setTimeout(() => {
      railRef.current?.scrollTo({ y: offset, animated: true });
    }, 0);
    return () => clearTimeout(timeout);
  }, [activePhase]);

  return (
    <ScrollView
      ref={railRef}
      style={styles.wrapper}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      snapToInterval={rowHeight}
      decelerationRate="fast"
      scrollEventThrottle={16}
    >
      {phases.map((phase) => {
        const isActive = phase === activePhase;
        return (
          <TouchableOpacity key={phase} style={styles.phaseRow} onPress={() => onSelectPhase(phase)}>
            <Text style={[styles.phaseNumber, isActive && styles.activePhaseNumber]}>{phase}</Text>
            <View style={styles.rulerColumn}>
              <View style={[styles.rulerSpine, isActive && styles.rulerSpineActive]} />
              <View style={styles.minorTickStack}>
                {minorTicks.map((tickIndex) => (
                  <View
                    key={`${phase}-tick-${tickIndex}`}
                    style={[
                      styles.minorTick,
                      tickIndex === 3 && styles.minorTickMid,
                      isActive && styles.minorTickActive
                    ]}
                  />
                ))}
              </View>
              <View style={[styles.majorTick, isActive && styles.majorTickActive]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 70,
    paddingTop: 6,
    flexGrow: 0,
    flexShrink: 0
  },
  content: {
    alignItems: "stretch",
    paddingBottom: 16,
    paddingTop: 4
  },
  phaseRow: {
    width: 64,
    height: rowHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center"
  },
  rulerColumn: {
    width: 20,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-end"
  },
  rulerSpine: {
    position: "absolute",
    left: 3,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#2F333C"
  },
  rulerSpineActive: {
    backgroundColor: "#444B58"
  },
  minorTickStack: {
    position: "absolute",
    right: 0,
    top: 3,
    bottom: 3,
    justifyContent: "space-between"
  },
  minorTick: {
    width: 6,
    borderTopWidth: 1,
    borderTopColor: "#3A404D"
  },
  minorTickMid: {
    width: 8,
  },
  minorTickActive: {
    borderTopColor: "#4D5563"
  },
  majorTick: {
    width: 14,
    borderTopWidth: 2,
    borderTopColor: "#6A7384"
  },
  majorTickActive: {
    borderTopColor: "#C2C9D5"
  },
  phaseNumber: {
    color: "#3F4551",
    fontSize: 42,
    fontWeight: "300",
    lineHeight: 46
  },
  activePhaseNumber: {
    color: colors.neon,
    textShadowColor: colors.neon,
    textShadowRadius: 10
  },
});
