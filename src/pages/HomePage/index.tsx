import { IoIosExit as ExitIcon, IoMdSend as SendIcon } from "react-icons/io";
import { MessageCard } from "../../components/MessageCard";
import { UserProfile } from "../../components/UserProfile";
import { User } from "../../entities/user";

import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loading } from "../../components/Loading";
import { Message } from "../../entities/message";
import { useNotification } from "../../hooks/useNotification";
import { MessageService } from "../../services/message_service";
import { UserService } from "../../services/user_service";
import "./styles.css";

const userService = new UserService();
const messageService = new MessageService();

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { pushNotification } = useNotification();
  // Authenticated User
  const [user, setUser] = useState<User | undefined>();

  // User selected to chat
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [messages, setMessages] = useState<Message[] | undefined>();

  // Search for friends
  const [isSearching, setIsSearching] = useState(false);
  const [users2Add, setUsers2Add] = useState<User[] | undefined>();

  useEffect(() => {
    async function fetch() {
      const foundUser = await userService.getAuthenticatedUser();
      setUser(foundUser);
    }

    fetch();
  }, []);

  async function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    const { value: searchFor } = event.currentTarget;
    if (searchFor === "") return setIsSearching(false);
    setIsSearching(true);
    let users = await userService.fetchAll();
    users = users.filter(
      (u) =>
        (u.name.toLowerCase().includes(searchFor.toLowerCase()) ||
          u.username.toLowerCase().includes(searchFor.toLowerCase())) &&
        u.id !== user?.id &&
        !user?.friends.map((f) => f.id).includes(u.id)
    );
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

  async function handleOpenChat(friend: User) {
    async function fetch() {
      const messages = await messageService.fetchAll(friend.id);
      setMessages(messages);
    }
    fetch();
    setSelectedUser(friend);
  }

  function renderFriend(friend: User, index: number) {
    return (
      <li key={index} className="chat" onClick={() => handleOpenChat(friend)}>
        <UserProfile user={friend} />
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

  function renderMessage(message: Message) {
    return (
      <MessageCard message={message} isMine={message.fromUserId === user?.id} />
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
                user.friends.map(renderFriend)
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
                <header className="chat-user">
                  <UserProfile user={selectedUser} />
                </header>
                <ul className="messages">{messages?.map(renderMessage)}</ul>
                <div className="actions">
                  <input
                    type="text"
                    className="ipt"
                    placeholder="Digitar mensagem"
                  />
                  <button className="send">
                    <SendIcon size={28} />
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      ) : (
        <Loading />
      )}
    </div>
  );
};
