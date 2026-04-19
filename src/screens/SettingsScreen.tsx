import { StyleSheet, Text, View } from "react-native";
import { BottomNav } from "../components/BottomNav";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface SettingsScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const SettingsScreen = ({ activeTab, onTabPress }: SettingsScreenProps) => {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.card}>
          <Text style={styles.item}>Profile</Text>
          <Text style={styles.item}>Alerts</Text>
          <Text style={styles.item}>Support</Text>
        </View>
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
    paddingTop: 84,
    paddingBottom: 8
  },
  content: {
    flex: 1,
    paddingHorizontal: 2
  },
  navDock: {
    paddingHorizontal: 2
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "700"
  },
  card: {
    marginTop: 16,
    backgroundColor: colors.panelDark,
    borderRadius: 14,
    padding: 14
  },
  item: {
    color: colors.textPrimary,
    fontSize: 17,
    paddingVertical: 10
  }
});
