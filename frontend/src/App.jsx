import { useCallback, useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${response.status})`);
    }
    return response.status === 204 ? null : response.json();
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      setTasks(await request("/tasks"));
    } catch (err) {
      setError(`${err.message}. Check that the API and database are running.`);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const created = await request("/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description })
      });
      setTasks((current) => [created, ...current]);
      setTitle("");
      setDescription("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task) {
    try {
      const updated = await request(`/tasks/${task.Id}`, {
        method: "PATCH",
        body: JSON.stringify({ isCompleted: !task.IsCompleted })
      });
      setTasks((current) => current.map((item) => item.Id === updated.Id ? updated : item));
    } catch (err) { setError(err.message); }
  }

  async function deleteTask(id) {
    try {
      await request(`/tasks/${id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item.Id !== id));
    } catch (err) { setError(err.message); }
  }

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (filter === "active") return !task.IsCompleted;
    if (filter === "completed") return task.IsCompleted;
    return true;
  }), [tasks, filter]);

  const completed = tasks.filter((task) => task.IsCompleted).length;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">✓</span> Taskflow</a>
        <span className="top-note">A simple productivity workspace</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Make progress,<br /><span>one task at a time.</span></h1>
          <p className="subtitle">Capture what matters. Keep moving forward.</p>
        </div>
        <div className="progress-card">
          <span className="progress-label">COMPLETION</span>
          <strong>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}%</strong>
          <div className="progress-track"><div style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }} /></div>
          <small>{completed} of {tasks.length} tasks completed</small>
        </div>
      </section>

      <section className="stats">
        <div className="stat"><span>Total tasks</span><strong>{tasks.length}</strong></div>
        <div className="stat"><span>In progress</span><strong>{tasks.length - completed}</strong></div>
        <div className="stat"><span>Completed</span><strong>{completed}</strong></div>
      </section>

      <section className="content-grid">
        <form className="panel add-panel" onSubmit={addTask}>
          <div className="panel-heading"><div><p className="eyebrow">GET IT OUT OF YOUR HEAD</p><h2>Add a task</h2></div><span className="plus">＋</span></div>
          <label htmlFor="title">Task title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength="200" placeholder="e.g. Deploy my app to Azure" required />
          <label htmlFor="description">Description <span>(optional)</span></label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength="1000" rows="4" placeholder="Add a little more detail..." />
          <button className="primary-btn" disabled={busy || !title.trim()}>{busy ? "Adding..." : "Add task"} <span>→</span></button>
        </form>

        <section className="panel task-panel">
          <div className="task-heading">
            <div><p className="eyebrow">STAY ON TRACK</p><h2>Your tasks <span className="count">{tasks.length}</span></h2></div>
            <button className="refresh" onClick={loadTasks} title="Refresh tasks" aria-label="Refresh tasks">↻</button>
          </div>
          <div className="filters">
            {["all", "active", "completed"].map((item) => <button key={item} className={filter === item ? "filter active-filter" : "filter"} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
          </div>

          {error && <div className="error">{error}</div>}
          {loading ? <p className="empty">Loading your tasks...</p> :
            visibleTasks.length === 0 ? <div className="empty-state"><div>✦</div><strong>{tasks.length ? "Nothing in this filter" : "A clear space to start"}</strong><p>{tasks.length ? "Try another filter." : "Add your first task using the form."}</p></div> :
            <div className="task-list">{visibleTasks.map((task) => (
              <article className={`task ${task.IsCompleted ? "task-done" : ""}`} key={task.Id}>
                <button className={`check ${task.IsCompleted ? "checked" : ""}`} onClick={() => toggleTask(task)} aria-label="Toggle completion">{task.IsCompleted ? "✓" : ""}</button>
                <div className="task-copy"><h3>{task.Title}</h3>{task.Description && <p>{task.Description}</p>}<small>{new Date(task.CreatedAt).toLocaleDateString()}</small></div>
                <button className="delete" onClick={() => deleteTask(task.Id)} aria-label={`Delete ${task.Title}`} title="Delete task">×</button>
              </article>
            ))}</div>
          }
        </section>
      </section>
      <footer>Built with React · Node.js · Azure SQL</footer>
    </main>
  );
}
