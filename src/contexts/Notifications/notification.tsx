import {
  IoMdClose as CloseIcon,
  IoIosAlert as ErrorIcon,
  IoIosHelp as InfoIcon,
  IoIosCheckmark as SuccessIcon,
  IoIosWarning as WarningIcon,
} from "react-icons/io";

import { Notification } from ".";

interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

export const NotificationComponent: React.FC<NotificationProps> = ({
  notification,
  onClose,
}) => {
  return (
    <div className={`notification ${notification.type}`}>
      {notification.type === "success" && <SuccessIcon size={42} />}
      {notification.type === "info" && <InfoIcon size={42} />}
      {notification.type === "warning" && <WarningIcon size={28} />}
      {notification.type === "error" && <ErrorIcon size={28} />}
      <label className="message">{notification.message}</label>
      <button onClick={onClose} className="close">
        <CloseIcon size={28} />
      </button>
    </div>
  );
};
