import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav } from "../components/BottomNav";
import { scaleByWidth } from "../theme/responsive";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface CalendarScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

const scheduleData = [
  { id: "1", title: "Morning planning", time: "8:00 AM", phase: 8 },
  { id: "2", title: "Deep work sprint", time: "10:30 AM", phase: 8 },
  { id: "3", title: "Hydration reset", time: "1:00 PM", phase: 8 },
  { id: "4", title: "Budget review", time: "6:00 PM", phase: 8 }
];

export const CalendarScreen = ({ activeTab, onTabPress }: CalendarScreenProps) => {
  const [selectedDay, setSelectedDay] = useState(16);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const titleSize = scaleByWidth(width, 38, 0.8, 1.06);
  const subtitleSize = scaleByWidth(width, 16, 0.88, 1.04);
  const dayBoxWidth = Math.max(40, Math.min(50, Math.floor((width - 54) / 7)));

  const weekDays = useMemo(
    () => [
      ["Sun", 15],
      ["Mon", 16],
      ["Tue", 17],
      ["Wed", 18],
      ["Thu", 19],
      ["Fri", 20],
      ["Sat", 21]
    ],
    []
  );

  return (
    <View style={[styles.screen, { paddingTop: Math.max(16, insets.top + 6), paddingBottom: Math.max(8, insets.bottom + 4) }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: titleSize }]}>Calendar</Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Schedule your repeating phase tasks</Text>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map(([day, value]) => {
            const selected = selectedDay === value;
            return (
              <TouchableOpacity key={String(value)} onPress={() => setSelectedDay(value)} style={[styles.dayWrapper, { width: dayBoxWidth }]}>
                <Text style={[styles.dayText, selected && styles.daySelected]}>{day}</Text>
                <Text style={[styles.dateText, selected && styles.daySelected]}>{value}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
          {scheduleData.map((item) => (
            <View key={item.id} style={styles.scheduleCard}>
              <Text style={styles.scheduleTitle}>{item.title}</Text>
              <Text style={styles.scheduleMeta}>
                {item.time} • phase {item.phase}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.navDock}>
        <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8
  },
  content: {
    flex: 1,
    paddingHorizontal: 2
  },
  navDock: {
    paddingHorizontal: 2
  },
  header: {
    marginBottom: 16
  },
  title: {
    color: colors.textPrimary,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 4
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  dayWrapper: {
    alignItems: "center",
    backgroundColor: colors.panelDark,
    borderRadius: 14,
    paddingVertical: 8
  },
  dayText: {
    color: colors.textMuted,
    fontSize: 12
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700"
  },
  daySelected: {
    color: colors.neon
  },
  scheduleList: {
    flex: 1
  },
  scheduleCard: {
    backgroundColor: colors.panelDark,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },
  scheduleTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600"
  },
  scheduleMeta: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14
  }
});
