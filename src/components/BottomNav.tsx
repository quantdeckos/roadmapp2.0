import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { TabKey } from "../types/domain";
import { scaleByWidth } from "../theme/responsive";
import { colors } from "../theme/colors";

interface BottomNavProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const BottomNav = ({ activeTab, onTabPress }: BottomNavProps) => {
  const { width } = useWindowDimensions();
  const iconSize = scaleByWidth(width, 24, 0.9, 1.06);
  const roadIconSize = scaleByWidth(width, 26, 0.9, 1.06);
  const wrapperHeight = scaleByWidth(width, 60, 0.9, 1.05);

  return (
    <View style={[styles.wrapper, { height: wrapperHeight, borderRadius: Math.round(wrapperHeight / 3) }]}>
      <NavItem icon={<Ionicons name="home-outline" size={iconSize} color={pickColor(activeTab, "home")} />} onPress={() => onTabPress("home")} />
      <NavItem
        icon={<MaterialCommunityIcons name="chart-box-outline" size={iconSize} color={pickColor(activeTab, "projects")} />}
        onPress={() => onTabPress("projects")}
      />
      <NavItem
        icon={<MaterialCommunityIcons name="road-variant" size={roadIconSize} color={pickColor(activeTab, "roadmap")} />}
        onPress={() => onTabPress("roadmap")}
      />
      <NavItem
        icon={<Ionicons name="calendar-outline" size={iconSize} color={pickColor(activeTab, "calendar")} />}
        onPress={() => onTabPress("calendar")}
      />
      <NavItem
        icon={<Ionicons name="settings-outline" size={iconSize} color={pickColor(activeTab, "settings")} />}
        onPress={() => onTabPress("settings")}
      />
    </View>
  );
};

const NavItem = ({ icon, onPress }: { icon: JSX.Element; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.navButton}>
    {icon}
  </TouchableOpacity>
);

const pickColor = (activeTab: TabKey, key: TabKey) => (activeTab === key ? colors.neon : colors.textPrimary);

const styles = StyleSheet.create({
  wrapper: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#2A313D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  }
});
