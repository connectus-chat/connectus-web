import { User } from "../../entities/user";
import { UserNameImage } from "../UserNameImage";
import "./styles.css";

interface Props {
  user: User;
  selected?: boolean;
}

export const UserProfile: React.FC<Props> = ({ user, selected = false }) => {
  return (
    <div className={`user-profile ${selected ? "selected" : ""}`}>
      <UserNameImage name={user.name} />
      <div className="info">
        <label className="name">{user.name}</label>
        <label className="username">@{user.username}</label>
      </div>
    </div>
  );
};
