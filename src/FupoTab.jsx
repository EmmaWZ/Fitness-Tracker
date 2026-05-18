import { useState, useEffect, useRef, memo } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_WORK_TASKS = [
  { id:"w1", icon:"📧", title:"处理邮件/消息", category:"沟通",   duration:"30 分钟", xp:10 },
  { id:"w2", icon:"📋", title:"规划今日目标",  category:"计划",   duration:"10 分钟", xp:15 },
  { id:"w3", icon:"💡", title:"深度工作时段",  category:"专注",   duration:"2 小时",  xp:40 },
  { id:"w4", icon:"📚", title:"学习/阅读",     category:"成长",   duration:"30 分钟", xp:20 },
  { id:"w5", icon:"📝", title:"复盘今日收获",  category:"反思",   duration:"10 分钟", xp:15 },
];
const DEFAULT_HABITS = [
  { id:"h1", icon:"📖", title:"阅读",      desc:"每天至少读30分钟书" },
  { id:"h2", icon:"🇬🇧", title:"英语学习", desc:"背单词/听力/口语练习" },
  { id:"h3", icon:"✍️", title:"写作/记录", desc:"日记/笔记/输出想法"  },
  { id:"h4", icon:"🧘", title:"冥想",      desc:"正念冥想10分钟"       },
];
const POMO_WORK  = 25 * 60;
const POMO_BREAK =  5 * 60;

function genId() { return "f_" + Math.random().toString(36).slice(2, 8); }

// ── Isolated forms ───────────────────────────────────────────────────────────
function WorkTaskForm({ task, onSave, onCancel, onDelete, title }) {
  const [d, setD] = useState({ ...task });
  return (
    <div className="edit-form">
      {title && <div style={{ fontSize:12,fontWeight:900,color:"#806000",marginBottom:10 }}>{title}</div>}
      <div style={{ display:"flex",gap:8,marginBottom:8 }}>
        <input className="finput" value={d.icon} onChange={e=>setD(p=>({...p,icon:e.target.value}))} style={{ width:52,textAlign:"center",fontSize:20,flexShrink:0 }}/>
        <input className="finput" value={d.title} onChange={e=>setD(p=>({...p,title:e.target.value}))} placeholder="任务名称"/>
      </div>
      <label className="flbl">分类</label>
      <input className="finput" value={d.category||""} onChange={e=>setD(p=>({...p,category:e.target.value}))} placeholder="例如：专注"/>
      <label className="flbl">时长</label>
      <input className="finput" value={d.duration||""} onChange={e=>setD(p=>({...p,duration:e.target.value}))} placeholder="例如：30 分钟"/>
      <label className="flbl">经验值 XP</label>
      <input className="finput" type="number" value={d.xp||0} onChange={e=>setD(p=>({...p,xp:Number(e.target.value)}))}/>
      <div style={{ display:"flex",gap:8,marginTop:14 }}>
        <button className="save-btn" onClick={()=>onSave(d)}>保存</button>
        <button className="can-btn" onClick={onCancel}>取消</button>
        {onDelete && <button className="del-btn" onClick={onDelete} style={{ marginLeft:"auto" }}>删除</button>}
      </div>
    </div>
  );
}

function HabitForm({ habit, onSave, onCancel, onDelete, title }) {
  const [d, setD] = useState({ ...habit });
  return (
    <div className="edit-form">
      {title && <div style={{ fontSize:12,fontWeight:900,color:"#806000",marginBottom:10 }}>{title}</div>}
      <div style={{ display:"flex",gap:8,marginBottom:8 }}>
        <input className="finput" value={d.icon} onChange={e=>setD(p=>({...p,icon:e.target.value}))} style={{ width:52,textAlign:"center",fontSize:20,flexShrink:0 }}/>
        <input className="finput" value={d.title} onChange={e=>setD(p=>({...p,title:e.target.value}))} placeholder="习惯名称"/>
      </div>
      <label className="flbl">描述</label>
      <input className="finput" value={d.desc||""} onChange={e=>setD(p=>({...p,desc:e.target.value}))} placeholder="每天做什么"/>
      <div style={{ display:"flex",gap:8,marginTop:14 }}>
        <button className="save-btn" onClick={()=>onSave(d)}>保存</button>
        <button className="can-btn" onClick={onCancel}>取消</button>
        {onDelete && <button className="del-btn" onClick={onDelete} style={{ marginLeft:"auto" }}>删除</button>}
      </div>
    </div>
  );
}

// ── Pomodoro Timer ───────────────────────────────────────────────────────────
const Pomodoro = memo(function Pomodoro() {
  const [mode,    setMode]    = useState("work"); // "work" | "break"
  const [secs,    setSecs]    = useState(POMO_WORK);
  const [running, setRunning] = useState(false);
  const [rounds,  setRounds]  = useState(0);
  const ticker = useRef(null);

  useEffect(() => {
    if (running) {
      ticker.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(ticker.current);
            setRunning(false);
            if (mode === "work") {
              setRounds(r => r + 1);
              setMode("break");
              setSecs(POMO_BREAK);
            } else {
              setMode("work");
              setSecs(POMO_WORK);
            }
            try { new Notification(mode==="work"?"🎉 专注时间结束！休息一下":"⚡ 休息结束，继续专注！"); } catch {}
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(ticker.current);
    }
    return () => clearInterval(ticker.current);
  }, [running, mode]);

  const reset = () => { clearInterval(ticker.current); setRunning(false); setSecs(mode==="work"?POMO_WORK:POMO_BREAK); };
  const switchMode = (m) => { clearInterval(ticker.current); setRunning(false); setMode(m); setSecs(m==="work"?POMO_WORK:POMO_BREAK); };

  const total = mode === "work" ? POMO_WORK : POMO_BREAK;
  const pct   = ((total - secs) / total) * 100;
  const mm    = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss    = String(secs % 60).padStart(2, "0");
  const isWork = mode === "work";

  // SVG circle
  const R = 54; const C = 2 * Math.PI * R;

  return (
    <div style={{ background:"rgba(255,255,255,0.65)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(255,210,120,0.45)",borderRadius:22,padding:"20px 16px",marginBottom:12 }}>
      {/* Mode toggle */}
      <div style={{ display:"flex",gap:8,marginBottom:18,justifyContent:"center" }}>
        {[["work","专注 25min"],["break","休息 5min"]].map(([m,l])=>(
          <button key={m} onClick={()=>switchMode(m)}
            style={{ padding:"6px 16px",borderRadius:20,border:"none",fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:800,cursor:"pointer",
              background:mode===m?"linear-gradient(135deg,#f6c940,#f0a000)":"rgba(255,255,255,0.6)",
              color:mode===m?"#fff":"#a08000",
              boxShadow:mode===m?"0 3px 12px rgba(240,160,0,0.3)":"none" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Circle timer */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",marginBottom:18 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={R} fill="none" stroke="rgba(240,200,80,0.2)" strokeWidth="8"/>
          <circle cx="65" cy="65" r={R} fill="none"
            stroke={isWork?"#f0a000":"#60c080"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (pct/100)*C}
            transform="rotate(-90 65 65)"
            style={{ transition:"stroke-dashoffset .8s ease" }}/>
          <text x="65" y="60" textAnchor="middle" fontSize="24" fontWeight="900" fill={isWork?"#8a5000":"#006040"} fontFamily="Nunito,sans-serif">{mm}:{ss}</text>
          <text x="65" y="78" textAnchor="middle" fontSize="11" fontWeight="700" fill={isWork?"#c08000":"#208060"} fontFamily="Nunito,sans-serif">{isWork?"专注中":"休息中"}</text>
        </svg>
        <div style={{ fontSize:11,fontWeight:800,color:"#c09000",marginTop:4 }}>已完成 {rounds} 个番茄 🍅</div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
        <button onClick={()=>setRunning(v=>!v)}
          style={{ padding:"10px 28px",borderRadius:14,border:"none",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:900,cursor:"pointer",
            background:"linear-gradient(135deg,#f6c940,#f0a000)",color:"#fff",boxShadow:"0 4px 16px rgba(240,160,0,0.35)" }}>
          {running ? "⏸ 暂停" : "▶ 开始"}
        </button>
        <button onClick={reset}
          style={{ padding:"10px 16px",borderRadius:14,border:"1px solid rgba(240,200,80,0.4)",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:900,cursor:"pointer",
            background:"rgba(255,255,255,0.7)",color:"#a08000" }}>
          ↺
        </button>
      </div>
    </div>
  );
});

// ── Main FupoTab component ────────────────────────────────────────────────────
export default function FupoTab({
  todayKey,
  workTasks, setWorkTasks,
  habits, setHabits,
  checkedWork, setCheckedWork,
  checkedHabit, setCheckedHabit,
  todos, setTodos,
}) {
  // Use defaults if props arrive empty (first load before cloud sync)
  const effectiveWorkTasks = (workTasks && effectiveWorkTasks.length > 0) ? workTasks : DEFAULT_WORK_TASKS;
  const effectiveHabits    = (habits    && effectiveHabits.length    > 0) ? habits    : DEFAULT_HABITS;
  const safeCheckedWork    = checkedWork  || {};
  const safeCheckedHabit   = checkedHabit || {};
  const safeTodos          = todos        || [];

  // UI-only state stays local
  const [todoInput,      setTodoInput]      = useState("");
  const [subTab,         setSubTab]         = useState("daily");
  const [managingWork,   setManagingWork]   = useState(false);
  const [editingWork,    setEditingWork]    = useState(null);
  const [addingWork,     setAddingWork]     = useState(false);
  const [managingHabits, setManagingHabits] = useState(false);
  const [editingHabit,   setEditingHabit]   = useState(null);
  const [addingHabit,    setAddingHabit]    = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const workDone    = effectiveWorkTasks.filter(t=>safeCheckedWork[t.id]).length;
  const workXP      = effectiveWorkTasks.filter(t=>safeCheckedWork[t.id]).reduce((s,t)=>s+(t.xp||0),0);
  const maxWorkXP   = effectiveWorkTasks.reduce((s,t)=>s+(t.xp||0),0);
  const workPct     = effectiveWorkTasks.length>0 ? Math.round((workDone/effectiveWorkTasks.length)*100) : 0;
  const habitDone   = effectiveHabits.filter(h=>safeCheckedHabit[h.id]).length;
  const todoDone    = safeTodos.filter(t=>t.done).length;

  const addTodo = () => {
    const txt = todoInput.trim();
    if (!txt) return;
    setTodos(ts=>[...(ts||[]),{id:genId(),text:txt,done:false}]);
    setTodoInput("");
  };
  const toggleTodo = id => setTodos(ts=>(ts||[]).map(t=>t.id===id?{...t,done:!t.done}:t));
  const deleteTodo = id => setTodos(ts=>(ts||[]).filter(t=>t.id!==id));
  const moveWork = (idx,dir) => setWorkTasks(ts=>{ const a=[...ts]; const to=idx+dir; if(to<0||to>=a.length) return a; [a[idx],a[to]]=[a[to],a[idx]]; return a; });

  // ── Styles ────────────────────────────────────────────────────────────────
  const gold = "linear-gradient(135deg,#f6c940,#f0a000)";

  return (
    <div>
      <style>{`
        .fupo-tab-btn{padding:7px 13px;border-radius:20px;border:1px solid rgba(240,200,80,0.4);background:rgba(255,255,255,0.65);color:#a08000;cursor:pointer;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;transition:all .2s}
        .fupo-tab-btn.active{background:linear-gradient(135deg,#f6c940,#f0a000);border-color:transparent;color:#fff;box-shadow:0 4px 14px rgba(240,160,0,0.3)}
        .fupo-task-row{background:rgba(255,255,255,0.65);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(240,200,80,0.35);border-radius:18px;padding:13px 15px;margin-bottom:9px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:transform .15s;flex-wrap:wrap}
        .fupo-task-row:hover{transform:translateX(3px)}
        .fupo-task-row.done{background:rgba(255,250,220,0.6);opacity:.72}
        .fupo-chk{width:28px;height:28px;border-radius:50%;border:2.5px solid rgba(240,200,80,0.6);background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;cursor:pointer;transition:all .2s}
        .fupo-chk.done{background:linear-gradient(135deg,#f6c940,#f0a000);border-color:transparent;color:#fff}
        .fupo-tag{display:inline-block;background:rgba(255,230,100,0.7);color:#806000;border-radius:7px;padding:1px 7px;font-size:10px;font-weight:800;margin-right:4px}
        .fupo-xpb{display:inline-block;background:rgba(255,220,60,0.4);color:#7a5000;border-radius:7px;padding:1px 7px;font-size:10px;font-weight:800}
        .fupo-manage-row{background:rgba(255,255,255,0.65);border:1px solid rgba(240,200,80,0.3);border-radius:13px;padding:9px 13px;margin-bottom:7px;display:flex;align-items:center;gap:9px}
        .fupo-section{font-size:11px;font-weight:900;color:#a07000;letter-spacing:.08em;text-transform:uppercase;margin:16px 0 10px;display:flex;align-items:center;gap:8px}
        .fupo-section::after{content:'';flex:1;height:1px;background:rgba(240,180,0,0.2)}
        .fupo-add-dashed{width:100%;padding:11px;border-radius:15px;border:2px dashed rgba(240,200,80,0.45);background:rgba(255,255,255,0.35);color:#a08000;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;cursor:pointer;margin-top:4px}
        .habit-card{background:rgba(255,255,255,0.65);backdrop-filter:blur(10px);border:1px solid rgba(240,200,80,0.35);border-radius:18px;padding:13px 15px;margin-bottom:9px;display:flex;align-items:center;gap:12px}
        .habit-chk{width:36px;height:36px;border-radius:50%;border:2.5px solid rgba(240,200,80,0.5);background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;cursor:pointer;transition:all .2s}
        .habit-chk.done{background:linear-gradient(135deg,#f6c940,#f0a000);border-color:transparent}
        .todo-row{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.6);border:1px solid rgba(240,200,80,0.3);border-radius:14px;margin-bottom:7px}
        .todo-chk{width:22px;height:22px;border-radius:6px;border:2px solid rgba(240,200,80,0.6);background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:12px;transition:all .2s}
        .todo-chk.done{background:linear-gradient(135deg,#f6c940,#f0a000);border-color:transparent;color:#fff}
      `}</style>

      {/* ── Header card ── */}
      <div style={{ background:"rgba(255,255,255,0.55)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(240,210,100,0.4)",borderRadius:22,padding:"20px",marginBottom:14,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",width:120,height:120,borderRadius:"50%",background:"rgba(255,220,80,0.15)",top:-30,right:-20 }}/>
        <div style={{ fontSize:24,fontWeight:900,color:"#7a5000",lineHeight:1.15,marginBottom:3 }}>富婆养成计划 💰</div>
        <div style={{ fontSize:12,color:"#c09000",fontWeight:700 }}>专注工作 · 持续学习 · 财富积累</div>
        <div style={{ position:"absolute",right:16,top:16,fontSize:32,opacity:.4 }}>💎</div>

        {/* Mini stats */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:14 }}>
          {[
            { val:`${workDone}/${effectiveWorkTasks.length}`, lbl:"今日必做", color:"#c07000" },
            { val:`${habitDone}/${effectiveHabits.length}`,   lbl:"习惯打卡", color:"#a05000" },
            { val:`${todoDone}/${safeTodos.length}`,     lbl:"Todo",     color:"#806000" },
          ].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,240,160,0.4)",border:"1px solid rgba(240,200,80,0.3)",borderRadius:12,padding:"8px",textAlign:"center" }}>
              <div style={{ fontSize:16,fontWeight:900,color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10,color:"#c09000",fontWeight:700 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* XP bar */}
        <div style={{ marginTop:12 }}>
          <div style={{ height:8,background:"rgba(240,220,100,0.25)",borderRadius:4,overflow:"hidden" }}>
            <div style={{ height:"100%",borderRadius:4,background:gold,width:`${workPct}%`,transition:"width .6s" }}/>
          </div>
          <div style={{ textAlign:"right",fontSize:10,color:"#c09000",marginTop:4,fontWeight:700 }}>{workXP}/{maxWorkXP} XP · {workPct}% 完成</div>
        </div>

        {workDone===effectiveWorkTasks.length&&effectiveWorkTasks.length>0&&(
          <div style={{ marginTop:10,textAlign:"center",padding:"8px",background:"rgba(255,230,80,0.3)",borderRadius:12,color:"#7a5000",fontSize:13,fontWeight:900 }}>
            💰 今日必做全部完成！富婆就是你！
          </div>
        )}
      </div>

      {/* ── Sub tabs ── */}
      <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
        {[["daily","每日必做"],["habits","习惯打卡"],["todo","Todo"],["pomo","🍅 番茄钟"]].map(([k,l])=>(
          <button key={k} className={`fupo-tab-btn ${subTab===k?"active":""}`} onClick={()=>setSubTab(k)}>{l}</button>
        ))}
      </div>

      {/* ══ DAILY TASKS ══ */}
      {subTab==="daily" && (
        <div>
          <div className="fupo-section">
            每日必做 · {effectiveWorkTasks.length} 项
            <button style={{ background:"rgba(255,255,255,0.7)",border:"1px solid rgba(240,200,80,0.4)",color:"#a07000",borderRadius:10,padding:"3px 9px",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif" }}
              onClick={()=>{setManagingWork(v=>!v);setEditingWork(null);setAddingWork(false);}}>
              {managingWork?"完成":"管理"}
            </button>
          </div>

          {managingWork ? (
            <div>
              {effectiveWorkTasks.map((task,idx)=>(
                editingWork===task.id
                  ? <WorkTaskForm key={task.id} task={task}
                      onSave={d=>{setWorkTasks(ts=>(ts||[]).map(t=>t.id===task.id?{...t,...d}:t));setEditingWork(null);}}
                      onCancel={()=>setEditingWork(null)}
                      onDelete={()=>{setWorkTasks(ts=>(ts||[]).filter(t=>t.id!==task.id));setEditingWork(null);}}/>
                  : <div key={task.id} className="fupo-manage-row">
                      <div style={{ display:"flex",flexDirection:"column",gap:2 }}>
                        <button className="icon-btn" onClick={()=>moveWork(idx,-1)} disabled={idx===0} style={{ opacity:idx===0?.3:1 }}>↑</button>
                        <button className="icon-btn" onClick={()=>moveWork(idx,+1)} disabled={idx===effectiveWorkTasks.length-1} style={{ opacity:idx===effectiveWorkTasks.length-1?.3:1 }}>↓</button>
                      </div>
                      <div style={{ fontSize:20 }}>{task.icon}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:800,color:"#5a3000" }}>{task.title}</div>
                        <div style={{ fontSize:11,color:"#c09000",fontWeight:700 }}>{task.category} · {task.duration}</div>
                      </div>
                      <button style={{ background:"rgba(255,255,255,0.7)",border:"1px solid rgba(240,200,80,0.4)",color:"#a07000",borderRadius:9,padding:"3px 8px",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0 }} onClick={()=>setEditingWork(task.id)}>编辑</button>
                      <button className="icon-btn" style={{ color:"#e05080",borderColor:"rgba(255,160,180,0.4)" }} onClick={()=>setWorkTasks(ts=>(ts||[]).filter(t=>t.id!==task.id))}>✕</button>
                    </div>
              ))}
              {addingWork
                ? <WorkTaskForm task={{id:genId(),icon:"⭐",title:"",category:"",duration:"",xp:20}} title="＋ 新增必做事项"
                    onSave={d=>{setWorkTasks(ts=>[...(ts||[]),{...d,id:genId()}]);setAddingWork(false);}}
                    onCancel={()=>setAddingWork(false)}/>
                : <button className="fupo-add-dashed" onClick={()=>setAddingWork(true)}>＋ 新增必做事项</button>
              }
            </div>
          ) : (
            effectiveWorkTasks.map(task=>(
              <div key={task.id} className={`fupo-task-row ${safeCheckedWork[task.id]?"done":""}`}
                onClick={()=>setCheckedWork(p=>({...p,[task.id]:!p[task.id]}))}>
                <button className={`fupo-chk ${safeCheckedWork[task.id]?"done":""}`}
                  onClick={e=>{e.stopPropagation();setCheckedWork(p=>({...p,[task.id]:!p[task.id]}));}}>
                  {safeCheckedWork[task.id]?"✓":""}
                </button>
                <div style={{ fontSize:20,flexShrink:0 }}>{task.icon}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ marginBottom:3 }}><span className="fupo-tag">{task.category}</span><span className="fupo-xpb">+{task.xp} XP</span></div>
                  <div style={{ fontSize:14,fontWeight:800,color:safeCheckedWork[task.id]?"#c09060":"#5a3000",textDecoration:safeCheckedWork[task.id]?"line-through":"none" }}>{task.title}</div>
                  <div style={{ fontSize:11,color:"#c09000",fontWeight:700 }}>{task.duration}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══ HABITS ══ */}
      {subTab==="habits" && (
        <div>
          <div className="fupo-section">
            今日习惯 · {habitDone}/{effectiveHabits.length} 完成
            <button style={{ background:"rgba(255,255,255,0.7)",border:"1px solid rgba(240,200,80,0.4)",color:"#a07000",borderRadius:10,padding:"3px 9px",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif" }}
              onClick={()=>{setManagingHabits(v=>!v);setEditingHabit(null);setAddingHabit(false);}}>
              {managingHabits?"完成":"管理"}
            </button>
          </div>

          {managingHabits ? (
            <div>
              {effectiveHabits.map(h=>(
                editingHabit===h.id
                  ? <HabitForm key={h.id} habit={h}
                      onSave={d=>{setHabits(hs=>(hs||[]).map(x=>x.id===h.id?{...x,...d}:x));setEditingHabit(null);}}
                      onCancel={()=>setEditingHabit(null)}
                      onDelete={()=>{setHabits(hs=>(hs||[]).filter(x=>x.id!==h.id));setEditingHabit(null);}}/>
                  : <div key={h.id} className="fupo-manage-row">
                      <div style={{ fontSize:22 }}>{h.icon}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:800,color:"#5a3000" }}>{h.title}</div>
                        <div style={{ fontSize:11,color:"#c09000",fontWeight:700 }}>{h.desc}</div>
                      </div>
                      <button style={{ background:"rgba(255,255,255,0.7)",border:"1px solid rgba(240,200,80,0.4)",color:"#a07000",borderRadius:9,padding:"3px 8px",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0 }} onClick={()=>setEditingHabit(h.id)}>编辑</button>
                      <button className="icon-btn" style={{ color:"#e05080",borderColor:"rgba(255,160,180,0.4)" }} onClick={()=>setHabits(hs=>(hs||[]).filter(x=>x.id!==h.id))}>✕</button>
                    </div>
              ))}
              {addingHabit
                ? <HabitForm habit={{id:genId(),icon:"⭐",title:"",desc:""}} title="＋ 添加新习惯"
                    onSave={d=>{setHabits(hs=>[...(hs||[]),{...d,id:genId()}]);setAddingHabit(false);}}
                    onCancel={()=>setAddingHabit(false)}/>
                : <button className="fupo-add-dashed" onClick={()=>setAddingHabit(true)}>＋ 添加新习惯</button>
              }
            </div>
          ) : (
            effectiveHabits.map(h=>(
              <div key={h.id} className="habit-card">
                <div className={`habit-chk ${safeCheckedHabit[h.id]?"done":""}`}
                  onClick={()=>setCheckedHabit(p=>({...p,[h.id]:!p[h.id]}))}>
                  {safeCheckedHabit[h.id] ? "✓" : <span style={{ fontSize:18 }}>{h.icon}</span>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:safeCheckedHabit[h.id]?"#c09060":"#5a3000",textDecoration:safeCheckedHabit[h.id]?"line-through":"none" }}>{h.title}</div>
                  <div style={{ fontSize:11,color:"#c09000",fontWeight:700 }}>{h.desc}</div>
                </div>
                {safeCheckedHabit[h.id] && <span style={{ fontSize:18 }}>✅</span>}
              </div>
            ))
          )}

          {habitDone===effectiveHabits.length&&effectiveHabits.length>0&&(
            <div style={{ textAlign:"center",padding:"12px",background:"rgba(255,230,80,0.25)",border:"1px solid rgba(240,200,80,0.3)",borderRadius:14,color:"#7a5000",fontSize:13,fontWeight:900,marginTop:8 }}>
              🏆 今日习惯全部打卡！
            </div>
          )}
        </div>
      )}

      {/* ══ TODO ══ */}
      {subTab==="todo" && (
        <div>
          <div className="fupo-section">今日 Todo · {todoDone}/{safeTodos.length} 完成</div>

          {/* Input */}
          <div style={{ display:"flex",gap:8,marginBottom:14 }}>
            <input
              style={{ background:"rgba(255,255,255,0.7)",border:"1.5px solid rgba(240,200,80,0.5)",borderRadius:12,color:"#5a3000",padding:"9px 12px",fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700,outline:"none",flex:1 }}
              placeholder="添加任务，按 Enter 确认…"
              value={todoInput}
              onChange={e=>setTodoInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addTodo()}
            />
            <button onClick={addTodo}
              style={{ padding:"9px 16px",borderRadius:12,border:"none",background:gold,color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:900,cursor:"pointer",flexShrink:0 }}>
              ＋
            </button>
          </div>

          {safeTodos.length===0 && (
            <div style={{ textAlign:"center",padding:"20px 0",color:"#c09000",fontSize:13,fontWeight:700 }}>今天还没有 Todo，加一个吧 💪</div>
          )}

          {/* Undone */}
          {safeTodos.filter(t=>!t.done).map(t=>(
            <div key={t.id} className="todo-row">
              <div className="todo-chk" onClick={()=>toggleTodo(t.id)}></div>
              <div style={{ flex:1,fontSize:13,fontWeight:700,color:"#5a3000" }}>{t.text}</div>
              <button onClick={()=>deleteTodo(t.id)} style={{ background:"none",border:"none",color:"#d0a080",fontSize:16,cursor:"pointer",padding:"0 4px" }}>✕</button>
            </div>
          ))}

          {/* Done */}
          {safeTodos.filter(t=>t.done).length>0 && <>
            <div className="fupo-section" style={{ margin:"14px 0 8px" }}>已完成</div>
            {safeTodos.filter(t=>t.done).map(t=>(
              <div key={t.id} className="todo-row" style={{ opacity:.6 }}>
                <div className="todo-chk done" onClick={()=>toggleTodo(t.id)}>✓</div>
                <div style={{ flex:1,fontSize:13,fontWeight:700,color:"#a08060",textDecoration:"line-through" }}>{t.text}</div>
                <button onClick={()=>deleteTodo(t.id)} style={{ background:"none",border:"none",color:"#d0a080",fontSize:16,cursor:"pointer",padding:"0 4px" }}>✕</button>
              </div>
            ))}
          </>}
        </div>
      )}

      {/* ══ POMODORO ══ */}
      {subTab==="pomo" && (
        <div>
          <div className="fupo-section">番茄钟 🍅</div>
          <Pomodoro/>
          <div style={{ background:"rgba(255,250,220,0.6)",border:"1px solid rgba(240,200,80,0.3)",borderRadius:14,padding:"12px 14px",fontSize:12,color:"#7a5000",fontWeight:700,lineHeight:1.7 }}>
            💡 <strong>番茄工作法</strong>：专注25分钟 → 休息5分钟，循环4次后休息15–30分钟。保持高效专注，避免疲劳累积。
          </div>
        </div>
      )}
    </div>
  );
}
