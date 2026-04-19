import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { AiRoadmapModal } from "../components/AiRoadmapModal";
import { BottomNav } from "../components/BottomNav";
import { PhaseRail } from "../components/PhaseRail";
import { ProgressSection } from "../components/ProgressSection";
import { TaskList } from "../components/TaskList";
import { TopHeader } from "../components/TopHeader";
import { useRoadmap } from "../state/useRoadmap";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface RoadmapScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const RoadmapScreen = ({ activeTab, onTabPress }: RoadmapScreenProps) => {
  const {
    project,
    currentPhase,
    nextPhaseLocked,
    progressPercent,
    loading,
    syncError,
    generatingAiProject,
    aiGenerationError,
    toggleTask,
    moveToNextPhase,
    generateProjectWithAi
  } = useRoadmap();
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const phaseTransition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    phaseTransition.setValue(24);
    Animated.timing(phaseTransition, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true
    }).start();
  }, [currentPhase.number, phaseTransition]);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopHeader
          onMenuPress={() => {}}
          onNewProjectPress={() => setAiModalVisible(true)}
          onAskAiPress={() => setAiModalVisible(true)}
        />
        {loading ? <Text style={styles.infoText}>Syncing project from Supabase...</Text> : null}
        {syncError ? <Text style={styles.errorText}>Sync warning: {syncError}</Text> : null}

        <View style={styles.roadmapCard}>
          <PhaseRail activePhase={currentPhase.number} maxPhase={project.phases.length} />
          <Animated.View style={[styles.tasksContainer, { transform: [{ translateY: phaseTransition }] }]}>
            <TaskList
              phase={currentPhase}
              nextPhaseLocked={nextPhaseLocked}
              onToggleTask={toggleTask}
              onMoveToNextPhase={moveToNextPhase}
            />
          </Animated.View>
        </View>

        <ProgressSection progressPercent={progressPercent} dueDateLabel={project.dueDateLabel} />
        <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
      </ScrollView>
      <AiRoadmapModal
        visible={aiModalVisible}
        generating={generatingAiProject}
        error={aiGenerationError}
        onClose={() => setAiModalVisible(false)}
        onGenerate={async (input) => {
          const created = await generateProjectWithAi(input);
          if (created) {
            setAiModalVisible(false);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingBottom: 20
  },
  roadmapCard: {
    marginTop: 12,
    marginHorizontal: 14,
    flexDirection: "row",
    backgroundColor: colors.charcoalSoft,
    borderRadius: 30,
    padding: 10,
    minHeight: 420
  },
  infoText: {
    color: colors.textMuted,
    marginTop: 12,
    marginHorizontal: 18,
    fontSize: 14
  },
  errorText: {
    color: "#FF9A7D",
    marginTop: 6,
    marginHorizontal: 18,
    fontSize: 13
  },
  tasksContainer: {
    flex: 1
  }
});
