import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export const requestNotificationPermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    await Notifications.requestPermissionsAsync();
  }
};

export const scheduleDailyRoadmapReminder = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "RoadMapp",
      body: "Complete your current phase tasks to unlock the next phase."
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true
    }
  });
};
