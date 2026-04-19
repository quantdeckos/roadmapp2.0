import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { AiRoadmapModal } from "../components/AiRoadmapModal";
import { BottomNav } from "../components/BottomNav";
import { PhaseBuilderModal } from "../components/PhaseBuilderModal";
import { PhaseRail } from "../components/PhaseRail";
import { ProgressSection } from "../components/ProgressSection";
import { TaskList } from "../components/TaskList";
import { TopHeader } from "../components/TopHeader";
import { useRoadmap } from "../state/useRoadmap";
import { scaleByWidth } from "../theme/responsive";
import { colors } from "../theme/colors";
import { TabKey } from "../types/domain";

interface RoadmapScreenProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const RoadmapScreen = ({ activeTab, onTabPress }: RoadmapScreenProps) => {
  const { width } = useWindowDimensions();
  const cardRadius = scaleByWidth(width, 30, 0.82, 1.0);

  const {
    project,
    currentPhase,
    nextPhaseLocked,
    progressPercent,
    currentPhaseElapsedSeconds,
    loading,
    syncError,
    generatingAiProject,
    aiGenerationError,
    toggleTask,
    moveToNextPhase,
    selectPhase,
    updateTask,
    deleteTaskFromPhase,
    addTaskAttachment,
    addTaskToPhase,
    archiveCurrentProject,
    startNewProject,
    generateProjectWithAi,
    addPhaseWithTasks
  } = useRoadmap();
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [phaseBuilderVisible, setPhaseBuilderVisible] = useState(false);
  const phaseTransition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    phaseTransition.setValue(24);
    Animated.timing(phaseTransition, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true
    }).start();
  }, [currentPhase?.number, phaseTransition]);

  const allPhasesComplete =
    project.phases.length > 0 &&
    project.phases.every((phase) => phase.tasks.length > 0 && phase.tasks.every((task) => task.completed));

  return (
    <View style={styles.screen}>
      <TopHeader
        onMenuPress={() => {}}
        onNewProjectPress={() => setPhaseBuilderVisible(true)}
        onAskAiPress={() => setAiModalVisible(true)}
      />
      {loading ? <Text style={styles.infoText}>Syncing project from Supabase...</Text> : null}
      {syncError ? <Text style={styles.errorText}>Sync warning: {syncError}</Text> : null}

      <View style={styles.middleSection}>
        <View style={[styles.roadmapCard, { borderRadius: cardRadius }]}>
          {currentPhase ? (
            <PhaseRail
              activePhase={currentPhase.number}
              maxPhase={project.phases.length}
              onSelectPhase={selectPhase}
            />
          ) : null}
          <Animated.View style={[styles.tasksContainer, { transform: [{ translateY: phaseTransition }] }]}>
            <TaskList
              phase={currentPhase}
              phaseElapsedSeconds={currentPhaseElapsedSeconds}
              nextPhaseLocked={nextPhaseLocked}
              onToggleTask={toggleTask}
              onMoveToNextPhase={moveToNextPhase}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTaskFromPhase}
              onUploadTaskFile={addTaskAttachment}
              onAddTaskToPhase={addTaskToPhase}
              onStartRoadmap={() => setPhaseBuilderVisible(true)}
              showCompletionActions={allPhasesComplete}
              onArchiveProject={archiveCurrentProject}
              onStartNewProject={() => {
                startNewProject();
                setPhaseBuilderVisible(true);
              }}
            />
          </Animated.View>
        </View>
      </View>
      <View style={styles.progressDock}>
        <ProgressSection progressPercent={progressPercent} dueDateLabel={project.dueDateLabel} />
      </View>
      <View style={styles.navDock}>
        <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
      </View>
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
      <PhaseBuilderModal
        visible={phaseBuilderVisible}
        nextPhaseNumber={project.phases.length + 1}
        onClose={() => setPhaseBuilderVisible(false)}
        onCreate={(input) => addPhaseWithTasks(input)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.charcoal,
    paddingBottom: 8
  },
  middleSection: {
    flex: 1,
    minHeight: 0,
    paddingBottom: 0
  },
  roadmapCard: {
    marginTop: 12,
    marginHorizontal: 14,
    flexDirection: "row",
    backgroundColor: colors.charcoalSoft,
    borderRadius: 30,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 10,
    flex: 1,
    overflow: "hidden"
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
  navDock: {
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 16
  },
  progressDock: {
    marginTop: 10
  },
  tasksContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    marginLeft: 6
  }
});
