import { useState, useEffect } from "react";

const DEFAULT_TASKS = [
  { id: "cardio", category: "有氧燃脂", icon: "🔥", title: "有氧训练", description: "快走/跑步/骑车/跳绳", duration: "30–45 分钟", tip: "心率保持在最大心率的65–75%，燃脂效果最佳", xp: 30 },
  { id: "strength", category: "力量塑形", icon: "💪", title: "力量训练", description: "深蹲/硬拉/卧推/划船", duration: "40–60 分钟", tip: "每组8–12次，组间休息60s，提升代谢率", xp: 40 },
  { id: "core", category: "体态核心", icon: "⚡", title: "核心训练", description: "平板支撑/死虫/鸟狗/卷腹", duration: "10–15 分钟", tip: "核心稳定是体态改善的基础，每天必练", xp: 20 },
  { id: "stretch", category: "体态修复", icon: "🧘", title: "拉伸放松", description: "胸椎/髋屈肌/肩部拉伸", duration: "10–15 分钟", tip: "改善圆肩驼背，保持训练后肌肉弹性", xp: 15 },
  { id: "steps", category: "日常活动", icon: "👟", title: "每日步数", description: "全天保持活跃，避免久坐", duration: "≥ 8000 步", tip: "NEAT占每日消耗的15–30%", xp: 15 },
  { id: "water", category: "营养支持", icon: "💧", title: "足量饮水", description: "白水/淡茶/无糖饮料", duration: "≥ 2000 mL", tip: "充分水合有助于代谢废物排出和脂肪动员", xp: 10 },
  { id: "protein", category: "营养支持", icon: "🥩", title: "蛋白质摄入", description: "鸡胸/鱼/蛋/豆腐/乳清蛋白", duration: "体重×1.6–2g", tip: "高蛋白保留肌肉、提升饱腹感", xp: 10 },
  { id: "sleep", category: "恢复", icon: "🌙", title: "优质睡眠", description: "保证深度睡眠，避免熬夜", duration: "7–9 小时", tip: "睡眠不足导致皮质醇升高，阻碍脂肪分解", xp: 20 },
];

const DEFAULT_GOAL = {
  title: "美女养成计划",
  subtitle: "减脂塑形 · 体态改善",
  targetWeight: "",
  targetDate: "",
  notes: "",
};

const WEEKLY_PLAN = [
  { day: "周一", focus: "上肢力量 + 有氧", emoji: "💪" },
  { day: "周二", focus: "下肢力量 + 核心", emoji: "🦵" },
  { day: "周三", focus: "低强度有氧 + 拉伸", emoji: "🧘" },
  { day: "周四", focus: "全身力量 + HIIT", emoji: "⚡" },
  { day: "周五", focus: "上肢力量 + 有氧", emoji: "🔥" },
  { day: "周六", focus: "户外活动 / 长距离步行", emoji: "🌿" },
  { day: "周日", focus: "主动恢复 + 充分拉伸", emoji: "🌙" },
];

// JS getDay(): 0=Sun,1=Mon,...,6=Sat  →  weekday index 0=Mon,...,6=Sun
const JS_TO_IDX = [6, 0, 1, 2, 3, 4, 5];

function getWeekKey(date = new Date()) {
  // ISO week: Monday-based. Returns "YYYY-Www"
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekDates(weekKey) {
  // Returns array of 7 "YYYY-MM-DD" strings Mon–Sun for the given ISO week key
  const [year, wStr] = weekKey.split("-W");
  const w = parseInt(wStr, 10);
  const jan4 = new Date(Date.UTC(parseInt(year, 10), 0, 4));
  const startOfWeek = new Date(jan4);
  startOfWeek.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setUTCDate(startOfWeek.getUTCDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function genId() { return Math.random().toString(36).slice(2, 8); }

export default function FitnessTracker() {
  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];
  const weekKey = getWeekKey(today);
  const todayIdx = JS_TO_IDX[today.getDay()];

  const [tasks, setTasks] = useState(() => {
    try { const s = localStorage.getItem("fit_tasks"); return s ? JSON.parse(s) : DEFAULT_TASKS; } catch { return DEFAULT_TASKS; }
  });
  const [goal, setGoal] = useState(() => {
    try { const s = localStorage.getItem("fit_goal"); return s ? JSON.parse(s) : DEFAULT_GOAL; } catch { return DEFAULT_GOAL; }
  });
  const [checked, setChecked] = useState(() => {
    try { const s = localStorage.getItem(`fit_${todayKey}`); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [streak] = useState(7);
  const [tab, setTab] = useState("today");
  const [expanded, setExpanded] = useState(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(goal);
  const [editingTask, setEditingTask] = useState(null);
  const [taskDraft, setTaskDraft] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ icon: "✨", title: "", category: "", description: "", duration: "", tip: "", xp: 20 });

  useEffect(() => { try { localStorage.setItem(`fit_${todayKey}`, JSON.stringify(checked)); } catch {} }, [checked, todayKey]);
  useEffect(() => { try { localStorage.setItem("fit_tasks", JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { try { localStorage.setItem("fit_goal", JSON.stringify(goal)); } catch {} }, [goal]);

  // Derive per-day completion % for current week
  const weekDates = getWeekDates(weekKey);
  const weekStats = weekDates.map((dateStr) => {
    try {
      const raw = localStorage.getItem(`fit_${dateStr}`);
      if (!raw) return null;
      const dayChecked = JSON.parse(raw);
      const done = Object.values(dayChecked).filter(Boolean).length;
      return tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    } catch { return null; }
  });

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalXP = tasks.filter(t => checked[t.id]).reduce((s, t) => s + t.xp, 0);
  const maxXP = tasks.reduce((s, t) => s + t.xp, 0);
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const todayPlan = WEEKLY_PLAN[todayIdx];

  const saveGoal = () => { setGoal(goalDraft); setEditingGoal(false); };
  const startEditTask = (task) => { setTaskDraft({ ...task }); setEditingTask(task.id); setExpanded(null); };
  const saveTask = () => { setTasks(ts => ts.map(t => t.id === editingTask ? { ...taskDraft } : t)); setEditingTask(null); setTaskDraft(null); };
  const deleteTask = (id) => { setTasks(ts => ts.filter(t => t.id !== id)); setEditingTask(null); };
  const saveNewTask = () => {
    if (!newTask.title.trim()) return;
    setTasks(ts => [...ts, { ...newTask, id: genId() }]);
    setNewTask({ icon: "✨", title: "", category: "", description: "", duration: "", tip: "", xp: 20 });
    setAddingTask(false);
  };

  const weekCompletedDays = weekStats.filter(v => v !== null && v >= 100).length;
  const weekAvgPct = (() => {
    const valid = weekStats.filter(v => v !== null);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#fff5fb", fontFamily: "'Nunito',sans-serif", color: "#3a003a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #e8c0f0; border-radius: 2px; }

        .hdr { background: linear-gradient(135deg,#ffe0f5 0%,#f0d6ff 100%); padding: 22px 20px 30px; position: relative; overflow: hidden; }
        .hdr::before { content:''; position:absolute; width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.28);top:-50px;right:-40px; }
        .hdr::after  { content:''; position:absolute; width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,0.18);bottom:-20px;left:10px; }

        .streak-pill { display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.65);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:800;color:#b0348a;margin-bottom:10px; }
        .hdr-title { font-size:26px;font-weight:900;color:#6a0080;line-height:1.1;margin-bottom:4px;position:relative;z-index:1; }
        .hdr-sub   { font-size:13px;color:#b06aa0;position:relative;z-index:1; }

        .body { padding: 16px; }

        .prog-card { background:#fff;border-radius:22px;padding:16px 18px;margin-bottom:14px;box-shadow:0 4px 20px rgba(180,80,160,0.10); }
        .stat-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px; }
        .stat-box  { background:linear-gradient(135deg,#fdf0ff,#fff0f9);border-radius:16px;padding:12px 14px;text-align:center; }
        .stat-val  { font-size:22px;font-weight:900;color:#9b2fbf; }
        .stat-lbl  { font-size:11px;color:#c060a0;margin-top:1px;font-weight:700; }

        .bar-track { height:10px;background:#f5e0ff;border-radius:5px;overflow:hidden; }
        .bar-fill  { height:100%;border-radius:5px;background:linear-gradient(90deg,#e879f9,#f472b6);transition:width .6s cubic-bezier(.34,1.56,.64,1); }

        .tabs { display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap; }
        .tab  { padding:8px 14px;border-radius:20px;border:none;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;cursor:pointer;transition:all .2s; }
        .tab.active { background:linear-gradient(135deg,#e879f9,#f472b6);color:#fff; }
        .tab:not(.active) { background:#fff;color:#c060a0;box-shadow:0 2px 8px rgba(180,80,160,0.08); }

        .focus-card { background:linear-gradient(135deg,#fff0fb,#f5f0ff);border-radius:18px;padding:13px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px; }

        .task-card { background:#fff;border-radius:20px;padding:14px 16px;margin-bottom:10px;box-shadow:0 2px 12px rgba(180,80,160,0.07);display:flex;align-items:center;gap:12px;cursor:pointer;transition:transform .15s; }
        .task-card:hover { transform:translateX(3px); }
        .task-card.done { background:#fdf4ff;opacity:.78; }
        .chk { width:30px;height:30px;border-radius:50%;border:2.5px solid #e8a0d5;background:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;transition:all .2s; }
        .chk.done { background:linear-gradient(135deg,#e879f9,#f472b6);border-color:transparent;color:#fff; }
        .t-icon { font-size:22px;flex-shrink:0; }
        .t-info { flex:1;min-width:0; }
        .t-name { font-size:14px;font-weight:800;color:#4a0060;margin-bottom:2px; }
        .task-card.done .t-name { text-decoration:line-through;color:#c099cc; }
        .t-meta { font-size:11px;color:#c060a0; }
        .tag  { display:inline-block;background:#fce4ff;color:#9b2fbf;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:800;margin-right:4px; }
        .xpb  { display:inline-block;background:linear-gradient(135deg,#fce7f3,#ede9fe);color:#7c3aed;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:800; }
        .tip-box { background:rgba(232,121,249,.06);border-left:2.5px solid rgba(232,121,249,.4);padding:8px 12px;border-radius:0 10px 10px 0;margin-top:10px;font-size:12px;color:#a060b0;line-height:1.6; }

        .edt-btn  { background:#f9f0ff;border:1.5px solid #e8c0f8;color:#9b2fbf;border-radius:10px;padding:4px 9px;font-size:11px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;flex-shrink:0; }
        .save-btn { background:linear-gradient(135deg,#e879f9,#f472b6);border:none;color:#fff;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif; }
        .can-btn  { background:#f5f0ff;border:none;color:#a060c0;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif; }
        .del-btn  { background:#fff0f5;border:none;color:#e05080;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif; }
        .edit-form { background:#fff;border:2px solid #f0c8ff;border-radius:18px;padding:16px;margin-bottom:10px;box-shadow:0 2px 12px rgba(180,80,160,0.07); }
        .flbl { display:block;font-size:10px;font-weight:800;color:#c060a0;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;margin-top:10px; }
        .flbl:first-child { margin-top:0; }
        .finput { background:#fdf4ff;border:1.5px solid #e8c0f8;border-radius:10px;color:#4a0060;padding:8px 11px;font-size:13px;font-family:'Nunito',sans-serif;width:100%;outline:none;font-weight:700; }
        .finput:focus { border-color:#e879f9; }
        .finput::placeholder { color:#d0a0d0;font-weight:600; }

        .add-btn { width:100%;padding:14px;border-radius:18px;border:2.5px dashed #e8a0d5;background:transparent;color:#c060a0;font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;cursor:pointer;transition:all .2s; }
        .add-btn:hover { background:rgba(232,160,213,.08);border-color:#e060c8;color:#9b2fbf; }

        /* ── WEEKLY TRACKER ── */
        .wk-section { margin-bottom:20px; }
        .wk-title { font-size:12px;font-weight:900;color:#b060a0;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px; }

        .wk-summary { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px; }
        .wk-stat { background:#fff;border-radius:16px;padding:12px 14px;text-align:center;box-shadow:0 2px 10px rgba(180,80,160,0.08); }
        .wk-stat-val { font-size:22px;font-weight:900;color:#9b2fbf; }
        .wk-stat-lbl { font-size:11px;color:#c060a0;font-weight:700;margin-top:1px; }

        .wk-grid { display:grid;gap:10px; }
        .wk-day { background:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 2px 10px rgba(180,80,160,0.07); }
        .wk-day.today-day { background:linear-gradient(135deg,#fff0fb,#f5f0ff);border:2px solid #e8a0f0; }
        .wk-day.future-day { opacity:.55; }

        .wk-day-top { display:flex;align-items:center;gap:10px;margin-bottom:10px; }
        .wk-day-emoji { font-size:22px;flex-shrink:0; }
        .wk-day-name { font-size:13px;font-weight:900;color:#4a0060;flex:1; }
        .wk-day-focus { font-size:11px;color:#c060a0;font-weight:700; }
        .wk-today-badge { background:linear-gradient(135deg,#e879f9,#f472b6);color:#fff;font-size:10px;font-weight:900;padding:2px 9px;border-radius:20px; }
        .wk-pct-label { font-size:13px;font-weight:900;color:#9b2fbf;flex-shrink:0; }
        .wk-pct-label.perfect { color:#22c55e; }

        .wk-bar-track { height:8px;background:#f5e0ff;border-radius:4px;overflow:hidden; }
        .wk-bar-fill  { height:100%;border-radius:4px;transition:width .5s ease;background:linear-gradient(90deg,#e879f9,#f472b6); }
        .wk-bar-fill.perfect { background:linear-gradient(90deg,#34d399,#22c55e); }
        .wk-bar-fill.empty { background:#f0d0f5; }

        .wk-not-started { font-size:11px;color:#d0a0d0;font-weight:700;text-align:center;padding:4px 0; }

        .week-label { font-size:11px;color:#c060a0;font-weight:700;margin-bottom:14px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation:fadeUp .35s ease forwards; }
      `}</style>

      {/* ── HEADER ── */}
      <div className="hdr">
        <div className="streak-pill">🔥 {streak} 天连击</div>
        <div className="hdr-title">{goal.title} ✨</div>
        <div className="hdr-sub">{goal.subtitle}</div>
        {goal.targetWeight && <div style={{ fontSize: 12, color: "#c06aa0", marginTop: 4, position: "relative", zIndex: 1 }}>目标 {goal.targetWeight}{goal.targetDate && ` · ${goal.targetDate}`}</div>}
        <div style={{ position: "absolute", right: 18, top: 18, fontSize: 38, opacity: .45, zIndex: 1 }}>🌸</div>
        {!editingGoal && (
          <button className="edt-btn" onClick={() => { setGoalDraft(goal); setEditingGoal(true); }}
            style={{ position: "absolute", bottom: 16, right: 16, zIndex: 2, background: "rgba(255,255,255,.7)", border: "none" }}>
            编辑目标
          </button>
        )}
      </div>

      <div className="body">

        {/* Goal edit form */}
        {editingGoal && (
          <div className="edit-form fu" style={{ marginBottom: 14 }}>
            <label className="flbl">计划名称</label>
            <input className="finput" value={goalDraft.title} onChange={e => setGoalDraft(p => ({ ...p, title: e.target.value }))} placeholder="美女养成计划" />
            <label className="flbl">副标题</label>
            <input className="finput" value={goalDraft.subtitle} onChange={e => setGoalDraft(p => ({ ...p, subtitle: e.target.value }))} placeholder="减脂塑形 · 体态改善" />
            <label className="flbl">目标体重</label>
            <input className="finput" value={goalDraft.targetWeight} onChange={e => setGoalDraft(p => ({ ...p, targetWeight: e.target.value }))} placeholder="例如 52 kg" />
            <label className="flbl">目标日期</label>
            <input className="finput" type="date" value={goalDraft.targetDate} onChange={e => setGoalDraft(p => ({ ...p, targetDate: e.target.value }))} />
            <label className="flbl">我的动力</label>
            <input className="finput" value={goalDraft.notes} onChange={e => setGoalDraft(p => ({ ...p, notes: e.target.value }))} placeholder="写下你的动力..." />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="save-btn" onClick={saveGoal}>保存</button>
              <button className="can-btn" onClick={() => setEditingGoal(false)}>取消</button>
            </div>
          </div>
        )}

        {/* Progress card */}
        <div className="prog-card fu">
          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-val">{completedCount}<span style={{ fontSize: 14, color: "#c099cc", fontWeight: 700 }}>/{tasks.length}</span></div>
              <div className="stat-lbl">今日完成</div>
            </div>
            <div className="stat-box">
              <div className="stat-val" style={{ color: "#f472b6" }}>{totalXP}<span style={{ fontSize: 14, color: "#c099cc", fontWeight: 700 }}>/{maxXP}</span></div>
              <div className="stat-lbl">经验值 XP</div>
            </div>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${progress}%` }} /></div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#c060a0", marginTop: 6, fontWeight: 700 }}>{progress}% 完成</div>
          {completedCount === tasks.length && tasks.length > 0 && (
            <div style={{ marginTop: 10, textAlign: "center", padding: "10px", background: "linear-gradient(135deg,#fce4ff,#fce7f3)", borderRadius: 12, color: "#9b2fbf", fontSize: 13, fontWeight: 900 }}>
              🌸 今日全部完成！你真的很棒！
            </div>
          )}
        </div>

        {/* Today's focus */}
        <div className="focus-card fu">
          <div style={{ fontSize: 26 }}>{todayPlan.emoji}</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#c060a0", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 2 }}>今日重点</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#5a007a" }}>{todayPlan.focus}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[["today", "今日任务"], ["week", "每周计划"], ["tips", "减脂要点"]].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ── TODAY TAB ── */}
        {tab === "today" && (
          <div className="fu">
            {tasks.map(task => (
              editingTask === task.id ? (
                <div key={task.id} className="edit-form">
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input className="finput" value={taskDraft.icon} onChange={e => setTaskDraft(p => ({ ...p, icon: e.target.value }))} style={{ width: 52, textAlign: "center", fontSize: 20, flexShrink: 0 }} />
                    <input className="finput" value={taskDraft.title} onChange={e => setTaskDraft(p => ({ ...p, title: e.target.value }))} placeholder="任务名称" />
                  </div>
                  <label className="flbl">分类</label>
                  <input className="finput" value={taskDraft.category} onChange={e => setTaskDraft(p => ({ ...p, category: e.target.value }))} />
                  <label className="flbl">描述</label>
                  <input className="finput" value={taskDraft.description} onChange={e => setTaskDraft(p => ({ ...p, description: e.target.value }))} />
                  <label className="flbl">时长/目标</label>
                  <input className="finput" value={taskDraft.duration} onChange={e => setTaskDraft(p => ({ ...p, duration: e.target.value }))} />
                  <label className="flbl">科学提示</label>
                  <input className="finput" value={taskDraft.tip} onChange={e => setTaskDraft(p => ({ ...p, tip: e.target.value }))} />
                  <label className="flbl">经验值 XP</label>
                  <input className="finput" type="number" value={taskDraft.xp} onChange={e => setTaskDraft(p => ({ ...p, xp: Number(e.target.value) }))} />
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="save-btn" onClick={saveTask}>保存</button>
                    <button className="can-btn" onClick={() => setEditingTask(null)}>取消</button>
                    <button className="del-btn" onClick={() => deleteTask(task.id)} style={{ marginLeft: "auto" }}>删除</button>
                  </div>
                </div>
              ) : (
                <div key={task.id} className={`task-card ${checked[task.id] ? "done" : ""}`} onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                  <button className={`chk ${checked[task.id] ? "done" : ""}`} onClick={e => { e.stopPropagation(); toggle(task.id); }}>{checked[task.id] ? "✓" : ""}</button>
                  <div className="t-icon">{task.icon}</div>
                  <div className="t-info">
                    <div style={{ marginBottom: 3 }}><span className="tag">{task.category}</span><span className="xpb">+{task.xp} XP</span></div>
                    <div className="t-name">{task.title}</div>
                    <div className="t-meta">{task.description} · {task.duration}</div>
                  </div>
                  <button className="edt-btn" onClick={e => { e.stopPropagation(); startEditTask(task); }}>编辑</button>
                  {expanded === task.id && task.tip && <div className="tip-box" style={{ gridColumn: "1/-1" }}>💡 {task.tip}</div>}
                </div>
              )
            ))}
            {addingTask ? (
              <div className="edit-form">
                <div style={{ fontSize: 13, fontWeight: 900, color: "#e879f9", marginBottom: 10 }}>＋ 添加新任务</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input className="finput" value={newTask.icon} onChange={e => setNewTask(p => ({ ...p, icon: e.target.value }))} style={{ width: 52, textAlign: "center", fontSize: 20, flexShrink: 0 }} />
                  <input className="finput" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="任务名称 *" />
                </div>
                <label className="flbl">分类</label>
                <input className="finput" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))} placeholder="例如：皮肤护理" />
                <label className="flbl">描述</label>
                <input className="finput" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} placeholder="具体内容" />
                <label className="flbl">时长/目标</label>
                <input className="finput" value={newTask.duration} onChange={e => setNewTask(p => ({ ...p, duration: e.target.value }))} placeholder="例如：15 分钟" />
                <label className="flbl">提示</label>
                <input className="finput" value={newTask.tip} onChange={e => setNewTask(p => ({ ...p, tip: e.target.value }))} placeholder="小贴士（可选）" />
                <label className="flbl">经验值 XP</label>
                <input className="finput" type="number" value={newTask.xp} onChange={e => setNewTask(p => ({ ...p, xp: Number(e.target.value) }))} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button className="save-btn" onClick={saveNewTask}>添加</button>
                  <button className="can-btn" onClick={() => setAddingTask(false)}>取消</button>
                </div>
              </div>
            ) : (
              <button className="add-btn" onClick={() => setAddingTask(true)}>＋ 添加自定义任务</button>
            )}
          </div>
        )}

        {/* ── WEEK TAB ── */}
        {tab === "week" && (
          <div className="fu">

            {/* Weekly summary stats */}
            <div className="wk-section">
              <div className="wk-title">本周打卡总览</div>
              <div className="week-label">
                {weekDates[0]} ~ {weekDates[6]}
              </div>
              <div className="wk-summary">
                <div className="wk-stat">
                  <div className="wk-stat-val">{weekCompletedDays}<span style={{ fontSize: 14, color: "#c099cc", fontWeight: 700 }}>/7</span></div>
                  <div className="wk-stat-lbl">全勤天数</div>
                </div>
                <div className="wk-stat">
                  <div className="wk-stat-val" style={{ color: weekAvgPct >= 80 ? "#22c55e" : "#9b2fbf" }}>{weekAvgPct}%</div>
                  <div className="wk-stat-lbl">平均完成率</div>
                </div>
              </div>
            </div>

            {/* Per-day breakdown */}
            <div className="wk-section">
              <div className="wk-title">每日完成情况</div>
              <div className="wk-grid">
                {WEEKLY_PLAN.map((plan, i) => {
                  const pct = weekStats[i];
                  const isToday = i === todayIdx;
                  const isPast = i < todayIdx;
                  const isFuture = i > todayIdx;
                  const isPerfect = pct !== null && pct >= 100;
                  return (
                    <div key={i} className={`wk-day ${isToday ? "today-day" : ""} ${isFuture ? "future-day" : ""}`}>
                      <div className="wk-day-top">
                        <div className="wk-day-emoji">{plan.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span className="wk-day-name">{plan.day}</span>
                            {isToday && <span className="wk-today-badge">今天</span>}
                          </div>
                          <div className="wk-day-focus">{plan.focus}</div>
                        </div>
                        {pct !== null ? (
                          <span className={`wk-pct-label ${isPerfect ? "perfect" : ""}`}>
                            {isPerfect ? "✓ 100%" : `${pct}%`}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#d0a0d0", fontWeight: 700 }}>
                            {isFuture ? "—" : "未记录"}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {pct !== null ? (
                        <div className="wk-bar-track">
                          <div className={`wk-bar-fill ${isPerfect ? "perfect" : pct === 0 ? "empty" : ""}`} style={{ width: `${pct}%` }} />
                        </div>
                      ) : (
                        <div className="wk-bar-track">
                          <div className="wk-bar-fill empty" style={{ width: "0%" }} />
                        </div>
                      )}

                      {/* Motivational micro-copy */}
                      {isToday && pct !== null && !isPerfect && (
                        <div style={{ fontSize: 11, color: "#c060a0", fontWeight: 700, marginTop: 6 }}>
                          还差 {tasks.length - Math.round(pct * tasks.length / 100)} 项，加油！✨
                        </div>
                      )}
                      {isPerfect && (
                        <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 6 }}>
                          🌟 完美完成！
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ── TIPS TAB ── */}
        {tab === "tips" && (
          <div className="fu">
            {[
              { icon: "🔥", title: "热量缺口", content: "每日热量缺口控制在300–500kcal，避免过度节食导致肌肉流失。慢慢来，每周减重0.5–1kg最理想。" },
              { icon: "💪", title: "力量训练优先", content: "减脂期不能只做有氧！力量训练提高基础代谢率，帮你在休息时也持续燃烧脂肪，并塑造肌肉线条。" },
              { icon: "🥩", title: "蛋白质是关键", content: "高蛋白饮食保留肌肉、提升饱腹感、加速代谢。每天每公斤体重摄入1.6–2g蛋白质是减脂期标配。" },
              { icon: "✨", title: "皮肤与体态", content: "多喝水、保证睡眠、补充胶原蛋白和维生素C，减脂同时保持皮肤光泽弹嫩。" },
              { icon: "🧘", title: "体态改善重点", content: "圆肩驼背：每天拉伸胸大肌，强化中下斜方肌和菱形肌。骨盆前倾：强化臀部和腹部，拉伸髋屈肌。" },
              { icon: "🌙", title: "睡眠与恢复", content: "睡眠不足使皮质醇升高，抑制脂肪分解，增加暴食欲望。7–9小时优质睡眠是减脂的隐藏利器。" },
              { icon: "📏", title: "衡量进展", content: "不要只看体重！拍照对比、量围度（腰/臀/手臂）、感受体力变化，这些往往比体重更能反映真实进步。" },
            ].map((tip, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 20, padding: "16px", marginBottom: 10, boxShadow: "0 2px 12px rgba(180,80,160,.07)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#9b2fbf", marginBottom: 5 }}>{tip.title}</div>
                  <div style={{ fontSize: 13, color: "#a060b0", lineHeight: 1.7, fontWeight: 600 }}>{tip.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
