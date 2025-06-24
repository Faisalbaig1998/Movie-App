const styles = {
  Modal: {
    // position: "absolute",
    top: "50%",
    left: "50%",
    display: "flex",
    flexDirection: "column",
    width: "50%",
    border: "1px solid black",
  },
};

const Modal = () => {
  return (
    <div style={styles.Modal}>
      <h2>Please Put the Unique code</h2>
      <input type="text" placeholder="Enter unique code" />
    </div>
  );
};

export default Modal;
