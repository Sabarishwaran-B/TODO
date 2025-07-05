
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import axios from "axios";
import "./Dashboard.css";

axios.defaults.withCredentials = true; 
axios.defaults.baseURL = "http://localhost:5000"; 
const API = "/tasks";
const KanbanContext = createContext();

const initialState = { todo: [], inProgress: [], done: [] };

function reducer(state, action) {
  switch (action.type) {
    case "SET_ALL":
      return action.payload;
    case "ADD_TASK":
      return { ...state, todo: [...state.todo, action.payload] };
    case "DELETE_TASK": {
      const { column, id } = action.payload;
      return { ...state, [column]: state[column].filter((c) => c._id !== id) };
    }
    case "UPDATE_TASK": {
      const { column, id, newText } = action.payload;
      return {
        ...state,
        [column]: state[column].map((c) => (c._id === id ? { ...c, text: newText } : c)),
      };
    }
    case "MOVE_CARD": {
      const { card, from, to } = action.payload;
      if (from === to) return state;
      return {
        ...state,
        [from]: state[from].filter((c) => c._id !== card._id),
        [to]: [...state[to], { ...card, status: to }],
      };
    }
    default:
      return state;
  }
}

function KanbanProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    axios.get(API).then(({ data }) => {
      const grouped = {
        todo: data.filter((t) => t.status === "todo"),
        inProgress: data.filter((t) => t.status === "inProgress"),
        done: data.filter((t) => t.status === "done"),
      };
      dispatch({ type: "SET_ALL", payload: grouped });
    });
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}

function TaskInput() {
  const { dispatch } = useContext(KanbanContext);
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    axios.post(API, { text, status: "todo" }).then(({ data }) => {
      dispatch({ type: "ADD_TASK", payload: data });
      setText("");
    });
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add new task" />
      <button>Add Task</button>
    </form>
  );
}

function Card({ card, columnKey }) {
  const { dispatch } = useContext(KanbanContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.text);

  const dragStart = (e) =>
    e.dataTransfer.setData("card", JSON.stringify({ card, from: columnKey }));

  const save = () =>
    axios.put(`${API}/${card._id}`, { text: draft }).then(() => {
      dispatch({ type: "UPDATE_TASK", payload: { column: columnKey, id: card._id, newText: draft } });
      setEditing(false);
    });

  const remove = () =>
    axios.delete(`${API}/${card._id}`).then(() =>
      dispatch({ type: "DELETE_TASK", payload: { column: columnKey, id: card._id } })
    );

  return (
    <div draggable onDragStart={dragStart} className="card">
      {editing ? (
        <>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} className="card-edit-input" />
          <div className="card-actions">
            <button onClick={save}>💾</button>
            <button onClick={() => setEditing(false)}>↩️</button>
          </div>
        </>
      ) : (
        <>
          <span>{card.text}</span>
          <div className="card-actions">
            <button onClick={() => setEditing(true)}>✏️</button>
            <button onClick={remove}>🗑️</button>
          </div>
        </>
      )}
    </div>
  );
}

function Column({ title, columnKey, className }) {
  const { state, dispatch } = useContext(KanbanContext);
  const dropRef = useRef();

  useEffect(() => {
    const node = dropRef.current;
    const handleDrop = (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("card"));
      axios.put(`${API}/${data.card._id}`, { status: columnKey }).then(() => {
        dispatch({ type: "MOVE_CARD", payload: { ...data, to: columnKey } });
      });
    };
    node.addEventListener("dragover", (e) => e.preventDefault());
    node.addEventListener("drop", handleDrop);
    return () => node.removeEventListener("drop", handleDrop);
  }, [dispatch, columnKey]);

  return (
    <div className={`column ${className}`} ref={dropRef}>
      <h2>{title}</h2>
      {state[columnKey].map((card) => (
        <Card key={card._id} card={card} columnKey={columnKey} />
      ))}
    </div>
  );
}

export default function KanbanBoard() {
  const [user, setUser] = useState(null);

  // fetch logged‑in user
  useEffect(() => {
    axios.get("/api/auth/user").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  const logout = () => window.open("http://localhost:5000/api/auth/logout", "_self");

  return (
    <KanbanProvider>
      <div className="board-container">
        {/* Top Bar */}
        <div className="top-bar">
          <span className="user-info">
            {user ? `Welcome, ${user.username || user.email}` : "Loading..."}
          </span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>

        <TaskInput />

        <div className="board">
          <Column title="To Do"        columnKey="todo"       className="column-red"    />
          <Column title="In Progress"  columnKey="inProgress" className="column-yellow" />
          <Column title="Done"         columnKey="done"       className="column-green"  />
        </div>
      </div>
    </KanbanProvider>
  );
}
