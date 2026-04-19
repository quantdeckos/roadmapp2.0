import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomNav } from "../components/BottomNav";
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
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Schedule your repeating phase tasks</Text>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map(([day, value]) => {
          const selected = selectedDay === value;
          return (
            <TouchableOpacity key={String(value)} onPress={() => setSelectedDay(value)} style={styles.dayWrapper}>
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

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
    paddingHorizontal: 18,
    paddingTop: 70,
    paddingBottom: 12
  },
  header: {
    marginBottom: 16
  },
  title: {
    color: colors.textPrimary,
    fontSize: 38,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
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
    width: 46,
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
