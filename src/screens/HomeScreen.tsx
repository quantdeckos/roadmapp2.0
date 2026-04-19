import { StyleSheet, Text, View } from "react-native";
import { BottomNav } from "../components/BottomNav";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface HomeScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const HomeScreen = ({ activeTab, onTabPress }: HomeScreenProps) => {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>AI highlights and today summary will live here.</Text>
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
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    marginTop: 10
  }
});
