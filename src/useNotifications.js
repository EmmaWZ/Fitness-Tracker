// useNotifications.js — manages reminder scheduling via localStorage + setInterval

export const DEFAULT_REMINDERS = [
  { id: "morning", label: "早起打卡", time: "08:00", message: "🌸 早安！今天的健身计划开始啦，加油！", enabled: true },
  { id: "water",   label: "喝水提醒", time: "13:00", message: "💧 记得喝水！今天喝够2000mL了吗？",     enabled: true },
  { id: "evening", label: "晚间运动", time: "19:00", message: "💪 该运动啦！今天的任务完成了吗？",     enabled: true },
  { id: "sleep",   label: "早睡提醒", time: "22:30", message: "🌙 准备睡觉了哦，好好休息，明天继续加油！", enabled: false },
];

export function getNextTriggerMs(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export async function requestPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function fireNotification(label, message) {
  if (Notification.permission !== "granted") return;
  new Notification(label, {
    body: message,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: label,
  });
}

// Schedule all enabled reminders using setTimeout chains
const timers = {};
export function scheduleAll(reminders) {
  // Clear existing
  Object.values(timers).forEach(clearTimeout);
  Object.keys(timers).forEach(k => delete timers[k]);

  if (Notification.permission !== "granted") return;

  reminders.forEach(r => {
    if (!r.enabled) return;
    const ms = getNextTriggerMs(r.time);
    timers[r.id] = setTimeout(() => {
      fireNotification(r.label, r.message);
      // Re-schedule for next day
      timers[r.id] = setTimeout(() => scheduleAll(reminders), 60 * 1000);
    }, ms);
  });
}
