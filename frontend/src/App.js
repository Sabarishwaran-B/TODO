import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, createContext } from "react";
import axios from "axios";
import Login from "./pages/Login";
import KanbanBoard from "./pages/Dashboard";

axios.defaults.withCredentials = true;            
axios.defaults.baseURL = "http://localhost:5000"; 

export const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get("/api/auth/user").then(({ data }) => setUser(data));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={user ? <KanbanBoard /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
