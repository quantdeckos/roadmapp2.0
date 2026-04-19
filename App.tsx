import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ProjectsScreen } from "./src/screens/ProjectsScreen";
import { RoadmapScreen } from "./src/screens/RoadmapScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { requestNotificationPermissions, scheduleDailyRoadmapReminder } from "./src/services/notifications";
import { colors } from "./src/theme/colors";
import { TabKey } from "./src/types/domain";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("roadmap");

  useEffect(() => {
    const setupNotifications = async () => {
      await requestNotificationPermissions();
      await scheduleDailyRoadmapReminder();
    };
    setupNotifications().catch(() => null);
  }, []);

  const activeScreen = useMemo(() => {
    switch (activeTab) {
      case "home":
        return <HomeScreen activeTab={activeTab} onTabPress={setActiveTab} />;
      case "projects":
        return <ProjectsScreen activeTab={activeTab} onTabPress={setActiveTab} />;
      case "calendar":
        return <CalendarScreen activeTab={activeTab} onTabPress={setActiveTab} />;
      case "settings":
        return <SettingsScreen activeTab={activeTab} onTabPress={setActiveTab} />;
      case "roadmap":
      default:
        return <RoadmapScreen activeTab={activeTab} onTabPress={setActiveTab} />;
    }
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>{activeScreen}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.charcoal
  },
  container: {
    flex: 1
  }
});
