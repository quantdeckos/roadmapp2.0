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
      <View>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.card}>
          <Text style={styles.item}>Profile</Text>
          <Text style={styles.item}>Alerts</Text>
          <Text style={styles.item}>Support</Text>
        </View>
      </View>
      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 84,
    paddingBottom: 12
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
