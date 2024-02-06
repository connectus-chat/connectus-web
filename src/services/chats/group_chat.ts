import { Socket } from "socket.io-client";
import { AsymmetricKeyService } from "../asymmetric_key_service";
import { ChatWebsocketV2 } from "../chat_websocket_v2";
import { SymmetricKeyService } from "../symmetric_key_service";

interface GroupChatIdentifier {
  id: string;
  groupId: string;
  participantsIds: string[];
}

export interface GroupSessionKeys {
  id: string;
  encryptedSessionKey: string;
}

interface GroupPublicKeys {
  id: string;
  publicKey: string;
}

const asymmetricService = new AsymmetricKeyService();
const symmetricService = new SymmetricKeyService();

export class GroupChat extends ChatWebsocketV2<GroupChatIdentifier> {
  public senderEncryptedKey: string | null | undefined;
  public groupSessionKeys: GroupSessionKeys[] | null | undefined;
  public friendIsOnline = false;

  constructor() {
    super();
    this.senderEncryptedKey = null;
    this.groupSessionKeys = null;
  }

  async join(
    identifier: GroupChatIdentifier,
    onMessage: (message: string) => void
  ): Promise<void> {
    const { id, groupId } = identifier;
    const socket = await this.connect();
    this.socket = socket;
    await this.subscribeEvents(identifier, socket, onMessage);
    socket.emit(`join.group`, {
      id,
      groupId,
    });
  }

  async sendMessage(
    identifier: GroupChatIdentifier,
    message: string
  ): Promise<void> {
    console.log(this.senderEncryptedKey, this.groupSessionKeys);
    if (!this.hasConnection()) return;
    const { id, groupId, participantsIds } = identifier;

    console.log("PAST SESSION KEY: ", this.sessionKey);
    console.log("PAST KEYS (USER): ", this.senderEncryptedKey);
    console.log("PAST KEYS (FRIEND): ", this.groupSessionKeys);
    // Cria nova chave de sessão se ainda não existe
    if (
      (this.sessionKey === null || this.groupSessionKeys === null,
      this.senderEncryptedKey === null)
    ) {
      const senderPublicKey = await asymmetricService.findPublicKey(id);
      const publicKeys = await this.getParticipantsPublicKeys(participantsIds);
      console.log("PUBLIC KEY (USER): ", senderPublicKey);
      console.log("PUBLIC KEYS (GROUP): ", publicKeys);

      const { sessionKey, groupKeys, senderEncryptedSessionKey } =
        await this.createSessionKey(senderPublicKey, publicKeys);
      console.log("SESSION KEY: ", sessionKey);
      console.log("ENCRYPTED SESSION KEY (USER): ", senderEncryptedSessionKey);
      console.log("ENCRYPTED SESSION KEY (GROUP): ", groupKeys);
      this.sessionKey = sessionKey;
      this.groupSessionKeys = groupKeys;
      this.senderEncryptedKey = senderEncryptedSessionKey;
    }

    if (this.sessionKey === null) return;

    console.log("MESSAGE: ", message);
    const encryptedMessage = await symmetricService.encrypt(
      this.sessionKey,
      message
    );
    console.log("ENCRYPTED MESSAGE: ", encryptedMessage);
    this.socket?.emit(`send-message.group`, {
      id,
      groupId,
      encryptedMessage,
      encryptedSessionKeys: {
        senderEncryptedSessionKey: this.senderEncryptedKey,
        recipients: this.groupSessionKeys,
      },
    });
  }

  private async subscribeEvents(
    identifier: GroupChatIdentifier,
    socket: Socket,
    onMessage: (message: string) => void
  ) {
    socket.on("who-is-connected", () =>
      this.confirmConnection(identifier, socket)
    );
    socket.on("receive-message", (data) =>
      this.receiveMessage(identifier, data, onMessage)
    );
  }

  private async confirmConnection(
    identifier: GroupChatIdentifier,
    socket: Socket
  ) {
    socket.emit(`confirm-connection.group`, identifier);
  }

  private receiveMessage = async (
    identifier: GroupChatIdentifier,
    data: {
      senderId: string;
      encryptedMessage: string;
      encryptedSessionKeys: {
        senderEncryptedSessionKey: string;
        recipients: GroupSessionKeys[];
      };
    },
    onMessage: (message: string) => void
  ) => {
    const { encryptedSessionKeys, encryptedMessage, senderId } = data;
    const { id } = identifier;
    if (id === senderId) return; // If the message received is mine

    console.log("RECEIVING MESSAGE: ", encryptedMessage);
    console.log("RECEIVING KEYS: ", encryptedSessionKeys);
    const privateKey = asymmetricService.findPrivateKey(id);
    if (!privateKey) return;
    const foundUser = encryptedSessionKeys.recipients.find((u) => u.id === id);
    if (!foundUser) return;

    const newSessionKey = await asymmetricService.decrypt(
      privateKey,
      foundUser.encryptedSessionKey
    );
    console.log("RECEIVING ENCRYPTED SESSION KEY: ", newSessionKey);
    const message = await symmetricService.decrypt(
      newSessionKey,
      encryptedMessage
    );
    console.log("RECEIVING MESSAGE (after decrypt): ", message);
    onMessage(message);
  };

  private createSessionKey = async (
    senderPublicKey: string,
    publicKeys: GroupPublicKeys[]
  ) => {
    const sessionKey = symmetricService.generateTwofishKey();
    this.sessionKey = sessionKey.stringKey;
    const senderEncryptedSessionKey = await asymmetricService.encrypt(
      senderPublicKey,
      sessionKey.stringKey
    );

    const groupKeys: GroupSessionKeys[] = [];

    for (const publicKey of publicKeys) {
      const encryptedSessionKey = await asymmetricService.encrypt(
        publicKey.publicKey,
        sessionKey.stringKey
      );

      if (encryptedSessionKey)
        groupKeys.push({
          id: publicKey.id,
          encryptedSessionKey,
        });
    }
    return {
      sessionKey: sessionKey.stringKey,
      senderEncryptedSessionKey,
      groupKeys,
    };
  };

  public async getParticipantsPublicKeys(ids: string[]) {
    const keys: GroupPublicKeys[] = [];
    console.log("GROUP IDS: ", ids);
    for (const id of ids) {
      const publicKey = await asymmetricService.findPublicKey(id);
      keys.push({
        publicKey,
        id,
      });
    }
    return keys;
  }

  public isFriendOnline() {
    return this.friendIsOnline;
  }

  private hasConnection() {
    return this.socket !== null && this.socket !== undefined;
  }
}
