// notifications.ts — browser notification utility.
//
// HOW IT WORKS:
//
// 1. Check if the browser supports notifications (not all do)
// 2. Request permission if not already granted
// 3. Given a list of today's modules with start times, calculate
//    which ones are coming up within the reminder window
// 4. Schedule a setTimeout for each, firing a native OS notification
//    at (start_time - reminder_minutes)
//
// IMPORTANT: setTimeout IDs are returned so the caller can clear
// them if the component unmounts (prevents memory leaks and
// duplicate notifications on re-render).

/**
 * Check if the browser supports notifications.
 */
export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Request notification permission. Returns the permission state.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

/**
 * Get the current permission state without prompting.
 */
export function getPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Show a notification immediately.
 */
export function showNotification(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
}

interface SchedulableModule {
  id: string;
  title: string;
  start_time: string | null; // HH:MM
  is_completed: boolean;
  domain?: { name: string } | null;
}

/**
 * Schedule notifications for upcoming modules.
 *
 * For each uncompleted module with a start_time within the next
 * (reminderMinutes) window, schedules a setTimeout that fires
 * a notification at (start_time - reminderMinutes).
 *
 * Returns an array of timeout IDs for cleanup.
 */
export function scheduleNotifications(
  modules: SchedulableModule[],
  reminderMinutes: number = 30
): number[] {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    return [];
  }

  const now = new Date();
  const timeoutIds: number[] = [];

  for (const mod of modules) {
    // Skip completed modules and those without a start time
    if (mod.is_completed || !mod.start_time) continue;

    // Parse start_time (HH:MM) into today's Date
    const [hours, minutes] = mod.start_time.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    // Calculate when the reminder should fire
    const reminderDate = new Date(startDate.getTime() - reminderMinutes * 60000);

    // How many ms from now until the reminder should fire
    const msUntilReminder = reminderDate.getTime() - now.getTime();

    // Only schedule if the reminder time is in the future
    // (but the module hasn't started yet)
    const msUntilStart = startDate.getTime() - now.getTime();

    if (msUntilStart > 0 && msUntilReminder > 0) {
      // Reminder fires before start
      const id = window.setTimeout(() => {
        const domainName = mod.domain?.name || "";
        showNotification(
          `${domainName ? domainName + ": " : ""}${mod.title}`,
          `Starting in ${reminderMinutes} minutes`
        );
      }, msUntilReminder);
      timeoutIds.push(id);
    } else if (msUntilStart > 0 && msUntilReminder <= 0) {
      // Reminder time has passed but module hasn't started yet —
      // show notification immediately as a "starting soon" alert
      const minutesLeft = Math.round(msUntilStart / 60000);
      if (minutesLeft > 0 && minutesLeft <= reminderMinutes) {
        const id = window.setTimeout(() => {
          const domainName = mod.domain?.name || "";
          showNotification(
            `${domainName ? domainName + ": " : ""}${mod.title}`,
            `Starting in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}`
          );
        }, 1000); // 1 second delay so the page finishes loading
        timeoutIds.push(id);
      }
    }
  }

  return timeoutIds;
}
