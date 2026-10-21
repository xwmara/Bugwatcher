import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// The providers (AuthProvider, AppProvider) live in App.jsx, inside the router.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
