import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scaleByWidth } from "../theme/responsive";
import { colors } from "../theme/colors";

interface TopHeaderProps {
  onMenuPress: () => void;
  onNewProjectPress: () => void;
  onAskAiPress: () => void;
}

export const TopHeader = ({ onMenuPress, onNewProjectPress, onAskAiPress }: TopHeaderProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const today = new Date();
  const monthSize = scaleByWidth(width, 56, 0.74, 1.02);
  const dateSize = scaleByWidth(width, 32, 0.84, 1.0);
  const dayChipHeight = Math.max(62, Math.min(74, Math.floor(width * 0.17)));
  const searchTextSize = scaleByWidth(width, 16, 0.86, 1.02);

  const monthLabel = today.toLocaleDateString(undefined, { month: "long" });
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekItems = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + offset);
    return {
      day: weekdayLabels[date.getDay()],
      dateNumber: String(date.getDate()),
      isToday: date.toDateString() === today.toDateString()
    };
  });

  return (
    <View style={[styles.wrapper, { paddingTop: Math.max(8, insets.top + 4) }]}>
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
          <Ionicons name="menu" size={22} color={colors.charcoal} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchPill} onPress={onAskAiPress}>
          <Ionicons name="sparkles-outline" size={16} color={colors.charcoalSoft} />
          <Text style={[styles.searchText, { fontSize: searchTextSize }]}>Ask AI / Search Projects</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.charcoalSoft} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text
          style={[styles.month, { fontSize: monthSize, lineHeight: Math.round(monthSize * 1.03) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {monthLabel}
        </Text>
        <TouchableOpacity onPress={onNewProjectPress} style={styles.plusButton}>
          <Ionicons name="add" size={28} color={colors.charcoal} />
          <Text style={styles.plusLabel}>Add Phase</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {weekItems.map((item) => (
          <View
            key={`${item.day}-${item.dateNumber}`}
            style={[styles.dayItem, { height: dayChipHeight, borderRadius: Math.round(dayChipHeight / 2.8) }, item.isToday && styles.activeDay]}
          >
            <Text style={[styles.dayLabel, item.isToday && styles.activeDayText]}>{item.day}</Text>
            <Text style={[styles.dateLabel, { fontSize: dateSize, lineHeight: Math.round(dateSize * 1.08) }, item.isToday && styles.activeDayText]}>
              {item.dateNumber}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.neon,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 8,
    paddingHorizontal: 18,
    paddingBottom: 18
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  searchPill: {
    flex: 1,
    height: 44,
    backgroundColor: "#F0F2F5",
    borderRadius: 24,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  searchText: {
    color: "#454A55",
    fontWeight: "500",
    flex: 1,
    marginLeft: 8
  },
  titleRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  month: {
    color: colors.charcoal,
    fontWeight: "800",
    flexShrink: 1,
    paddingRight: 8
  },
  plusButton: {
    minHeight: 44,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  plusLabel: {
    color: colors.charcoal,
    fontSize: 11,
    fontWeight: "700",
    marginTop: -2
  },
  weekRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4
  },
  dayItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  activeDay: {
    backgroundColor: colors.charcoal
  },
  dayLabel: {
    color: colors.charcoalSoft,
    fontSize: 12,
    marginBottom: 2,
    width: "100%",
    textAlign: "center"
  },
  dateLabel: {
    color: colors.charcoalSoft,
    fontWeight: "700",
    fontSize: 36,
    lineHeight: 40,
    width: "100%",
    textAlign: "center",
    fontVariant: ["tabular-nums"]
  },
  activeDayText: {
    color: colors.neon
  }
});
