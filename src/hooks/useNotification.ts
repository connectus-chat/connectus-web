import { useContext } from "react";
import { NotificationContext } from "../contexts/Notifications";

export function useNotification() {
  const { clearAllNotifications, pushNotification, removeNotification } =
    useContext(NotificationContext);
  return {
    clearAllNotifications,
    pushNotification,
    removeNotification,
  };
}
