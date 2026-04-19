import { StyleSheet, Text, View } from "react-native";
import { BottomNav } from "../components/BottomNav";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface ProjectsScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const ProjectsScreen = ({ activeTab, onTabPress }: ProjectsScreenProps) => {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Projects</Text>
        <Text style={styles.subtitle}>Create, duplicate, archive, and search roadmap projects.</Text>
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
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    marginTop: 10
  }
});
