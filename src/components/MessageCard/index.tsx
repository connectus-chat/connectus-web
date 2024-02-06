import { Message } from "../../entities/message";
import { formatDate } from "./format_date";
import "./styles.css";

interface Props {
  message: Pick<Message, "content" | "time">;
  isMine?: boolean;
  name: string;
  showName?: boolean;
}

export const MessageCard: React.FC<Props> = ({
  isMine = false,
  message,
  showName = false,
  name,
}) => {
  return (
    <li
      className={`message-card ${isMine ? "me" : ""} ${
        showName ? "show-name" : ""
      }`}
    >
      <label className="name">{name}</label>
      <p className="content">{message.content}</p>
      <span className="datetime">{formatDate(message.time)}</span>
    </li>
  );
};
