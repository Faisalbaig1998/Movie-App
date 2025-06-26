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
  const handleSubmit = async (event) => {
    event.preventDefault();

    const uniqueCode = event.target.elements.uniqueCode.value.trim();

    if (validateUniqueCode(uniqueCode)) {
      const formData = new FormData();
      formData.append("uniqueCode", uniqueCode);

      await fetch("http://192.168.29.88:8001/code", {
        method: "POST",
        body: formData,
      });
    }
  };

  const validateUniqueCode = (code) => {
    const uuidRegex =
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return uuidRegex.test(code);
  };

  return (
    <div style={styles.Modal}>
      <h2>Please Put the Unique code</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="uniqueCode" placeholder="Enter unique code" />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
};

export default Modal;
