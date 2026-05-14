import { useState, useEffect, useRef } from "react";

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

const JS_TO_IDX = [6, 0, 1, 2, 3, 4, 5];

function getWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekDates(weekKey) {
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

// Falling petal component
function Petals() {
  const petals = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    dur: `${7 + Math.random() * 9}s`,
    delay: `${Math.random() * 12}s`,
    scale: 0.6 + Math.random() * 0.8,
    opacity: [0.55, 0.4, 0.65, 0.35, 0.5][i % 5],
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-30px) rotate(0deg)   translateX(0px);  opacity: .7; }
          40%  { transform: translateY(40vh)  rotate(120deg) translateX(18px);  opacity: .5; }
          80%  { transform: translateY(80vh)  rotate(260deg) translateX(-12px); opacity: .25; }
          100% { transform: translateY(105vh) rotate(360deg) translateX(8px);   opacity: 0; }
        }
      `}</style>
      {petals.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: p.left, top: 0,
          animation: `petalFall ${p.dur} ${p.delay} infinite linear`,
          transform: `scale(${p.scale})`,
        }}>
          <svg width="18" height="20" viewBox="0 0 18 20">
            <path d="M9 1 C12 4,16 8,14 13 C12 17,6 18,3 15 C0 12,1 6,4 3 C6 1,8 0,9 1Z"
              fill={`rgba(255,182,213,${p.opacity})`} />
          </svg>
        </div>
      ))}
    </div>
  );
}

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

  const weekDates = getWeekDates(weekKey);
  const weekStats = weekDates.map((dateStr) => {
    try {
      const raw = localStorage.getItem(`fit_${dateStr}`);
      if (!raw) return null;
      const d = JSON.parse(raw);
      const done = Object.values(d).filter(Boolean).length;
      return tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    } catch { return null; }
  });

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalXP = tasks.filter(t => checked[t.id]).reduce((s, t) => s + t.xp, 0);
  const maxXP = tasks.reduce((s, t) => s + t.xp, 0);
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const todayPlan = WEEKLY_PLAN[todayIdx];

  const weekCompletedDays = weekStats.filter(v => v !== null && v >= 100).length;
  const weekAvgPct = (() => {
    const valid = weekStats.filter(v => v !== null);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  })();

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

  // Shared glass style
  const glass = {
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,200,230,0.45)",
    borderRadius: 22,
  };
  const glassCard = { ...glass, padding: "14px 16px", marginBottom: 9 };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Nunito',sans-serif", color: "#3a003a", position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg,#fff8fb 0%,#ffeef6 20%,#fff3f9 40%,#fdf0ff 65%,#fff6fc 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #f0c0e0; border-radius: 2px; }
        .tab-btn { padding:7px 14px;border-radius:20px;border:1px solid rgba(255,190,220,0.45);background:rgba(255,255,255,0.65);color:#c068a0;cursor:pointer;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;transition:all .2s; }
        .tab-btn.active { background:linear-gradient(135deg,#f0abcb,#d946a8);border-color:transparent;color:#fff;box-shadow:0 4px 16px rgba(217,70,168,0.25); }
        .task-row { background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,190,220,0.4);border-radius:20px;padding:14px 16px;margin-bottom:9px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:transform .15s; }
        .task-row:hover { transform:translateX(3px); }
        .task-row.done { background:rgba(255,240,250,0.6);opacity:.72; }
        .chk { width:30px;height:30px;border-radius:50%;border:2.5px solid rgba(240,160,200,0.7);background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;transition:all .2s; }
        .chk.done { background:linear-gradient(135deg,#f0abcb,#d946a8);border-color:transparent;color:#fff; }
        .tag { display:inline-block;background:rgba(255,220,240,0.85);color:#a02880;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:800;margin-right:4px; }
        .xpb { display:inline-block;background:rgba(230,210,255,0.85);color:#7c3aed;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:800; }
        .edt-btn { background:rgba(255,255,255,0.75);border:1px solid rgba(220,160,200,0.5);color:#a0348a;border-radius:10px;padding:4px 9px;font-size:11px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;flex-shrink:0; }
        .save-btn { background:linear-gradient(135deg,#f0abcb,#d946a8);border:none;color:#fff;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;box-shadow:0 3px 12px rgba(217,70,168,0.25); }
        .can-btn { background:rgba(255,255,255,0.7);border:1px solid rgba(220,160,200,0.4);color:#a060c0;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif; }
        .del-btn { background:rgba(255,230,235,0.8);border:1px solid rgba(255,160,180,0.4);color:#e05080;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif; }
        .finput { background:rgba(255,255,255,0.7);border:1.5px solid rgba(240,180,220,0.6);border-radius:10px;color:#4a0060;padding:8px 11px;font-size:13px;font-family:'Nunito',sans-serif;width:100%;outline:none;font-weight:700; }
        .finput:focus { border-color:rgba(217,70,168,0.5); }
        .finput::placeholder { color:#d0a0c8;font-weight:600; }
        .flbl { display:block;font-size:10px;font-weight:800;color:#c068a0;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;margin-top:10px; }
        .flbl:first-child { margin-top:0; }
        .edit-form { background:rgba(255,255,255,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1.5px solid rgba(240,180,220,0.5);border-radius:20px;padding:16px;margin-bottom:10px; }
        .tip-box { background:rgba(255,210,235,0.3);border-left:2.5px solid rgba(217,70,168,0.35);padding:8px 12px;border-radius:0 10px 10px 0;margin-top:10px;font-size:12px;color:#a060b0;line-height:1.6;font-weight:700; }
        .add-task-btn { width:100%;padding:13px;border-radius:18px;border:2px dashed rgba(230,150,200,0.5);background:rgba(255,255,255,0.4);color:#c068a0;font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;cursor:pointer;transition:all .2s; }
        .add-task-btn:hover { background:rgba(255,220,240,0.4);border-color:rgba(217,70,168,0.4); }
        .wk-day { background:rgba(255,255,255,0.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,190,220,0.4);border-radius:18px;padding:14px 16px;margin-bottom:9px; }
        .wk-day.today-day { background:rgba(255,228,245,0.7);border:1.5px solid rgba(217,70,168,0.3); }
        .wk-day.future-day { opacity:.55; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation:fadeUp .35s ease forwards; }
      `}</style>

      {/* Background blobs */}
      {[
        { w:340,h:340,bg:"rgba(255,182,213,0.28)",top:-80,right:-60 },
        { w:260,h:260,bg:"rgba(255,210,240,0.22)",bottom:60,left:-60 },
        { w:180,h:180,bg:"rgba(238,180,255,0.18)",top:"45%",right:10 },
        { w:140,h:140,bg:"rgba(255,230,245,0.35)",top:"30%",left:"5%" },
      ].map((b,i) => (
        <div key={i} style={{ position:"fixed",borderRadius:"50%",filter:"blur(60px)",pointerEvents:"none",zIndex:0,
          width:b.w,height:b.h,background:b.bg,top:b.top,bottom:b.bottom,left:b.left,right:b.right }} />
      ))}

      <Petals />

      {/* Bottom fade */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,height:80,
        background:"linear-gradient(transparent,rgba(255,240,250,0.85))",pointerEvents:"none",zIndex:10 }} />

      <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 72px",position:"relative",zIndex:2 }}>

        {/* ── HEADER ── */}
        <div style={{ ...glass, padding:"22px 20px 20px", marginBottom:14, position:"relative", overflow:"hidden" }} className="fu">
          <div style={{ position:"absolute",width:120,height:120,borderRadius:"50%",background:"rgba(255,190,220,0.2)",top:-30,right:-20 }} />
          <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.75)",border:"1px solid rgba(255,180,210,0.5)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:800,color:"#c0448a",marginBottom:10 }}>
            🔥 {streak} 天连击
          </div>
          {editingGoal ? (
            <div>
              <label className="flbl">计划名称</label>
              <input className="finput" value={goalDraft.title} onChange={e=>setGoalDraft(p=>({...p,title:e.target.value}))} placeholder="美女养成计划" />
              <label className="flbl">副标题</label>
              <input className="finput" value={goalDraft.subtitle} onChange={e=>setGoalDraft(p=>({...p,subtitle:e.target.value}))} placeholder="减脂塑形 · 体态改善" />
              <label className="flbl">目标体重</label>
              <input className="finput" value={goalDraft.targetWeight} onChange={e=>setGoalDraft(p=>({...p,targetWeight:e.target.value}))} placeholder="例如 52 kg" />
              <label className="flbl">目标日期</label>
              <input className="finput" type="date" value={goalDraft.targetDate} onChange={e=>setGoalDraft(p=>({...p,targetDate:e.target.value}))} />
              <label className="flbl">我的动力</label>
              <input className="finput" value={goalDraft.notes} onChange={e=>setGoalDraft(p=>({...p,notes:e.target.value}))} placeholder="写下你的动力..." />
              <div style={{ display:"flex",gap:8,marginTop:14 }}>
                <button className="save-btn" onClick={saveGoal}>保存</button>
                <button className="can-btn" onClick={()=>setEditingGoal(false)}>取消</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:24,fontWeight:900,color:"#8a1a8a",lineHeight:1.15,marginBottom:3,position:"relative",zIndex:1 }}>
                {goal.title} ✨
              </div>
              <div style={{ fontSize:12,color:"#c070a8",fontWeight:700,position:"relative",zIndex:1 }}>{goal.subtitle}</div>
              {goal.targetWeight && <div style={{ fontSize:11,color:"#c070a8",marginTop:3,fontWeight:700 }}>目标 {goal.targetWeight}{goal.targetDate && ` · ${goal.targetDate}`}</div>}
              {goal.notes && <div style={{ fontSize:11,color:"#c090b8",marginTop:2,fontStyle:"italic" }}>{goal.notes}</div>}
              <div style={{ position:"absolute",right:18,top:18,fontSize:34,opacity:.45,zIndex:1 }}>🌸</div>
              <button className="edt-btn" onClick={()=>{ setGoalDraft(goal); setEditingGoal(true); }}
                style={{ position:"absolute",bottom:14,right:14,zIndex:2,background:"rgba(255,255,255,0.75)",border:"1px solid rgba(220,160,200,0.5)" }}>
                编辑目标
              </button>
            </>
          )}
        </div>

        {/* ── PROGRESS ── */}
        <div style={{ ...glass, padding:"16px 18px", marginBottom:12 }} className="fu">
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:13 }}>
            {[
              { val:`${completedCount}`, sub:`/${tasks.length}`, lbl:"今日完成", color:"#9b28bf" },
              { val:`${totalXP}`, sub:`/${maxXP}`, lbl:"经验值 XP", color:"#d946a8" },
            ].map((s,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,190,220,0.35)",borderRadius:16,padding:"12px 14px",textAlign:"center" }}>
                <div style={{ fontSize:22,fontWeight:900,color:s.color }}>
                  {s.val}<span style={{ fontSize:14,color:"#c09ac0",fontWeight:700 }}>{s.sub}</span>
                </div>
                <div style={{ fontSize:11,color:"#c068a0",fontWeight:700,marginTop:1 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ height:10,background:"rgba(240,200,230,0.5)",borderRadius:5,overflow:"hidden" }}>
            <div style={{ height:"100%",borderRadius:5,background:"linear-gradient(90deg,#f9a8d4,#d946a8)",width:`${progress}%`,transition:"width .6s" }} />
          </div>
          <div style={{ textAlign:"right",fontSize:11,color:"#c068a0",marginTop:5,fontWeight:700 }}>{progress}% 完成</div>
          {completedCount === tasks.length && tasks.length > 0 && (
            <div style={{ marginTop:10,textAlign:"center",padding:"10px",background:"rgba(255,220,240,0.6)",border:"1px solid rgba(217,70,168,0.2)",borderRadius:14,color:"#9b28bf",fontSize:13,fontWeight:900 }}>
              🌸 今日全部完成！你真的很棒！
            </div>
          )}
        </div>

        {/* ── TODAY FOCUS ── */}
        <div style={{ ...glass, padding:"13px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }} className="fu">
          <div style={{ fontSize:26 }}>{todayPlan.emoji}</div>
          <div>
            <div style={{ fontSize:10,fontWeight:900,color:"#c070a0",letterSpacing:".08em",textTransform:"uppercase",marginBottom:2 }}>今日重点</div>
            <div style={{ fontSize:14,fontWeight:900,color:"#6a0080" }}>{todayPlan.focus}</div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex",gap:6,marginBottom:13,flexWrap:"wrap" }}>
          {[["today","今日任务"],["week","每周计划"],["tips","减脂要点"]].map(([k,l]) => (
            <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ── TODAY TAB ── */}
        {tab === "today" && (
          <div className="fu">
            {tasks.map(task => (
              editingTask === task.id ? (
                <div key={task.id} className="edit-form">
                  <div style={{ display:"flex",gap:8,marginBottom:8 }}>
                    <input className="finput" value={taskDraft.icon} onChange={e=>setTaskDraft(p=>({...p,icon:e.target.value}))} style={{ width:52,textAlign:"center",fontSize:20,flexShrink:0 }} />
                    <input className="finput" value={taskDraft.title} onChange={e=>setTaskDraft(p=>({...p,title:e.target.value}))} placeholder="任务名称" />
                  </div>
                  <label className="flbl">分类</label>
                  <input className="finput" value={taskDraft.category} onChange={e=>setTaskDraft(p=>({...p,category:e.target.value}))} />
                  <label className="flbl">描述</label>
                  <input className="finput" value={taskDraft.description} onChange={e=>setTaskDraft(p=>({...p,description:e.target.value}))} />
                  <label className="flbl">时长/目标</label>
                  <input className="finput" value={taskDraft.duration} onChange={e=>setTaskDraft(p=>({...p,duration:e.target.value}))} />
                  <label className="flbl">科学提示</label>
                  <input className="finput" value={taskDraft.tip} onChange={e=>setTaskDraft(p=>({...p,tip:e.target.value}))} />
                  <label className="flbl">经验值 XP</label>
                  <input className="finput" type="number" value={taskDraft.xp} onChange={e=>setTaskDraft(p=>({...p,xp:Number(e.target.value)}))} />
                  <div style={{ display:"flex",gap:8,marginTop:14 }}>
                    <button className="save-btn" onClick={saveTask}>保存</button>
                    <button className="can-btn" onClick={()=>setEditingTask(null)}>取消</button>
                    <button className="del-btn" onClick={()=>deleteTask(task.id)} style={{ marginLeft:"auto" }}>删除</button>
                  </div>
                </div>
              ) : (
                <div key={task.id} className={`task-row ${checked[task.id]?"done":""}`} onClick={()=>setExpanded(expanded===task.id?null:task.id)}>
                  <button className={`chk ${checked[task.id]?"done":""}`} onClick={e=>{e.stopPropagation();toggle(task.id);}}>{checked[task.id]?"✓":""}</button>
                  <div style={{ fontSize:22,flexShrink:0 }}>{task.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ marginBottom:3 }}><span className="tag">{task.category}</span><span className="xpb">+{task.xp} XP</span></div>
                    <div style={{ fontSize:14,fontWeight:800,color:checked[task.id]?"#c09ac0":"#5a006a",textDecoration:checked[task.id]?"line-through":"none" }}>{task.title}</div>
                    <div style={{ fontSize:11,color:"#c068a0",fontWeight:700 }}>{task.description} · {task.duration}</div>
                  </div>
                  <button className="edt-btn" onClick={e=>{e.stopPropagation();startEditTask(task);}}>编辑</button>
                  {expanded===task.id && task.tip && <div className="tip-box" style={{ width:"100%" }}>💡 {task.tip}</div>}
                </div>
              )
            ))}
            {addingTask ? (
              <div className="edit-form">
                <div style={{ fontSize:13,fontWeight:900,color:"#d946a8",marginBottom:10 }}>＋ 添加新任务</div>
                <div style={{ display:"flex",gap:8,marginBottom:8 }}>
                  <input className="finput" value={newTask.icon} onChange={e=>setNewTask(p=>({...p,icon:e.target.value}))} style={{ width:52,textAlign:"center",fontSize:20,flexShrink:0 }} />
                  <input className="finput" value={newTask.title} onChange={e=>setNewTask(p=>({...p,title:e.target.value}))} placeholder="任务名称 *" />
                </div>
                <label className="flbl">分类</label>
                <input className="finput" value={newTask.category} onChange={e=>setNewTask(p=>({...p,category:e.target.value}))} placeholder="例如：皮肤护理" />
                <label className="flbl">描述</label>
                <input className="finput" value={newTask.description} onChange={e=>setNewTask(p=>({...p,description:e.target.value}))} placeholder="具体内容" />
                <label className="flbl">时长/目标</label>
                <input className="finput" value={newTask.duration} onChange={e=>setNewTask(p=>({...p,duration:e.target.value}))} placeholder="例如：15 分钟" />
                <label className="flbl">提示</label>
                <input className="finput" value={newTask.tip} onChange={e=>setNewTask(p=>({...p,tip:e.target.value}))} placeholder="小贴士（可选）" />
                <label className="flbl">经验值 XP</label>
                <input className="finput" type="number" value={newTask.xp} onChange={e=>setNewTask(p=>({...p,xp:Number(e.target.value)}))} />
                <div style={{ display:"flex",gap:8,marginTop:14 }}>
                  <button className="save-btn" onClick={saveNewTask}>添加</button>
                  <button className="can-btn" onClick={()=>setAddingTask(false)}>取消</button>
                </div>
              </div>
            ) : (
              <button className="add-task-btn" onClick={()=>setAddingTask(true)}>＋ 添加自定义任务</button>
            )}
          </div>
        )}

        {/* ── WEEK TAB ── */}
        {tab === "week" && (
          <div className="fu">
            <div style={{ fontSize:12,fontWeight:900,color:"#b060a0",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12 }}>本周打卡总览</div>
            <div style={{ fontSize:11,color:"#c068a0",fontWeight:700,marginBottom:14 }}>{weekDates[0]} ~ {weekDates[6]}</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18 }}>
              <div style={{ background:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,190,220,0.35)",borderRadius:16,padding:"12px 14px",textAlign:"center" }}>
                <div style={{ fontSize:22,fontWeight:900,color:"#9b28bf" }}>{weekCompletedDays}<span style={{ fontSize:14,color:"#c09ac0",fontWeight:700 }}>/7</span></div>
                <div style={{ fontSize:11,color:"#c068a0",fontWeight:700,marginTop:1 }}>全勤天数</div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,190,220,0.35)",borderRadius:16,padding:"12px 14px",textAlign:"center" }}>
                <div style={{ fontSize:22,fontWeight:900,color:weekAvgPct>=80?"#059669":"#9b28bf" }}>{weekAvgPct}%</div>
                <div style={{ fontSize:11,color:"#c068a0",fontWeight:700,marginTop:1 }}>平均完成率</div>
              </div>
            </div>

            <div style={{ fontSize:12,fontWeight:900,color:"#b060a0",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12 }}>每日完成情况</div>
            {WEEKLY_PLAN.map((plan, i) => {
              const pct = weekStats[i];
              const isToday = i === todayIdx;
              const isFuture = i > todayIdx;
              const isPerfect = pct !== null && pct >= 100;
              return (
                <div key={i} className={`wk-day ${isToday?"today-day":""} ${isFuture?"future-day":""}`}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                    <span style={{ fontSize:22 }}>{plan.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                        <span style={{ fontSize:13,fontWeight:900,color:"#5a006a" }}>{plan.day}</span>
                        {isToday && <span style={{ background:"linear-gradient(135deg,#f0abcb,#d946a8)",color:"#fff",fontSize:10,fontWeight:900,padding:"2px 9px",borderRadius:20 }}>今天</span>}
                      </div>
                      <div style={{ fontSize:11,color:"#c068a0",fontWeight:700 }}>{plan.focus}</div>
                    </div>
                    <span style={{ fontSize:13,fontWeight:900,color:isPerfect?"#059669":"#9b28bf",flexShrink:0 }}>
                      {pct !== null ? (isPerfect ? "✓ 100%" : `${pct}%`) : (isFuture ? "—" : "未记录")}
                    </span>
                  </div>
                  <div style={{ height:8,background:"rgba(240,200,230,0.5)",borderRadius:4,overflow:"hidden" }}>
                    <div style={{ height:"100%",borderRadius:4,
                      background:isPerfect?"linear-gradient(90deg,#6ee7b7,#10b981)":"linear-gradient(90deg,#f9a8d4,#d946a8)",
                      width:pct!==null?`${pct}%`:"0%",transition:"width .5s" }} />
                  </div>
                  {isToday && pct!==null && !isPerfect && (
                    <div style={{ fontSize:11,color:"#c060a0",fontWeight:700,marginTop:6 }}>
                      还差 {tasks.length - Math.round(pct*tasks.length/100)} 项，加油！✨
                    </div>
                  )}
                  {isPerfect && <div style={{ fontSize:11,color:"#16a34a",fontWeight:700,marginTop:6 }}>🌟 完美完成！</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TIPS TAB ── */}
        {tab === "tips" && (
          <div className="fu">
            {[
              { icon:"🔥", title:"热量缺口", content:"每日热量缺口控制在300–500kcal，避免过度节食导致肌肉流失。慢慢来，每周减重0.5–1kg最理想。" },
              { icon:"💪", title:"力量训练优先", content:"减脂期不能只做有氧！力量训练提高基础代谢率，帮你在休息时也持续燃烧脂肪，并塑造肌肉线条。" },
              { icon:"🥩", title:"蛋白质是关键", content:"高蛋白饮食保留肌肉、提升饱腹感、加速代谢。每天每公斤体重摄入1.6–2g蛋白质是减脂期标配。" },
              { icon:"✨", title:"皮肤与体态", content:"多喝水、保证睡眠、补充胶原蛋白和维生素C，减脂同时保持皮肤光泽弹嫩。" },
              { icon:"🧘", title:"体态改善重点", content:"圆肩驼背：每天拉伸胸大肌，强化中下斜方肌和菱形肌。骨盆前倾：强化臀部和腹部，拉伸髋屈肌。" },
              { icon:"🌙", title:"睡眠与恢复", content:"睡眠不足使皮质醇升高，抑制脂肪分解，增加暴食欲望。7–9小时优质睡眠是减脂的隐藏利器。" },
              { icon:"📏", title:"衡量进展", content:"不要只看体重！拍照对比、量围度（腰/臀/手臂）、感受体力变化，这些往往比体重更能反映真实进步。" },
            ].map((tip,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.55)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255,190,220,0.4)",borderRadius:20,padding:"16px",marginBottom:9,display:"flex",gap:12,alignItems:"flex-start" }}>
                <span style={{ fontSize:22,flexShrink:0 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontSize:14,fontWeight:900,color:"#9b28bf",marginBottom:5 }}>{tip.title}</div>
                  <div style={{ fontSize:13,color:"#a060b0",lineHeight:1.7,fontWeight:700 }}>{tip.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
