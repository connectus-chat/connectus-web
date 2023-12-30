import { createContext, useState } from "react";
import { NotificationComponent } from "./notification";

import "./styles.css";

interface Props {
  children: React.ReactNode[] | React.ReactNode;
}

export interface Notification {
  type: "info" | "success" | "error" | "warning";
  message: string;
}

interface Context {
  pushNotification: (notification: Notification | Notification[]) => void;
  clearAllNotifications: () => void;
  removeNotification: (id: number) => void;
}

export const NotificationContext = createContext<Context>({
  clearAllNotifications: () => {},
  pushNotification: () => {},
  removeNotification: () => {},
});

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function pushNotification(notification: Notification | Notification[]) {
    if (Array.isArray(notification)) {
      setNotifications([...notifications, ...notification]);
    } else {
      setNotifications([...notifications, notification]);
    }
  }

  function clearAllNotifications() {
    setNotifications([]);
  }

  function removeNotification(id: number) {
    const updatedNotifications = notifications.filter(
      (_, index) => index !== id
    );
    setNotifications(updatedNotifications);
  }

  function renderNotification(notification: Notification, index: number) {
    return (
      <NotificationComponent
        onClose={() => removeNotification(index)}
        key={index}
        notification={notification}
      />
    );
  }

  return (
    <NotificationContext.Provider
      value={{ clearAllNotifications, pushNotification, removeNotification }}
    >
      {children}
      <ul className="notification-stack">
        {notifications.map(renderNotification)}
      </ul>
    </NotificationContext.Provider>
  );
};
