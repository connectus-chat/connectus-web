import { Socket, io } from "socket.io-client";
import { API_BASE_URL } from "../constants";

export abstract class ChatWebsocketV2<ChatIdentifier> {
  protected sessionKey: { stringKey: string; key: Uint8Array } | null;
  protected socket: Socket | null;

  constructor() {
    this.sessionKey = null;
    this.socket = null;
  }

  protected async connect(): Promise<Socket> {
    return new Promise((res, rej) => {
      const socket = io(API_BASE_URL);
      socket.on("connect", () => {
        res(socket);
      });
      socket.on("connect_error", () => {
        rej(socket);
      });
    });
  }

  abstract join(
    identifier: ChatIdentifier,
    onMessage: (message: string) => void
  ): Promise<void>;

  abstract sendMessage(
    identifier: ChatIdentifier,
    message: string
  ): Promise<void>;
}
