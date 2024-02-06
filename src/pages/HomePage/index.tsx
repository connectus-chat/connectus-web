import { IoIosExit as ExitIcon, IoMdSend as SendIcon } from "react-icons/io";
import { MessageCard } from "../../components/MessageCard";
import { UserProfile } from "../../components/UserProfile";
import { User } from "../../entities/user";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GroupProfile } from "../../components/GroupProfile";
import { Loading } from "../../components/Loading";
import { Group } from "../../entities/group";
import { GroupMessage, Message } from "../../entities/message";
import { useNotification } from "../../hooks/useNotification";
import { AsymmetricKeyService } from "../../services/asymmetric_key_service";
import { PrivateChat } from "../../services/chats/private_chat";
import { GroupService } from "../../services/group_service";
import { MessageService } from "../../services/message_service";
import { SymmetricKeyService } from "../../services/symmetric_key_service";
import { UserService } from "../../services/user_service";
import "./styles.css";

const userService = new UserService();
const groupService = new GroupService();
const messageService = new MessageService();
const chatWebsocket = new PrivateChat();

type EssentialMessage = Pick<Message, "content" | "fromUserId" | "time">;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { pushNotification } = useNotification();
  const inputRef = useRef<HTMLInputElement>(null);

  // Authenticated User
  const [user, setUser] = useState<User | undefined>();

  // General chat
  const [currentMessages, setCurrentMessages] = useState<EssentialMessage[]>(
    []
  );

  // User selected to chat
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [messages, setMessages] = useState<Message[] | undefined>();

  // Current reference of current messages
  const messageRef = useRef<EssentialMessage[]>();
  messageRef.current = currentMessages;

  // Search for friends
  const [isSearching, setIsSearching] = useState(false);
  const [users2Add, setUsers2Add] = useState<User[] | undefined>();

  // Groups
  const groupDialogRef = useRef<HTMLDialogElement>(null);
  const [groups, setGroups] = useState<Group[] | undefined>();
  const [dialogUsers, setDialogUsers] = useState<User[] | undefined>();
  const [ids, setParticipantsIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  // Message of groups
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>();
  const [messageGroups, setMessageGroups] = useState<
    GroupMessage[] | undefined
  >();

  useEffect(() => {
    async function fetch() {
      const foundUser = await userService.getAuthenticatedUser();
      if (!foundUser) return;
      const groups = await groupService.fetchAllByUserId(foundUser.id);
      setUser(foundUser);
      setGroups(groups);
    }

    fetch();
  }, []);

  async function filterUsers(query: string) {
    let users = await userService.fetchAll();
    users = users.filter(
      (u) =>
        (u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase())) &&
        u.id !== user?.id
    );
    return users;
  }

  async function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    const { value: searchFor } = event.currentTarget;
    if (searchFor === "") return setIsSearching(false);
    setIsSearching(true);
    let users = await filterUsers(searchFor);
    users = users.filter((u) => !user?.friends.map((f) => f.id).includes(u.id));
    setUsers2Add(users);
  }

  function handleLogout() {
    userService.logout();
    navigate("/");
  }

  async function handleFollow(friend: User) {
    const updatedUser = await userService.follow(friend.id);
    if (!updatedUser)
      return pushNotification({
        message: "Não foi possível seguir usuário",
        type: "error",
      });
    pushNotification({
      message: `Você se conectou com "${friend.name}"`,
      type: "success",
    });
    setUser(updatedUser);
    setIsSearching(false);
  }

  // ======================= PRIVATE CHAT =============================
  async function handleOpenChat(friend: User) {
    if (!user) return;

    async function fetch() {
      if (!user) return;
      const newMessages = await messageService.fetchAll(friend.id);
      const asService = new AsymmetricKeyService();
      const symService = new SymmetricKeyService();

      const privateKey = asService.findPrivateKey(user.id);
      if (!privateKey) return;
      const descryptedMessages: Message[] = [
        ...newMessages.map((m) => {
          return { ...m };
        }),
      ];
      console.log("SAVED MESSAGES (ENCRYPTED)");
      console.log(newMessages);
      for (const m of descryptedMessages) {
        const isMyMessage = m.fromUserId === user.id;
        const keys = JSON.parse(m.publicCredentials);
        const senderEncryptedSessionKey = keys["senderEncryptedSessionKey"];
        const recipientEncryptedSessionKey =
          keys["recipientEncryptedSessionKey"];
        const sessionKey = await asService.decrypt(
          privateKey,
          isMyMessage ? senderEncryptedSessionKey : recipientEncryptedSessionKey
        );

        m.content = await symService.decrypt(sessionKey, m.content);
      }
      console.log("SAVED MESSAGES (DESCRYPTED)");
      console.log(descryptedMessages);
      setMessages(descryptedMessages);
    }

    fetch();

    chatWebsocket
      .join({ id: user.id, friendId: friend.id }, (m) => {
        pushMessage(m, friend.id);
      })
      .then(() => {
        setSelectedUser(friend);
      });
  }

  async function handleSend() {
    if (
      !inputRef ||
      !inputRef.current ||
      !user ||
      !selectedUser ||
      messages === undefined
    )
      return;
    const { value } = inputRef.current;
    if (value !== "") {
      await chatWebsocket.sendMessage(
        { id: user.id, friendId: selectedUser.id },
        value
      );
      pushMessage(value, user.id);
    }
    inputRef.current.value = "";
  }

  function pushMessage(content: string, fromId: string) {
    setCurrentMessages((prevMessages) => [
      ...prevMessages,
      {
        content: content,
        time: new Date(),
        fromUserId: fromId,
      },
    ]);
  }

  // =================== GROUP CHAT ============================

  function handleCreateGroupDialog() {
    groupDialogRef.current?.showModal();
  }

  function handleCloseGroupDialog() {
    groupDialogRef.current?.close();
  }

  function handleChangeGroupName(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    if (value === "") {
      pushNotification({
        message: "Preencha o título do grupo",
        type: "error",
      });
      return;
    }
    setGroupName(value);
  }

  async function handleFilterUsers(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    if (value === "") {
      setDialogUsers(undefined);
      return;
    }
    const newUsers = await filterUsers(value);
    setDialogUsers(newUsers);
  }

  function handleAddParticipant(id: string) {
    setParticipantsIds([...ids, id]);
  }

  function handleRemoveParticipant(id: string) {
    setParticipantsIds([...ids.filter((i) => i !== id)]);
  }

  async function handleCreateGroup() {
    if (!user) return;
    await groupService.createAndAdd(
      {
        title: groupName,
      },
      ids,
      user.id
    );
    window.location.reload();
  }

  function renderDialogUser(dialogUser: User, index: number) {
    return (
      <li className="user" key={`dialoguser-${index}`}>
        <label className="name">
          {dialogUser.name} - @{dialogUser.username}
        </label>
        {!ids.includes(dialogUser.id) ? (
          <button
            className="bt secondary"
            onClick={() => handleAddParticipant(dialogUser.id)}
          >
            ADICIONAR
          </button>
        ) : (
          <button
            className="bt primary"
            onClick={() => handleRemoveParticipant(dialogUser.id)}
          >
            REMOVER
          </button>
        )}
      </li>
    );
  }

  // ===========================================================

  function renderFriend(friend: User, index: number) {
    return (
      <li key={index} className="chat" onClick={() => handleOpenChat(friend)}>
        <UserProfile selected={selectedUser?.id === friend.id} user={friend} />
      </li>
    );
  }

  function renderUser2Add(user2Add: User, index: number) {
    return (
      <li key={index} className="chat" onClick={() => handleFollow(user2Add)}>
        <UserProfile user={user2Add} />
      </li>
    );
  }

  function renderMessage(message: EssentialMessage, index: number) {
    return (
      <MessageCard
        key={index}
        message={message}
        isMine={message.fromUserId === user?.id}
      />
    );
  }

  function renderGroup(group: Group, index: number) {
    return (
      <li key={`group-${index}`} className="chat group">
        <GroupProfile group={group} selected={group.id === selectedGroup?.id} />
      </li>
    );
  }

  return (
    <div className="home-page">
      {user ? (
        <main className="main">
          <div className="profile-container">
            <div className="profile">
              <UserProfile user={user} />
            </div>
            <div className="actions">
              <input
                type="text"
                className="ipt"
                placeholder="Pesquise por outros usuários..."
                onChange={handleSearch}
              />
              <button
                className="bt secondary"
                onClick={() => handleCreateGroupDialog()}
              >
                CRIAR GRUPO
              </button>
              <button className="bt secondary exit" onClick={handleLogout}>
                <ExitIcon size={28} />
                SAIR
              </button>
            </div>
            <label>
              {!isSearching ? "Meus amigos" : `Usuários encontrados`}
            </label>
            <ul className="chats">
              <li className="default">
                <label>
                  Sem {isSearching ? "usuários" : "amigos"} para listar aqui.
                </label>
              </li>
              {!isSearching ? (
                <>
                  {user.friends.map(renderFriend)}
                  {groups?.map(renderGroup)}
                </>
              ) : users2Add !== undefined ? (
                users2Add.map(renderUser2Add)
              ) : (
                <Loading />
              )}
            </ul>
          </div>
          <div className="chat-container">
            {selectedUser && (
              <>
                {messages ? (
                  <>
                    <header className="chat-user">
                      <UserProfile user={selectedUser} />
                    </header>
                    <ul className="messages">
                      {messages?.map(renderMessage)}
                      {currentMessages?.map(renderMessage)}
                    </ul>
                    <div className="actions">
                      <input
                        type="text"
                        className="ipt"
                        placeholder="Digitar mensagem"
                        ref={inputRef}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleSend();
                        }}
                      />
                      <button className="send" onClick={handleSend}>
                        <SendIcon size={28} />
                      </button>
                    </div>
                  </>
                ) : (
                  <Loading />
                )}
              </>
            )}
          </div>
        </main>
      ) : (
        <Loading />
      )}

      <dialog className="add-group" ref={groupDialogRef} open={false}>
        <div className="container">
          <button className="bt primary" onClick={handleCloseGroupDialog}>
            FECHAR
          </button>
          <input
            type="text"
            className="ipt"
            placeholder="Digite o título do grupo"
            onChange={handleChangeGroupName}
          />
          <input
            type="text"
            className="ipt"
            placeholder="Pesquisar usuário"
            onChange={handleFilterUsers}
          />
          {dialogUsers ? (
            dialogUsers.length > 0 ? (
              <>
                <label>Usuários encontrados:</label>
                <ul className="users">{dialogUsers.map(renderDialogUser)}</ul>
              </>
            ) : (
              <label>Nenhum usuário encontrado.</label>
            )
          ) : (
            <label>Pesquise por algum usuário</label>
          )}
          <button className="bt primary" onClick={handleCreateGroup}>
            Salvar
          </button>
        </div>
      </dialog>
    </div>
  );
};
