import { IoIosExit as ExitIcon, IoMdSend as SendIcon } from "react-icons/io";
import { MessageCard } from "../../components/MessageCard";
import { UserProfile } from "../../components/UserProfile";
import { User } from "../../entities/user";

import { useState } from "react";
import { Loading } from "../../components/Loading";
import { Message } from "../../entities/message";
import "./styles.css";

export const HomePage: React.FC = () => {
  // Authenticated User
  const [user, setUser] = useState<User | undefined>({
    age: 21,
    email: "lima.gabrieldsantos@gmail.com",
    friends: [
      {
        age: 21,
        email: "seuamigo@gmail.com",
        friends: [],
        groups: [],
        id: "02",
        name: "Redigit",
        password: "123",
        username: "__terrariafan",
      },
    ],
    groups: [],
    id: "01",
    name: "Gabriel Dos Santos Lima",
    password: "123",
    username: "gdsl.lima",
  });

  // User selected to chat
  const [selectedUser, setSelectedUser] = useState<User | undefined>(
    user?.friends[0]
  );
  const [messages, setMessages] = useState<Message[] | undefined>();

  // Search for friends
  const [searchFor, setSearchFor] = useState("");
  const [users2Add, setUser2Add] = useState<User[] | undefined>();

  function renderFriend(friend: User, index: number) {
    return (
      <li key={index} className="chat">
        <UserProfile user={friend} />
      </li>
    );
  }

  function renderUser2Add(user2Add: User, index: number) {
    return (
      <li key={index} className="chat">
        <UserProfile user={user2Add} />
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
              />
              <button className="bt secondary exit">
                <ExitIcon size={28} />
                SAIR
              </button>
            </div>
            <ul className="chats">
              {searchFor === "" ? (
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
                <ul className="messages">
                  <MessageCard
                    message={{
                      content: "salve",
                      time: new Date(),
                    }}
                  />
                  <MessageCard
                    message={{
                      content: "salve salve trupe",
                      time: new Date(),
                    }}
                    isMine
                  />
                </ul>
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
