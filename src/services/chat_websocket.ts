import { Socket, io } from "socket.io-client";
import { API_BASE_URL } from "../constants";
import { Logger } from "./Logger";
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
            Logger.websocketLog('Procurando chave privada', 'Chave privada recuperada', privateKey);
            // decrypt session key using private key
            if (!privateKey) throw new Error("Private key not found");
            Logger.cryptoLog('Decriptografando chave twofish', 'Chave twofish criptografada', data.encryptedSessionKey);
            this.sessionKey = await this.asymmetricService.decrypt(
              privateKey,
              data.encryptedSessionKey
            );
            Logger.cryptoLog('Decriptografando chave twofish', 'Chave twofish decriptografada', this.sessionKey);
            res(this.sessionKey);
          } catch (error) {
            console.error("[WS] Error getting session key:\n", error);
            rej(error);
          }
        }
      );
      Logger.websocketLog('Notificando servidor', 'Novo usuário iniciou chat', `userId: ${id}\nfriendId: ${friendId}`)
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
    Logger.cryptoLog('Criptografando mensagem com chave Twofish', 'Criando mensagem criptografada', message);
    const encryptedMessage = await this.symmetricService.encrypt(
      this.sessionKey as string,
      message
    );
    Logger.cryptoLog('Criptografando mensagem com chave Twofish', 'Mensagem encriptada', encryptedMessage);
    // emit message to server
    Logger.websocketLog('Troca de mensagens', 'Enviando mensagem encriptada', `friendId: ${friendId}`)
    this.socket?.emit("send-message", {
      id,
      friendId,
      encryptedMessage,
    });

    this.socket?.emit("save-message", {
      id,
      friendId,
      message,
    });
  }

  private subscribe(onMessage: (message: string) => void) {
    if (!this.isConnected()) return;
    this.socket?.on(
      `receive-message`,
      async (data: { encryptedMessage: string }) => {
        Logger.websocketLog('Troca de mensagens', 'Recebendo mensagem encriptada', data.encryptedMessage);
        const message = await this.symmetricService.decrypt(
          this.sessionKey as string,
          data.encryptedMessage
        );
        Logger.cryptoLog('Criptografando mensagem com chave Twofish', 'Decriptando mensagem com chave twofish', message);
        onMessage(message);
      }
    );
  }
}
