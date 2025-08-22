import { useState } from "react";

const Modal = ({ onReceiveData, onClose }) => {
  const [uniqueCode, setUniqueCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    const code = uniqueCode.trim();

    if (validateUniqueCode(code)) {
      try {
        const formData = new FormData();
        formData.append("uniqueCode", code);

        const res = await fetch("http://192.168.29.88:8001/code", {
          method: "POST",
          body: formData,
        });

        console.log("We are using Modal.js");
        const json = await res.json();
        console.log("Here is the data: ", json.message);
        console.log("Here is the Movie Data from server: ", json.movie.movie);

        console.log("sending data to App.js: ", json);
        // onReceiveData(json.movie.movie);
        onReceiveData(json.movie);
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
        console.error("Error:", err);
      }
    } else {
      setError("Please enter a valid UUID format code");
    }

    setIsLoading(false);
  };

  const validateUniqueCode = (code) => {
    const uuidRegex =
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return uuidRegex.test(code);
  };

  const handleInputChange = (e) => {
    setUniqueCode(e.target.value);
    if (error) setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && uniqueCode.trim() && !isLoading) {
      handleSubmit();
    }
  };

  const styles = {
    backdrop: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 40,
      transition: "opacity 0.3s ease",
    },
    modalContainer: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 50,
      width: "100%",
      maxWidth: "400px",
      margin: "0 16px",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      overflow: "hidden",
    },
    header: {
      background: "linear-gradient(to right, #2563eb, #9333ea)",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerContent: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    iconContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      padding: "8px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "white",
      margin: 0,
    },
    closeButton: {
      color: "white",
      backgroundColor: "transparent",
      border: "none",
      padding: "4px",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "20px",
      transition: "background-color 0.2s ease",
    },
    content: {
      padding: "24px",
    },
    description: {
      color: "#6b7280",
      textAlign: "center",
      marginBottom: "24px",
      fontSize: "14px",
    },
    inputContainer: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "8px",
    },
    inputWrapper: {
      position: "relative",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: `2px solid ${error ? "#fca5a5" : "#d1d5db"}`,
      borderRadius: "8px",
      fontFamily: "monospace",
      fontSize: "14px",
      transition: "all 0.2s ease",
      outline: "none",
      boxSizing: "border-box",
    },
    inputFocus: {
      borderColor: error ? "#ef4444" : "#3b82f6",
      boxShadow: `0 0 0 3px ${
        error ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)"
      }`,
    },
    validationDot: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "8px",
      height: "8px",
      backgroundColor: "#10b981",
      borderRadius: "50%",
    },
    error: {
      color: "#ef4444",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      marginTop: "8px",
    },
    button: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "8px",
      fontWeight: "600",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      transition: "all 0.2s ease",
      marginTop: "16px",
    },
    buttonEnabled: {
      background: "linear-gradient(to right, #2563eb, #9333ea)",
      transform: "scale(1)",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    buttonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed",
    },
    buttonHover: {
      transform: "scale(1.02)",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid white",
      borderTop: "2px solid transparent",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    helpText: {
      fontSize: "12px",
      color: "#6b7280",
      textAlign: "center",
      marginTop: "24px",
      lineHeight: "1.5",
    },
  };

  const [inputFocused, setInputFocused] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div style={styles.modalContainer}>
        <div style={styles.modal}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerContent}>
              <div style={styles.iconContainer}>🔑</div>
              <h2 style={styles.title}>Enter Access Code</h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                style={styles.closeButton}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                ✕
              </button>
            )}
          </div>

          {/* Content */}
          <div style={styles.content}>
            <p style={styles.description}>
              Please enter your unique access code to continue
            </p>

            <div style={styles.inputContainer}>
              <label style={styles.label}>Unique Code</label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  name="uniqueCode"
                  value={uniqueCode}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  style={{
                    ...styles.input,
                    ...(inputFocused ? styles.inputFocus : {}),
                  }}
                  disabled={isLoading}
                />
                {uniqueCode && validateUniqueCode(uniqueCode) && (
                  <div style={styles.validationDot}></div>
                )}
              </div>
              {error && (
                <p style={styles.error}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!uniqueCode.trim() || isLoading}
              style={{
                ...styles.button,
                ...(!uniqueCode.trim() || isLoading
                  ? styles.buttonDisabled
                  : styles.buttonEnabled),
                ...(buttonHovered && uniqueCode.trim() && !isLoading
                  ? styles.buttonHover
                  : {}),
              }}
              onMouseEnter={() => setButtonHovered(true)}
              onMouseLeave={() => setButtonHovered(false)}
            >
              {isLoading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <span>Validating...</span>
                </div>
              ) : (
                "Submit Code"
              )}
            </button>

            <div style={styles.helpText}>
              <p>Need help? Contact your administrator for access code.</p>
              <p style={{ fontFamily: "monospace", marginTop: "4px" }}>
                Format: UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
