import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav } from "../components/BottomNav";
import { scaleByWidth } from "../theme/responsive";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface SettingsScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const SettingsScreen = ({ activeTab, onTabPress }: SettingsScreenProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const titleSize = scaleByWidth(width, 36, 0.82, 1.08);
  const itemSize = scaleByWidth(width, 17, 0.88, 1.05);

  return (
    <View style={[styles.screen, { paddingTop: Math.max(18, insets.top + 8), paddingBottom: Math.max(8, insets.bottom + 4) }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: titleSize }]}>Settings</Text>
        <View style={styles.card}>
          <Text style={[styles.item, { fontSize: itemSize }]}>Profile</Text>
          <Text style={[styles.item, { fontSize: itemSize }]}>Alerts</Text>
          <Text style={[styles.item, { fontSize: itemSize }]}>Support</Text>
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
    paddingTop: 24,
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
    paddingVertical: 10
  }
});
