import "./styles.css";

interface Props {
  name: string;
}

export const UserNameImage: React.FC<Props> = ({ name }) => {
  const name2Show = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="username-container">
      <label className="username-label">{name2Show}</label>
    </div>
  );
};
