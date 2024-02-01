import { Socket } from "socket.io-client";
import { AsymmetricKeyService } from "../asymmetric_key_service";
import { ChatWebsocketV2 } from "../chat_websocket_v2";
import { SymmetricKeyService } from "../symmetric_key_service";

interface PrivateChatIdentifier {
  id: string;
  friendId: string;
}

const asymmetricService = new AsymmetricKeyService();
const symmetricService = new SymmetricKeyService();

export class PrivateChat extends ChatWebsocketV2<PrivateChatIdentifier> {
  public senderEncryptedKey: string | null;
  public recipientEncryptedKey: string | null;
  public friendIsOnline = false;

  constructor() {
    super();
    this.senderEncryptedKey = null;
    this.recipientEncryptedKey = null;
  }

  async join(
    identifier: PrivateChatIdentifier,
    onMessage: (message: string) => void
  ): Promise<void> {
    const { id, friendId } = identifier;
    const socket = await this.connect();
    this.socket = socket;
    await this.subscribeEvents(identifier, socket, onMessage);
    socket.emit(`join.private`, {
      id,
      friendId,
    });
  }

  async sendMessage(
    identifier: PrivateChatIdentifier,
    message: string
  ): Promise<void> {
    console.log(this.senderEncryptedKey, this.recipientEncryptedKey);
    if (!this.hasConnection()) return;
    const { id, friendId } = identifier;

    // Cria nova chave de sessão se ainda não existe
    if (
      (this.sessionKey === null || this.recipientEncryptedKey === null,
      this.senderEncryptedKey === null)
    ) {
      console.log("Gerando nova chaves");
      const {
        sessionKey,
        recipientEncryptedSessionKey,
        senderEncryptedSessionKey,
      } = await this.createSessionKey(id, friendId);
      this.sessionKey = sessionKey;
      this.recipientEncryptedKey = recipientEncryptedSessionKey;
      this.senderEncryptedKey = senderEncryptedSessionKey;
    }

    if (this.sessionKey === null) return;

    const encryptedMessage = await symmetricService.encrypt(
      this.sessionKey.stringKey,
      message
    );
    this.socket?.emit(`send-message.private`, {
      id,
      friendId,
      encryptedMessage,
      encryptedSessionKeys: {
        senderEncryptedSessionKey: this.senderEncryptedKey,
        recipientEncryptedSessionKey: this.recipientEncryptedKey,
      },
    });
  }

  private async subscribeEvents(
    identifier: PrivateChatIdentifier,
    socket: Socket,
    onMessage: (message: string) => void
  ) {
    socket.on("who-is-connected", () =>
      this.confirmConnection(identifier, socket)
    );
    socket.on("i-am-connected", () => this.updateFriendStatus(this));
    socket.on("receive-message", (data) =>
      this.receiveMessage(identifier, data, onMessage)
    );
  }

  private async confirmConnection(
    identifier: PrivateChatIdentifier,
    socket: Socket
  ) {
    socket.emit(`confirm-connection.private`, identifier);
  }

  private updateFriendStatus = async (chat: PrivateChat) => {
    chat.friendIsOnline = true;
  };

  private async receiveMessage(
    identifier: PrivateChatIdentifier,
    data: {
      senderId: string;
      encryptedMessage: string;
      encryptedSessionKeys: {
        senderEncryptedSessionKey: string;
        recipientEncryptedSessionKey: string;
      };
    },
    onMessage: (message: string) => void
  ) {
    const { encryptedSessionKeys, encryptedMessage } = data;
    const { id } = identifier;
    const privateKey = asymmetricService.findPrivateKey(id);
    if (!privateKey) return;

    const newSessionKey = await asymmetricService.decrypt(
      privateKey,
      encryptedSessionKeys.senderEncryptedSessionKey
    );
    this.sessionKey = {
      key: new Uint8Array(),
      stringKey: newSessionKey,
    };
    const message = await symmetricService.decrypt(
      newSessionKey,
      encryptedMessage
    );
    onMessage(message);
  }

  private createSessionKey = async (
    senderPublicKey: string,
    recipientPublicKey: string
  ) => {
    const sessionKey = symmetricService.generateTwofishKey();
    this.sessionKey = sessionKey;
    const senderEncryptedSessionKey = await asymmetricService.encrypt(
      senderPublicKey,
      sessionKey.key
    );
    const recipientEncryptedSessionKey = await asymmetricService.encrypt(
      recipientPublicKey,
      sessionKey.key
    );
    return {
      sessionKey,
      senderEncryptedSessionKey,
      recipientEncryptedSessionKey,
    };
  };

  public isFriendOnline() {
    return this.friendIsOnline;
  }

  private hasConnection() {
    return this.socket !== null && this.socket !== undefined;
  }
}
