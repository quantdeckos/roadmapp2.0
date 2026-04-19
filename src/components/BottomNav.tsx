import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { TabKey } from "../types/domain";
import { colors } from "../theme/colors";

interface BottomNavProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const BottomNav = ({ activeTab, onTabPress }: BottomNavProps) => {
  return (
    <View style={styles.wrapper}>
      <NavItem icon={<Ionicons name="home-outline" size={24} color={pickColor(activeTab, "home")} />} onPress={() => onTabPress("home")} />
      <NavItem
        icon={<MaterialCommunityIcons name="chart-box-outline" size={24} color={pickColor(activeTab, "projects")} />}
        onPress={() => onTabPress("projects")}
      />
      <NavItem
        icon={<MaterialCommunityIcons name="road-variant" size={26} color={pickColor(activeTab, "roadmap")} />}
        onPress={() => onTabPress("roadmap")}
      />
      <NavItem
        icon={<Ionicons name="calendar-outline" size={24} color={pickColor(activeTab, "calendar")} />}
        onPress={() => onTabPress("calendar")}
      />
      <NavItem
        icon={<Ionicons name="settings-outline" size={24} color={pickColor(activeTab, "settings")} />}
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
    marginTop: 12,
    marginBottom: 8,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#1C1F26",
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
