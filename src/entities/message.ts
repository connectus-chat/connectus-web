import { Group } from "./group";
import { User } from "./user";

export interface Message {
  id: string;
  content: string;
  time: Date;
  fromUserId: string;
  toUserId: string;
  fromUser: User;
  toUser: User;
}

export type Message2Create = Pick<Message, "content" | "time">;
export type OptionalMessage = Message | undefined | null;

export interface GroupMessage
  extends Pick<Message, "content" | "time" | "fromUser" | "fromUserId" | "id"> {
  groupId: string;
  group?: Group;
}

export type GroupMessage2Create = Pick<GroupMessage, "content" | "time">;
export type OptionalGroupMessage = GroupMessage | undefined | null;
