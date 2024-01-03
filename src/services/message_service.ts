import { api } from "../api";
import { Message } from "../entities/message";
import { LOCAL_AUTH } from "./user_service";

export class MessageService {
  async fetchAll(friendId: string) {
    const id = sessionStorage.getItem(LOCAL_AUTH);
    const { data } = await api.get<Message[]>(
      `/users/${id}/${friendId}/messages`
    );
    return data;
  }
}
