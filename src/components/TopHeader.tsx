import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

interface TopHeaderProps {
  onMenuPress: () => void;
  onNewProjectPress: () => void;
  onAskAiPress: () => void;
}

export const TopHeader = ({ onMenuPress, onNewProjectPress, onAskAiPress }: TopHeaderProps) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
          <Ionicons name="menu" size={22} color={colors.charcoal} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchPill} onPress={onAskAiPress}>
          <Ionicons name="sparkles-outline" size={16} color={colors.charcoalSoft} />
          <Text style={styles.searchText}>Ask AI / Search Projects</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.charcoalSoft} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.month}>March</Text>
        <TouchableOpacity onPress={onNewProjectPress} style={styles.plusButton}>
          <Ionicons name="add" size={28} color={colors.charcoal} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {[
          ["Sun", "15"],
          ["Mon", "16"],
          ["Tue", "17"],
          ["Wed", "18"],
          ["Thu", "19"],
          ["Fri", "20"],
          ["Sat", "21"]
        ].map(([day, date], index) => (
          <View key={day} style={[styles.dayItem, index === 1 && styles.activeDay]}>
            <Text style={[styles.dayLabel, index === 1 && styles.activeDayText]}>{day}</Text>
            <Text style={[styles.dateLabel, index === 1 && styles.activeDayText]}>{date}</Text>
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
    fontSize: 16,
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
    fontSize: 56,
    fontWeight: "800"
  },
  plusButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  weekRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  dayItem: {
    width: 42,
    height: 74,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  activeDay: {
    backgroundColor: colors.charcoal
  },
  dayLabel: {
    color: colors.charcoalSoft,
    fontSize: 12,
    marginBottom: 2
  },
  dateLabel: {
    color: colors.charcoalSoft,
    fontWeight: "700",
    fontSize: 36,
    lineHeight: 40
  },
  activeDayText: {
    color: colors.neon
  }
});
