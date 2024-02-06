import { Group } from "../../entities/group";
import { GroupNameImage } from "../GroupNameImage";
import "./styles.css";

interface Props {
  group: Group;
  selected?: boolean;
}

export const GroupProfile: React.FC<Props> = ({ group, selected = false }) => {
  return (
    <div className={`group-profile ${selected ? "selected" : ""}`}>
      <GroupNameImage name={group.title} />
      <div className="info">
        <label className="name">{group.title}</label>
      </div>
    </div>
  );
};
