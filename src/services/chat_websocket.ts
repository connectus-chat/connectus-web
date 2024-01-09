import { Socket, io } from "socket.io-client";
import { API_BASE_URL } from "../constants";
import { AsymmetricKeyService } from "./asymmetric_key_service";
import { SymmetricKeyService } from "./symmetric_key_service";

export class ChatWebsocket {
  private sessionKey: string | null;
  private socket: Socket | null;
  private asymmetricService = new AsymmetricKeyService();
  private symmetricService = new SymmetricKeyService();

  constructor() {
    this.sessionKey = null;
    this.socket = null;
  }

  private async connect(): Promise<Socket> {
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

  private async getSessionKey(
    id: string,
    friendId: string
  ): Promise<string | null> {
    return new Promise((res, rej) => {
      // wait for a session key
      this.socket?.on(
        "set-session-key",
        async (data: { encryptedSessionKey: string }) => {
          try {
            // get private key
            const privateKey = await this.asymmetricService.findPrivateKey(id);

            // decrypt session key using private key
            if (!privateKey) throw new Error("Private key not found");
            this.sessionKey = await this.asymmetricService.decrypt(
              privateKey,
              data.encryptedSessionKey
            );
            res(this.sessionKey);
          } catch (error) {
            console.error("[WS] Error getting session key:\n", error);
            rej(error);
          }
        }
      );
      // notify the server when a user joins a chat
      this.socket?.emit("join", { id, friendId });
    });
  }

  async join(
    id: string,
    friendId: string,
    onMessage: (message: string) => void
  ) {
    this.socket = await this.connect();
    this.sessionKey = await this.getSessionKey(id, friendId);
    this.subscribe(onMessage);
  }

  private isConnected() {
    return this.sessionKey !== null && this.socket !== null;
  }

  async send(id: string, friendId: string, message: string) {
    if (!this.isConnected()) return;
    // encrypt message using session key
    const encryptedMessage = await this.symmetricService.encrypt(
      this.sessionKey as string,
      message
    );
    // emit message to server
    this.socket?.emit("send-message", {
      id,
      friendId,
      encryptedMessage,
    });
  }

  private subscribe(onMessage: (message: string) => void) {
    if (!this.isConnected()) return;
    this.socket?.on(
      `receive-message`,
      async (data: { encryptedMessage: string }) => {
        const message = await this.symmetricService.decrypt(
          this.sessionKey as string,
          data.encryptedMessage
        );
        onMessage(message);
      }
    );
  }
}
