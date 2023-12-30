import "./styles.css";

export const Loading: React.FC = () => {
  return (
    <div className="loading-spinner">
      <div className="container">
        <div className="square a"></div>
        <div className="square b"></div>
        <div className="square d"></div>
        <div className="square c"></div>
      </div>
    </div>
  );
};
