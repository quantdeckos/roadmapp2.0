import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav } from "../components/BottomNav";
import { scaleByWidth } from "../theme/responsive";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface ProjectsScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const ProjectsScreen = ({ activeTab, onTabPress }: ProjectsScreenProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const titleSize = scaleByWidth(width, 36, 0.82, 1.08);
  const subtitleSize = scaleByWidth(width, 18, 0.85, 1.08);

  return (
    <View style={[styles.screen, { paddingTop: Math.max(18, insets.top + 8), paddingBottom: Math.max(8, insets.bottom + 4) }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: titleSize }]}>Projects</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Create, duplicate, archive, and search roadmap projects.</Text>
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
  subtitle: {
    color: colors.textMuted,
    marginTop: 10
  }
});
