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

const todayIndex = new Date().getDay();
const dayMap = [6, 0, 1, 2, 3, 4, 5];

function genId() { return Math.random().toString(36).slice(2, 8); }

export default function FitnessTracker() {
  const todayKey = new Date().toISOString().split("T")[0];

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
  const [newTask, setNewTask] = useState({ icon:"✨", title:"", category:"", description:"", duration:"", tip:"", xp:20 });

  useEffect(() => { try { localStorage.setItem(`fit_${todayKey}`, JSON.stringify(checked)); } catch {} }, [checked, todayKey]);
  useEffect(() => { try { localStorage.setItem("fit_tasks", JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { try { localStorage.setItem("fit_goal", JSON.stringify(goal)); } catch {} }, [goal]);

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalXP = tasks.filter(t => checked[t.id]).reduce((s, t) => s + t.xp, 0);
  const maxXP = tasks.reduce((s, t) => s + t.xp, 0);
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const todayPlan = WEEKLY_PLAN[dayMap[todayIndex]];

  const saveGoal = () => { setGoal(goalDraft); setEditingGoal(false); };
  const startEditTask = (task) => { setTaskDraft({ ...task }); setEditingTask(task.id); setExpanded(null); };
  const saveTask = () => { setTasks(ts => ts.map(t => t.id === editingTask ? { ...taskDraft } : t)); setEditingTask(null); setTaskDraft(null); };
  const deleteTask = (id) => { setTasks(ts => ts.filter(t => t.id !== id)); setEditingTask(null); };
  const saveNewTask = () => {
    if (!newTask.title.trim()) return;
    setTasks(ts => [...ts, { ...newTask, id: genId() }]);
    setNewTask({ icon:"✨", title:"", category:"", description:"", duration:"", tip:"", xp:20 });
    setAddingTask(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", fontFamily:"'DM Sans',sans-serif", color:"#e8e4dc", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;}
        .bg-orb{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0}
        .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;backdrop-filter:blur(10px)}
        .task-item{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;transition:all 0.2s}
        .task-item.done{background:rgba(255,182,255,0.06);border-color:rgba(255,182,255,0.2)}
        .task-item:hover{transform:translateX(3px)}
        .check-btn{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all 0.2s;flex-shrink:0}
        .check-btn.done{background:#ffb6ff;border-color:#ffb6ff;color:#3a003a}
        .tab-btn{padding:8px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;transition:all 0.2s}
        .tab-btn.active{background:rgba(255,182,255,0.15);border-color:#ffb6ff;color:#ffb6ff}
        .progress-bar{height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden}
        .progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#ffb6ff,#ff82d5);transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1)}
        .xp-badge{background:rgba(255,130,213,0.15);border:1px solid rgba(255,130,213,0.3);color:#ff82d5;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}
        .category-tag{font-size:10px;padding:2px 7px;border-radius:6px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.4)}
        .tip-box{background:rgba(255,182,255,0.05);border-left:2px solid rgba(255,182,255,0.4);padding:8px 12px;border-radius:0 8px 8px 0;margin-top:10px;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5}
        .edit-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.45);padding:4px 10px;border-radius:8px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;flex-shrink:0}
        .edit-btn:hover{background:rgba(255,182,255,0.1);border-color:rgba(255,182,255,0.3);color:#ffb6ff}
        .delete-btn{background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.2);color:rgba(255,100,100,0.7);padding:6px 14px;border-radius:10px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif}
        .save-btn{background:rgba(255,182,255,0.2);border:1px solid rgba(255,182,255,0.4);color:#ffb6ff;padding:6px 14px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
        .cancel-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);padding:6px 14px;border-radius:10px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif}
        .mini-input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;padding:7px 10px;font-size:13px;font-family:'DM Sans',sans-serif;width:100%;outline:none;transition:border 0.2s}
        .mini-input:focus{border-color:rgba(255,182,255,0.4)}
        .mini-input::placeholder{color:rgba(255,255,255,0.2)}
        .field-label{display:block;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;margin-top:10px}
        .field-label:first-child{margin-top:0}
        .edit-form{background:rgba(255,255,255,0.04);border:1px solid rgba(255,182,255,0.2);border-radius:14px;padding:14px;margin-bottom:10px}
        .week-day-card{padding:12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)}
        .week-day-card.active-day{background:rgba(255,182,255,0.08);border-color:rgba(255,182,255,0.3)}
        .add-task-btn{width:100%;padding:12px;border-radius:14px;border:1px dashed rgba(255,182,255,0.3);background:rgba(255,182,255,0.04);color:rgba(255,182,255,0.6);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all 0.2s}
        .add-task-btn:hover{background:rgba(255,182,255,0.08);border-color:rgba(255,182,255,0.5);color:#ffb6ff}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.35s ease forwards}
      `}</style>

      <div className="bg-orb" style={{ width:350,height:350,background:"rgba(255,182,255,0.07)",top:-80,right:-80 }} />
      <div className="bg-orb" style={{ width:250,height:250,background:"rgba(255,130,213,0.05)",bottom:80,left:-60 }} />

      <div style={{ maxWidth:480, margin:"0 auto", padding:"28px 16px 80px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
              {new Date().toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"long"})}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:15 }}>🔥</span>
              <span style={{ fontSize:13, color:"#ff8c42", fontWeight:700 }}>{streak} 天连击</span>
            </div>
          </div>

          {editingGoal ? (
            <div className="edit-form">
              <label className="field-label">计划名称</label>
              <input className="mini-input" value={goalDraft.title} onChange={e=>setGoalDraft(p=>({...p,title:e.target.value}))} placeholder="美女养成计划" />
              <label className="field-label">副标题</label>
              <input className="mini-input" value={goalDraft.subtitle} onChange={e=>setGoalDraft(p=>({...p,subtitle:e.target.value}))} placeholder="减脂塑形 · 体态改善" />
              <label className="field-label">目标体重（可选）</label>
              <input className="mini-input" value={goalDraft.targetWeight} onChange={e=>setGoalDraft(p=>({...p,targetWeight:e.target.value}))} placeholder="例如 52 kg" />
              <label className="field-label">目标日期（可选）</label>
              <input className="mini-input" type="date" value={goalDraft.targetDate} onChange={e=>setGoalDraft(p=>({...p,targetDate:e.target.value}))} />
              <label className="field-label">我的动力</label>
              <input className="mini-input" value={goalDraft.notes} onChange={e=>setGoalDraft(p=>({...p,notes:e.target.value}))} placeholder="写下你的动力..." />
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button className="save-btn" onClick={saveGoal}>保存</button>
                <button className="cancel-btn" onClick={()=>setEditingGoal(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
              <div>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, letterSpacing:"-0.02em", color:"#fff", lineHeight:1.15 }}>
                  <span style={{ color:"#ffb6ff" }}>{goal.title.slice(0,2)}</span>{goal.title.slice(2)}
                </h1>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:3 }}>{goal.subtitle}</p>
                {goal.targetWeight && <p style={{ fontSize:12, color:"rgba(255,182,255,0.6)", marginTop:2 }}>目标 {goal.targetWeight}{goal.targetDate && ` · ${goal.targetDate}`}</p>}
                {goal.notes && <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:2, fontStyle:"italic" }}>{goal.notes}</p>}
              </div>
              <button className="edit-btn" onClick={()=>{ setGoalDraft(goal); setEditingGoal(true); }} style={{ marginTop:4 }}>编辑目标</button>
            </div>
          )}
        </div>

        {/* Progress card */}
        <div className="card fade-up" style={{ padding:"18px 20px", marginBottom:14, animationDelay:"0.05s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>今日完成度</p>
              <p style={{ fontSize:26, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#fff" }}>
                {completedCount}<span style={{ fontSize:14, color:"rgba(255,255,255,0.3)", fontWeight:400 }}>/{tasks.length}</span>
              </p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>经验值</p>
              <p style={{ fontSize:26, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#ff82d5" }}>
                {totalXP}<span style={{ fontSize:14, color:"rgba(255,255,255,0.3)", fontWeight:400 }}>/{maxXP}</span>
              </p>
            </div>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width:`${progress}%` }} /></div>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:6, textAlign:"right" }}>{progress}% 完成</p>
          {completedCount === tasks.length && tasks.length > 0 && (
            <div style={{ marginTop:12, textAlign:"center", padding:"8px", background:"rgba(255,182,255,0.1)", borderRadius:8, color:"#ffb6ff", fontSize:13, fontWeight:600 }}>
              🌸 今日全部完成！你真的很棒！
            </div>
          )}
        </div>

        {/* Today's focus */}
        <div className="card fade-up" style={{ padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12, animationDelay:"0.08s" }}>
          <span style={{ fontSize:22 }}>{todayPlan.emoji}</span>
          <div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>今日重点</p>
            <p style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{todayPlan.focus}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
          {[["today","今日任务"],["week","每周计划"],["tips","减脂要点"]].map(([key,label])=>(
            <button key={key} className={`tab-btn ${tab===key?"active":""}`} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </div>

        {/* TODAY TAB */}
        {tab === "today" && (
          <div className="fade-up">
            {tasks.map((task) => (
              editingTask === task.id ? (
                <div key={task.id} className="edit-form">
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <input className="mini-input" value={taskDraft.icon} onChange={e=>setTaskDraft(p=>({...p,icon:e.target.value}))} style={{ width:52, textAlign:"center", fontSize:20, flexShrink:0 }} />
                    <input className="mini-input" value={taskDraft.title} onChange={e=>setTaskDraft(p=>({...p,title:e.target.value}))} placeholder="任务名称" />
                  </div>
                  <label className="field-label">分类</label>
                  <input className="mini-input" value={taskDraft.category} onChange={e=>setTaskDraft(p=>({...p,category:e.target.value}))} />
                  <label className="field-label">描述</label>
                  <input className="mini-input" value={taskDraft.description} onChange={e=>setTaskDraft(p=>({...p,description:e.target.value}))} />
                  <label className="field-label">时长/目标</label>
                  <input className="mini-input" value={taskDraft.duration} onChange={e=>setTaskDraft(p=>({...p,duration:e.target.value}))} />
                  <label className="field-label">科学提示</label>
                  <input className="mini-input" value={taskDraft.tip} onChange={e=>setTaskDraft(p=>({...p,tip:e.target.value}))} />
                  <label className="field-label">经验值 XP</label>
                  <input className="mini-input" type="number" value={taskDraft.xp} onChange={e=>setTaskDraft(p=>({...p,xp:Number(e.target.value)}))} />
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    <button className="save-btn" onClick={saveTask}>保存</button>
                    <button className="cancel-btn" onClick={()=>setEditingTask(null)}>取消</button>
                    <button className="delete-btn" onClick={()=>deleteTask(task.id)} style={{ marginLeft:"auto" }}>删除</button>
                  </div>
                </div>
              ) : (
                <div key={task.id} className={`task-item ${checked[task.id]?"done":""}`} onClick={()=>setExpanded(expanded===task.id?null:task.id)}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <button className={`check-btn ${checked[task.id]?"done":""}`} onClick={e=>{e.stopPropagation();toggle(task.id);}}>
                      {checked[task.id]?"✓":""}
                    </button>
                    <span style={{ fontSize:20 }}>{task.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3, flexWrap:"wrap" }}>
                        <span className="category-tag">{task.category}</span>
                        <span className="xp-badge">+{task.xp} XP</span>
                      </div>
                      <p style={{ fontSize:15, fontWeight:600, color:checked[task.id]?"rgba(255,255,255,0.4)":"#fff", textDecoration:checked[task.id]?"line-through":"none" }}>{task.title}</p>
                      <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{task.description} · {task.duration}</p>
                    </div>
                    <button className="edit-btn" onClick={e=>{e.stopPropagation();startEditTask(task);}}>编辑</button>
                  </div>
                  {expanded===task.id && task.tip && <div className="tip-box">💡 {task.tip}</div>}
                </div>
              )
            ))}

            {addingTask ? (
              <div className="edit-form">
                <p style={{ fontSize:13, fontWeight:600, color:"#ffb6ff", marginBottom:10 }}>＋ 添加新任务</p>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input className="mini-input" value={newTask.icon} onChange={e=>setNewTask(p=>({...p,icon:e.target.value}))} style={{ width:52, textAlign:"center", fontSize:20, flexShrink:0 }} />
                  <input className="mini-input" value={newTask.title} onChange={e=>setNewTask(p=>({...p,title:e.target.value}))} placeholder="任务名称 *" />
                </div>
                <label className="field-label">分类</label>
                <input className="mini-input" value={newTask.category} onChange={e=>setNewTask(p=>({...p,category:e.target.value}))} placeholder="例如：皮肤护理" />
                <label className="field-label">描述</label>
                <input className="mini-input" value={newTask.description} onChange={e=>setNewTask(p=>({...p,description:e.target.value}))} placeholder="具体内容" />
                <label className="field-label">时长/目标</label>
                <input className="mini-input" value={newTask.duration} onChange={e=>setNewTask(p=>({...p,duration:e.target.value}))} placeholder="例如：15 分钟" />
                <label className="field-label">提示（可选）</label>
                <input className="mini-input" value={newTask.tip} onChange={e=>setNewTask(p=>({...p,tip:e.target.value}))} placeholder="小贴士" />
                <label className="field-label">经验值 XP</label>
                <input className="mini-input" type="number" value={newTask.xp} onChange={e=>setNewTask(p=>({...p,xp:Number(e.target.value)}))} />
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button className="save-btn" onClick={saveNewTask}>添加</button>
                  <button className="cancel-btn" onClick={()=>setAddingTask(false)}>取消</button>
                </div>
              </div>
            ) : (
              <button className="add-task-btn" onClick={()=>setAddingTask(true)}>＋ 添加自定义任务</button>
            )}
          </div>
        )}

        {/* WEEK TAB */}
        {tab === "week" && (
          <div className="fade-up" style={{ display:"grid", gap:10 }}>
            {WEEKLY_PLAN.map((plan, i) => (
              <div key={i} className={`week-day-card ${dayMap[todayIndex]===i?"active-day":""}`}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:22 }}>{plan.emoji}</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:dayMap[todayIndex]===i?"#ffb6ff":"rgba(255,255,255,0.5)", marginBottom:2 }}>
                      {plan.day}{dayMap[todayIndex]===i&&" · 今天"}
                    </p>
                    <p style={{ fontSize:14, color:"#fff", fontWeight:500 }}>{plan.focus}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TIPS TAB */}
        {tab === "tips" && (
          <div className="fade-up">
            {[
              { icon:"🔥", title:"热量缺口", content:"每日热量缺口控制在300–500kcal，避免过度节食导致肌肉流失。慢慢来，每周减重0.5–1kg最理想。" },
              { icon:"💪", title:"力量训练优先", content:"减脂期不能只做有氧！力量训练提高基础代谢率，帮你在休息时也持续燃烧脂肪，并塑造肌肉线条。" },
              { icon:"🥩", title:"蛋白质是关键", content:"高蛋白饮食保留肌肉、提升饱腹感、加速代谢。每天每公斤体重摄入1.6–2g蛋白质是减脂期标配。" },
              { icon:"✨", title:"皮肤与体态", content:"多喝水、保证睡眠、补充胶原蛋白和维生素C，减脂同时保持皮肤光泽弹嫩。" },
              { icon:"🧘", title:"体态改善重点", content:"圆肩驼背：每天拉伸胸大肌，强化中下斜方肌和菱形肌。骨盆前倾：强化臀部和腹部，拉伸髋屈肌。" },
              { icon:"🌙", title:"睡眠与恢复", content:"睡眠不足使皮质醇升高，抑制脂肪分解，增加暴食欲望。7–9小时优质睡眠是减脂的隐藏利器。" },
              { icon:"📏", title:"衡量进展", content:"不要只看体重！拍照对比、量围度（腰/臀/手臂）、感受体力变化，这些往往比体重更能反映真实进步。" },
            ].map((tip, i) => (
              <div key={i} className="card" style={{ padding:"16px", marginBottom:10 }}>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{tip.icon}</span>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:"#ffb6ff", marginBottom:6 }}>{tip.title}</p>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.7 }}>{tip.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
