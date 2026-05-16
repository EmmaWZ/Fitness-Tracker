import { useState, useEffect, useCallback, useRef, memo } from "react";
import { DEFAULT_REMINDERS, requestPermission, scheduleAll, fireNotification } from "./useNotifications";
import { loadData, saveData } from "./supabase";

// ── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_TASKS = [
  { id:"cardio",   category:"有氧燃脂", icon:"🔥", title:"有氧训练",   description:"快走/跑步/骑车/跳绳",       duration:"30–45 分钟",  tip:"心率保持在最大心率的65–75%，燃脂效果最佳", xp:30 },
  { id:"strength", category:"力量塑形", icon:"💪", title:"力量训练",   description:"深蹲/硬拉/卧推/划船",       duration:"40–60 分钟",  tip:"每组8–12次，组间休息60s，提升代谢率",     xp:40 },
  { id:"core",     category:"体态核心", icon:"⚡", title:"核心训练",   description:"平板支撑/死虫/鸟狗/卷腹",   duration:"10–15 分钟",  tip:"核心稳定是体态改善的基础，每天必练",       xp:20 },
  { id:"stretch",  category:"体态修复", icon:"🧘", title:"拉伸放松",   description:"胸椎/髋屈肌/肩部拉伸",      duration:"10–15 分钟",  tip:"改善圆肩驼背，保持训练后肌肉弹性",         xp:15 },
  { id:"steps",    category:"日常活动", icon:"👟", title:"每日步数",   description:"全天保持活跃，避免久坐",     duration:"≥ 8000 步",   tip:"NEAT占每日消耗的15–30%",                   xp:15 },
  { id:"water",    category:"营养支持", icon:"💧", title:"足量饮水",   description:"白水/淡茶/无糖饮料",         duration:"≥ 2000 mL",   tip:"充分水合有助于代谢废物排出和脂肪动员",     xp:10 },
  { id:"protein",  category:"营养支持", icon:"🥩", title:"蛋白质摄入", description:"鸡胸/鱼/蛋/豆腐/乳清蛋白", duration:"体重×1.6–2g", tip:"高蛋白保留肌肉、提升饱腹感",               xp:10 },
  { id:"sleep",    category:"恢复",     icon:"🌙", title:"优质睡眠",   description:"保证深度睡眠，避免熬夜",     duration:"7–9 小时",    tip:"睡眠不足导致皮质醇升高，阻碍脂肪分解",     xp:20 },
];
const DEFAULT_GOAL = { title:"美女养成计划", subtitle:"减脂塑形 · 体态改善", targetWeight:"", targetDate:"", notes:"" };
const DEFAULT_WEEKLY_PLAN = [
  { day:"周一", focus:"上肢力量 + 有氧",      emoji:"💪", fixedTasks:[] },
  { day:"周二", focus:"下肢力量 + 核心",      emoji:"🦵", fixedTasks:[] },
  { day:"周三", focus:"低强度有氧 + 拉伸",    emoji:"🧘", fixedTasks:[] },
  { day:"周四", focus:"全身力量 + HIIT",       emoji:"⚡", fixedTasks:[] },
  { day:"周五", focus:"上肢力量 + 有氧",      emoji:"🔥", fixedTasks:[] },
  { day:"周六", focus:"户外活动 / 长距离步行", emoji:"🌿", fixedTasks:[] },
  { day:"周日", focus:"主动恢复 + 充分拉伸",  emoji:"🌙", fixedTasks:[] },
];
const TIPS = [
  { icon:"🔥", title:"热量缺口",     content:"每日热量缺口控制在300–500kcal，避免过度节食导致肌肉流失。慢慢来，每周减重0.5–1kg最理想。" },
  { icon:"💪", title:"力量训练优先", content:"减脂期不能只做有氧！力量训练提高基础代谢率，帮你在休息时也持续燃烧脂肪，并塑造肌肉线条。" },
  { icon:"🥩", title:"蛋白质是关键", content:"高蛋白饮食保留肌肉、提升饱腹感、加速代谢。每天每公斤体重摄入1.6–2g蛋白质是减脂期标配。" },
  { icon:"✨", title:"皮肤与体态",   content:"多喝水、保证睡眠、补充胶原蛋白和维生素C，减脂同时保持皮肤光泽弹嫩。" },
  { icon:"🧘", title:"体态改善重点", content:"圆肩驼背：每天拉伸胸大肌，强化中下斜方肌和菱形肌。骨盆前倾：强化臀部和腹部，拉伸髋屈肌。" },
  { icon:"🌙", title:"睡眠与恢复",   content:"睡眠不足使皮质醇升高，抑制脂肪分解，增加暴食欲望。7–9小时优质睡眠是减脂的隐藏利器。" },
  { icon:"📏", title:"衡量进展",     content:"不要只看体重！拍照对比、量围度（腰/臀/手臂）、感受体力变化，这些往往比体重更能反映真实进步。" },
];
const JS_TO_IDX = [6,0,1,2,3,4,5];

function genId() { return "t_" + Math.random().toString(36).slice(2,8); }
function getWeekKey(date=new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  const day = d.getUTCDay()||7;
  d.setUTCDate(d.getUTCDate()+4-day);
  const ys = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d-ys)/86400000)+1)/7)).padStart(2,"0")}`;
}
function getWeekDates(wk) {
  const [y,ws] = wk.split("-W");
  const w = parseInt(ws,10);
  const j = new Date(Date.UTC(+y,0,4));
  const s = new Date(j);
  s.setUTCDate(j.getUTCDate()-((j.getUTCDay()||7)-1)+(w-1)*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(s); d.setUTCDate(s.getUTCDate()+i); return d.toISOString().split("T")[0]; });
}

// ── Petals ───────────────────────────────────────────────────────────────────
const Petals = memo(function Petals() {
  const petals = Array.from({length:14},(_,i)=>({
    id:i, left:`${Math.random()*100}%`,
    dur:`${7+Math.random()*9}s`, delay:`${Math.random()*12}s`,
    scale:0.6+Math.random()*0.8, op:[0.55,0.4,0.65,0.35,0.5][i%5],
  }));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,overflow:"hidden"}}>
      <style>{`@keyframes pF{0%{transform:translateY(-30px) rotate(0deg) translateX(0);opacity:.7}40%{transform:translateY(40vh) rotate(120deg) translateX(18px);opacity:.5}80%{transform:translateY(80vh) rotate(260deg) translateX(-12px);opacity:.25}100%{transform:translateY(105vh) rotate(360deg) translateX(8px);opacity:0}}`}</style>
      {petals.map(p=>(
        <div key={p.id} style={{position:"absolute",left:p.left,top:0,animation:`pF ${p.dur} ${p.delay} infinite linear`,transform:`scale(${p.scale})`}}>
          <svg width="18" height="20" viewBox="0 0 18 20"><path d="M9 1 C12 4,16 8,14 13 C12 17,6 18,3 15 C0 12,1 6,4 3 C6 1,8 0,9 1Z" fill={`rgba(255,182,213,${p.op})`}/></svg>
        </div>
      ))}
    </div>
  );
});

// ── Isolated forms ───────────────────────────────────────────────────────────
function TaskForm({ task, onSave, onCancel, onDelete, title }) {
  const [d, setD] = useState({...task});
  return (
    <div className="edit-form">
      {title && <div style={{fontSize:12,fontWeight:900,color:"#b060a0",marginBottom:10}}>{title}</div>}
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <input className="finput" value={d.icon} onChange={e=>setD(p=>({...p,icon:e.target.value}))} style={{width:52,textAlign:"center",fontSize:20,flexShrink:0}}/>
        <input className="finput" value={d.title} onChange={e=>setD(p=>({...p,title:e.target.value}))} placeholder="任务名称"/>
      </div>
      <label className="flbl">分类</label>
      <input className="finput" value={d.category} onChange={e=>setD(p=>({...p,category:e.target.value}))}/>
      <label className="flbl">描述</label>
      <input className="finput" value={d.description} onChange={e=>setD(p=>({...p,description:e.target.value}))}/>
      <label className="flbl">时长/目标</label>
      <input className="finput" value={d.duration} onChange={e=>setD(p=>({...p,duration:e.target.value}))}/>
      <label className="flbl">科学提示</label>
      <input className="finput" value={d.tip} onChange={e=>setD(p=>({...p,tip:e.target.value}))}/>
      <label className="flbl">经验值 XP</label>
      <input className="finput" type="number" value={d.xp} onChange={e=>setD(p=>({...p,xp:Number(e.target.value)}))}/>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <button className="save-btn" onClick={()=>onSave(d)}>保存</button>
        <button className="can-btn" onClick={onCancel}>取消</button>
        {onDelete && <button className="del-btn" onClick={onDelete} style={{marginLeft:"auto"}}>删除</button>}
      </div>
    </div>
  );
}
function GoalForm({ goal, onSave, onCancel }) {
  const [d, setD] = useState({...goal});
  return (
    <div>
      <label className="flbl">计划名称</label>
      <input className="finput" value={d.title} onChange={e=>setD(p=>({...p,title:e.target.value}))} placeholder="美女养成计划"/>
      <label className="flbl">副标题</label>
      <input className="finput" value={d.subtitle} onChange={e=>setD(p=>({...p,subtitle:e.target.value}))}/>
      <label className="flbl">目标体重</label>
      <input className="finput" value={d.targetWeight} onChange={e=>setD(p=>({...p,targetWeight:e.target.value}))} placeholder="例如 52 kg"/>
      <label className="flbl">目标日期</label>
      <input className="finput" type="date" value={d.targetDate} onChange={e=>setD(p=>({...p,targetDate:e.target.value}))}/>
      <label className="flbl">我的动力</label>
      <input className="finput" value={d.notes} onChange={e=>setD(p=>({...p,notes:e.target.value}))} placeholder="写下你的动力..."/>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <button className="save-btn" onClick={()=>onSave(d)}>保存</button>
        <button className="can-btn" onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}
function WeekDayForm({ plan, onSave, onCancel }) {
  const [d, setD] = useState({...plan});
  return (
    <div className="edit-form">
      <div style={{fontSize:12,fontWeight:900,color:"#b060a0",marginBottom:10}}>{plan.day} · 编辑安排</div>
      <label className="flbl">Emoji 图标</label>
      <input className="finput" value={d.emoji} onChange={e=>setD(p=>({...p,emoji:e.target.value}))} style={{fontSize:20,textAlign:"center"}}/>
      <label className="flbl">训练内容描述</label>
      <input className="finput" value={d.focus} onChange={e=>setD(p=>({...p,focus:e.target.value}))} placeholder="例如：上肢力量 + 有氧"/>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <button className="save-btn" onClick={()=>onSave(d)}>保存</button>
        <button className="can-btn" onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}
function ReminderEditForm({ reminder, onSave, onCancel }) {
  const [d, setD] = useState({...reminder});
  return (
    <div className="edit-form" style={{marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:900,color:"#b060a0",marginBottom:10}}>{d.label} · 编辑提醒</div>
      <label className="flbl">提醒名称</label>
      <input className="finput" value={d.label} onChange={e=>setD(p=>({...p,label:e.target.value}))} placeholder="例如：早起打卡"/>
      <label className="flbl">提醒时间</label>
      <input className="finput" type="time" value={d.time} onChange={e=>setD(p=>({...p,time:e.target.value}))}/>
      <label className="flbl">提醒内容</label>
      <input className="finput" value={d.message} onChange={e=>setD(p=>({...p,message:e.target.value}))} placeholder="提醒文案"/>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <button className="save-btn" onClick={()=>onSave(d)}>保存</button>
        <button className="can-btn" onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}
function TaskRow({ task, checked, onToggle, onEdit, expanded, onExpand, badge }) {
  return (
    <div className={`task-row ${checked?"done":""}`} onClick={onExpand}>
      <button className={`chk ${checked?"done":""}`} onClick={e=>{e.stopPropagation();onToggle();}}>{checked?"✓":""}</button>
      <div style={{fontSize:22,flexShrink:0}}>{task.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{marginBottom:3,display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
          <span className="tag">{task.category}</span>
          <span className="xpb">+{task.xp} XP</span>
          {badge}
        </div>
        <div style={{fontSize:14,fontWeight:800,color:checked?"#c09ac0":"#5a006a",textDecoration:checked?"line-through":"none"}}>{task.title}</div>
        <div style={{fontSize:11,color:"#c068a0",fontWeight:700}}>{task.description}{task.duration?` · ${task.duration}`:""}</div>
      </div>
      {onEdit && <button className="edt-btn" onClick={e=>{e.stopPropagation();onEdit();}}>编辑</button>}
      {expanded && task.tip && <div className="tip-box" style={{width:"100%"}}>💡 {task.tip}</div>}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function FitnessTracker() {
  const today    = new Date();
  const todayKey = today.toISOString().split("T")[0];
  const weekKey  = getWeekKey(today);
  const todayIdx = JS_TO_IDX[today.getDay()];

  // ── ALL state declarations first ──────────────────────────────────────────
  const [defaultTasks,    setDefaultTasks]    = useState(()=>{ try{const s=localStorage.getItem("fit_default_tasks"); return s?JSON.parse(s):DEFAULT_TASKS;}catch{return DEFAULT_TASKS;} });
  const [extraTasksByDay, setExtraTasksByDay] = useState(()=>{ try{const s=localStorage.getItem("fit_extra_tasks");   return s?JSON.parse(s):{};}catch{return {};} });
  const [checkedByDay,    setCheckedByDay]    = useState(()=>{
    try {
      const result = {};
      const base = new Date();
      for (let i=0; i<14; i++) {
        const d = new Date(base); d.setDate(base.getDate()-i);
        const k = d.toISOString().split("T")[0];
        const s = localStorage.getItem(`fit_day_${k}`);
        if (s) result[k] = JSON.parse(s);
      }
      return result;
    } catch { return {}; }
  });
  const [goal,       setGoal]       = useState(()=>{ try{const s=localStorage.getItem("fit_goal");        return s?JSON.parse(s):DEFAULT_GOAL;}catch{return DEFAULT_GOAL;} });
  const [weeklyPlan, setWeeklyPlan] = useState(()=>{ try{const s=localStorage.getItem("fit_weekly_plan"); return s?JSON.parse(s):DEFAULT_WEEKLY_PLAN;}catch{return DEFAULT_WEEKLY_PLAN;} });
  const [reminders,  setReminders]  = useState(()=>{ try{const s=localStorage.getItem("fit_reminders");   return s?JSON.parse(s):DEFAULT_REMINDERS;}catch{return DEFAULT_REMINDERS;} });
  const [permission, setPermission] = useState(typeof Notification!=="undefined" ? Notification.permission : "unsupported");
  // Cloud sync
  const [userId,      setUserId]      = useState(()=> localStorage.getItem("fit_user_id") || "");
  const [userIdInput, setUserIdInput] = useState("");
  const [syncing,     setSyncing]     = useState(false);
  const [syncStatus,  setSyncStatus]  = useState(null);
  const saveTimer = useRef(null);
  // UI
  const [tab,              setTab]              = useState("today");
  const [expanded,         setExpanded]         = useState(null);
  const [editingGoal,      setEditingGoal]      = useState(false);
  const [editingWeekDay,   setEditingWeekDay]   = useState(null);
  const [editingFixed,     setEditingFixed]     = useState(null);
  const [addingFixed,      setAddingFixed]      = useState(null);
  const [managingDefaults, setManagingDefaults] = useState(false);
  const [editingDefault,   setEditingDefault]   = useState(null);
  const [addingDefault,    setAddingDefault]    = useState(false);
  const [editingExtra,     setEditingExtra]     = useState(null);
  const [addingExtra,      setAddingExtra]      = useState(false);
  const [editingReminder,  setEditingReminder]  = useState(null);
  const [streak] = useState(7);

  // ── Effects ───────────────────────────────────────────────────────────────
  // localStorage persist
  useEffect(()=>{ try{localStorage.setItem("fit_default_tasks",JSON.stringify(defaultTasks));}catch{} },[defaultTasks]);
  useEffect(()=>{ try{localStorage.setItem("fit_extra_tasks",  JSON.stringify(extraTasksByDay));}catch{} },[extraTasksByDay]);
  useEffect(()=>{ try{localStorage.setItem("fit_goal",         JSON.stringify(goal));}catch{} },[goal]);
  useEffect(()=>{ try{localStorage.setItem("fit_weekly_plan",  JSON.stringify(weeklyPlan));}catch{} },[weeklyPlan]);
  useEffect(()=>{ try{localStorage.setItem("fit_reminders",    JSON.stringify(reminders));}catch{} },[reminders]);
  useEffect(()=>{ scheduleAll(reminders); },[reminders, permission]);

  const todayCheckedForPersist = checkedByDay[todayKey];
  useEffect(()=>{
    try { if(todayCheckedForPersist) localStorage.setItem(`fit_day_${todayKey}`, JSON.stringify(todayCheckedForPersist)); } catch {}
  },[todayCheckedForPersist, todayKey]);

  // Cloud: load on mount
  useEffect(()=>{
    if (!userId) return;
    setSyncing(true);
    loadData(userId).then(data=>{
      if (data) {
        if (data.defaultTasks)    setDefaultTasks(data.defaultTasks);
        if (data.extraTasksByDay) setExtraTasksByDay(data.extraTasksByDay);
        if (data.goal)            setGoal(data.goal);
        if (data.weeklyPlan)      setWeeklyPlan(data.weeklyPlan);
        if (data.reminders)       setReminders(data.reminders);
        if (data.checkedByDay) {
          setCheckedByDay(data.checkedByDay);
          Object.entries(data.checkedByDay).forEach(([k,v])=>{ try{localStorage.setItem(`fit_day_${k}`,JSON.stringify(v));}catch{} });
        }
        setSyncStatus("ok");
      }
      setSyncing(false);
    }).catch(()=>{ setSyncing(false); setSyncStatus("error"); });
  }, [userId]);

  // Cloud: auto-save 2s after changes
  const doCloudSave = useCallback(()=>{
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>{
      saveData(userId,{defaultTasks,extraTasksByDay,goal,weeklyPlan,reminders,checkedByDay})
        .then(ok=>setSyncStatus(ok?"ok":"error"));
    }, 2000);
  },[userId,defaultTasks,extraTasksByDay,goal,weeklyPlan,reminders,checkedByDay]);
  useEffect(()=>{ doCloudSave(); },[doCloudSave]);

  const handleSetUserId = ()=>{
    const id = userIdInput.trim();
    if (!id) return;
    localStorage.setItem("fit_user_id", id);
    setUserId(id);
    setSyncStatus(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const todayPlan     = weeklyPlan[todayIdx];
  const todayFixed    = todayPlan.fixedTasks || [];
  const todayExtras   = extraTasksByDay[todayKey] || [];
  const todayChecked  = checkedByDay[todayKey] || {};
  const allTodayTasks = [...defaultTasks, ...todayFixed, ...todayExtras];

  const completedCount = allTodayTasks.filter(t=>todayChecked[t.id]).length;
  const totalXP        = allTodayTasks.filter(t=>todayChecked[t.id]).reduce((s,t)=>s+(t.xp||0),0);
  const maxXP          = allTodayTasks.reduce((s,t)=>s+(t.xp||0),0);
  const progress       = allTodayTasks.length>0 ? Math.round((completedCount/allTodayTasks.length)*100) : 0;

  const weekDates = getWeekDates(weekKey);
  const weekStats = weekDates.map(ds=>{
    try {
      const dc=checkedByDay[ds]; if(!dc) return null;
      const idx=JS_TO_IDX[new Date(ds+"T00:00:00").getDay()];
      const fx=(weeklyPlan[idx]?.fixedTasks||[]).length;
      const ex=(extraTasksByDay[ds]||[]).length;
      const tot=defaultTasks.length+fx+ex;
      const done=Object.values(dc).filter(Boolean).length;
      return tot>0?Math.round((done/tot)*100):0;
    } catch { return null; }
  });
  const weekCompletedDays = weekStats.filter(v=>v!==null&&v>=100).length;
  const weekAvgPct = (()=>{ const v=weekStats.filter(v=>v!==null); return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0; })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggle = id => setCheckedByDay(p=>({...p,[todayKey]:{...(p[todayKey]||{}),[id]:!(p[todayKey]?.[id])}}));
  const moveDefault = (idx, dir) => setDefaultTasks(ts=>{ const a=[...ts]; const to=idx+dir; if(to<0||to>=a.length) return a; [a[idx],a[to]]=[a[to],a[idx]]; return a; });

  const glass = { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1px solid rgba(255,200,230,0.45)", borderRadius:22 };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",fontFamily:"'Nunito',sans-serif",color:"#3a003a",position:"relative",overflow:"hidden",background:"linear-gradient(160deg,#fff8fb 0%,#ffeef6 20%,#fff3f9 40%,#fdf0ff 65%,#fff6fc 100%)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#f0c0e0;border-radius:2px}
        .tab-btn{padding:7px 14px;border-radius:20px;border:1px solid rgba(255,190,220,0.45);background:rgba(255,255,255,0.65);color:#c068a0;cursor:pointer;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;transition:all .2s}
        .tab-btn.active{background:linear-gradient(135deg,#f0abcb,#d946a8);border-color:transparent;color:#fff;box-shadow:0 4px 16px rgba(217,70,168,0.25)}
        .task-row{background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,190,220,0.4);border-radius:20px;padding:14px 16px;margin-bottom:9px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:transform .15s;flex-wrap:wrap}
        .task-row:hover{transform:translateX(3px)}
        .task-row.done{background:rgba(255,240,250,0.6);opacity:.72}
        .chk{width:30px;height:30px;border-radius:50%;border:2.5px solid rgba(240,160,200,0.7);background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;transition:all .2s}
        .chk.done{background:linear-gradient(135deg,#f0abcb,#d946a8);border-color:transparent;color:#fff}
        .tag{display:inline-block;background:rgba(255,220,240,0.85);color:#a02880;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:800;margin-right:4px}
        .xpb{display:inline-block;background:rgba(230,210,255,0.85);color:#7c3aed;border-radius:8px;padding:1px 7px;font-size:10px;font-weight:800}
        .badge-fixed{display:inline-block;background:rgba(200,240,255,0.9);color:#0070a0;border-radius:6px;padding:1px 6px;font-size:9px;font-weight:900}
        .badge-extra{display:inline-block;background:rgba(255,240,180,0.9);color:#a07000;border-radius:6px;padding:1px 6px;font-size:9px;font-weight:900}
        .edt-btn{background:rgba(255,255,255,0.75);border:1px solid rgba(220,160,200,0.5);color:#a0348a;border-radius:10px;padding:4px 9px;font-size:11px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;flex-shrink:0}
        .icon-btn{background:rgba(255,255,255,0.7);border:1px solid rgba(220,160,200,0.4);color:#c068a0;border-radius:8px;padding:4px 7px;font-size:13px;cursor:pointer;font-family:'Nunito',sans-serif;flex-shrink:0;line-height:1}
        .save-btn{background:linear-gradient(135deg,#f0abcb,#d946a8);border:none;color:#fff;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;box-shadow:0 3px 12px rgba(217,70,168,0.25)}
        .can-btn{background:rgba(255,255,255,0.7);border:1px solid rgba(220,160,200,0.4);color:#a060c0;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif}
        .del-btn{background:rgba(255,230,235,0.8);border:1px solid rgba(255,160,180,0.4);color:#e05080;border-radius:12px;padding:7px 16px;font-size:12px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif}
        .finput{background:rgba(255,255,255,0.7);border:1.5px solid rgba(240,180,220,0.6);border-radius:10px;color:#4a0060;padding:8px 11px;font-size:13px;font-family:'Nunito',sans-serif;width:100%;outline:none;font-weight:700}
        .finput:focus{border-color:rgba(217,70,168,0.5)}
        .finput::placeholder{color:#d0a0c8;font-weight:600}
        .flbl{display:block;font-size:10px;font-weight:800;color:#c068a0;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;margin-top:10px}
        .flbl:first-child{margin-top:0}
        .edit-form{background:rgba(255,255,255,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1.5px solid rgba(240,180,220,0.5);border-radius:20px;padding:16px;margin-bottom:10px}
        .tip-box{background:rgba(255,210,235,0.3);border-left:2.5px solid rgba(217,70,168,0.35);padding:8px 12px;border-radius:0 10px 10px 0;margin-top:10px;font-size:12px;color:#a060b0;line-height:1.6;font-weight:700}
        .section-label{font-size:11px;font-weight:900;color:#b060a0;letter-spacing:.08em;text-transform:uppercase;margin:18px 0 10px;display:flex;align-items:center;gap:8px}
        .section-label::after{content:'';flex:1;height:1px;background:rgba(217,70,168,0.15)}
        .add-dashed{width:100%;padding:12px;border-radius:16px;border:2px dashed rgba(255,190,220,0.5);background:rgba(255,255,255,0.35);color:#c068a0;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;cursor:pointer;transition:all .2s;margin-top:4px}
        .add-dashed.yellow{border-color:rgba(255,210,100,0.5);color:#b08000}
        .wk-day{background:rgba(255,255,255,0.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,190,220,0.4);border-radius:18px;padding:14px 16px;margin-bottom:9px}
        .wk-day.today-day{background:rgba(255,228,245,0.7);border:1.5px solid rgba(217,70,168,0.3)}
        .wk-day.future-day{opacity:.6}
        .manage-row{background:rgba(255,255,255,0.6);border:1px solid rgba(255,190,220,0.35);border-radius:14px;padding:10px 14px;margin-bottom:7px;display:flex;align-items:center;gap:10px}
        .fixed-task-chip{background:rgba(200,240,255,0.7);border:1px solid rgba(100,200,240,0.4);border-radius:10px;padding:5px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#004a70}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .35s ease forwards}
      `}</style>

      {[{w:340,h:340,bg:"rgba(255,182,213,0.28)",top:-80,right:-60},{w:260,h:260,bg:"rgba(255,210,240,0.22)",bottom:60,left:-60},{w:180,h:180,bg:"rgba(238,180,255,0.18)",top:"45%",right:10},{w:140,h:140,bg:"rgba(255,230,245,0.35)",top:"30%",left:"5%"}]
        .map((b,i)=><div key={i} style={{position:"fixed",borderRadius:"50%",filter:"blur(60px)",pointerEvents:"none",zIndex:0,width:b.w,height:b.h,background:b.bg,top:b.top,bottom:b.bottom,left:b.left,right:b.right}}/>)}
      <Petals/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,rgba(255,240,250,0.85))",pointerEvents:"none",zIndex:10}}/>

      <div style={{maxWidth:480,margin:"0 auto",padding:"24px 16px 72px",position:"relative",zIndex:2}}>

        {/* ── SYNC BAR ── */}
        {!userId ? (
          <div style={{...glass,padding:"16px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:22}}>☁️</span>
              <div>
                <div style={{fontSize:13,fontWeight:900,color:"#5a006a"}}>设置同步昵称</div>
                <div style={{fontSize:11,color:"#c068a0",fontWeight:700}}>设置后可跨设备同步数据</div>
              </div>
            </div>
            <input className="finput" placeholder="输入你的昵称，例如：emma" value={userIdInput}
              onChange={e=>setUserIdInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetUserId()}
              style={{marginBottom:8}}/>
            <button className="save-btn" style={{width:"100%"}} onClick={handleSetUserId}>开启云同步</button>
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,190,220,0.35)",borderRadius:14,padding:"8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>{syncing?"🔄":syncStatus==="ok"?"☁️✅":syncStatus==="error"?"⚠️":"☁️"}</span>
            <span style={{fontSize:12,fontWeight:800,color:"#7a007a",flex:1}}>
              {syncing?"同步中…":syncStatus==="ok"?`已同步 · ${userId}`:syncStatus==="error"?"同步失败，检查网络":`已连接 · ${userId}`}
            </span>
            <button className="edt-btn" onClick={()=>{localStorage.removeItem("fit_user_id");setUserId("");setUserIdInput("");setSyncStatus(null);}}>切换</button>
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{...glass,padding:"22px 20px 20px",marginBottom:14,position:"relative",overflow:"hidden"}} className="fu">
          <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",background:"rgba(255,190,220,0.2)",top:-30,right:-20}}/>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.75)",border:"1px solid rgba(255,180,210,0.5)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:800,color:"#c0448a",marginBottom:10}}>
            🔥 {streak} 天连击
          </div>
          {editingGoal
            ? <GoalForm goal={goal} onSave={g=>{setGoal(g);setEditingGoal(false);}} onCancel={()=>setEditingGoal(false)}/>
            : <>
                <div style={{fontSize:24,fontWeight:900,color:"#8a1a8a",lineHeight:1.15,marginBottom:3,position:"relative",zIndex:1}}>{goal.title} ✨</div>
                <div style={{fontSize:12,color:"#c070a8",fontWeight:700,position:"relative",zIndex:1}}>{goal.subtitle}</div>
                {goal.targetWeight&&<div style={{fontSize:11,color:"#c070a8",marginTop:3,fontWeight:700}}>目标 {goal.targetWeight}{goal.targetDate&&` · ${goal.targetDate}`}</div>}
                {goal.notes&&<div style={{fontSize:11,color:"#c090b8",marginTop:2,fontStyle:"italic"}}>{goal.notes}</div>}
                <div style={{position:"absolute",right:18,top:18,fontSize:34,opacity:.45,zIndex:1}}>🌸</div>
                <button className="edt-btn" onClick={()=>setEditingGoal(true)} style={{position:"absolute",bottom:14,right:14,zIndex:2,background:"rgba(255,255,255,0.75)",border:"1px solid rgba(220,160,200,0.5)"}}>编辑目标</button>
              </>
          }
        </div>

        {/* ── PROGRESS ── */}
        <div style={{...glass,padding:"16px 18px",marginBottom:12}} className="fu">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:13}}>
            {[{val:completedCount,sub:`/${allTodayTasks.length}`,lbl:"今日完成",color:"#9b28bf"},{val:totalXP,sub:`/${maxXP}`,lbl:"经验值 XP",color:"#d946a8"}].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,190,220,0.35)",borderRadius:16,padding:"12px 14px",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.val}<span style={{fontSize:14,color:"#c09ac0",fontWeight:700}}>{s.sub}</span></div>
                <div style={{fontSize:11,color:"#c068a0",fontWeight:700,marginTop:1}}>{s.lbl}</div>
              </div>
            ))}
          </div>
          <div style={{height:10,background:"rgba(240,200,230,0.5)",borderRadius:5,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:5,background:"linear-gradient(90deg,#f9a8d4,#d946a8)",width:`${progress}%`,transition:"width .6s"}}/>
          </div>
          <div style={{textAlign:"right",fontSize:11,color:"#c068a0",marginTop:5,fontWeight:700}}>{progress}% 完成</div>
          {completedCount===allTodayTasks.length&&allTodayTasks.length>0&&(
            <div style={{marginTop:10,textAlign:"center",padding:"10px",background:"rgba(255,220,240,0.6)",border:"1px solid rgba(217,70,168,0.2)",borderRadius:14,color:"#9b28bf",fontSize:13,fontWeight:900}}>
              🌸 今日全部完成！你真的很棒！
            </div>
          )}
        </div>

        {/* ── FOCUS ── */}
        <div style={{...glass,padding:"13px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}} className="fu">
          <div style={{fontSize:26}}>{todayPlan.emoji}</div>
          <div>
            <div style={{fontSize:10,fontWeight:900,color:"#c070a0",letterSpacing:".08em",textTransform:"uppercase",marginBottom:2}}>今日重点</div>
            <div style={{fontSize:14,fontWeight:900,color:"#6a0080"}}>{todayPlan.focus}</div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{display:"flex",gap:6,marginBottom:13,flexWrap:"wrap"}}>
          {[["today","今日任务"],["week","每周计划"],["tips","减脂要点"],["reminders","提醒"]].map(([k,l])=>(
            <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {/* ══ TODAY ══ */}
        {tab==="today" && (
          <div className="fu">
            <div className="section-label">
              每日必做 · {defaultTasks.length} 项
              <button className="edt-btn" onClick={()=>{setManagingDefaults(v=>!v);setEditingDefault(null);setAddingDefault(false);}}>
                {managingDefaults?"完成":"管理"}
              </button>
            </div>
            {managingDefaults ? (
              <div>
                {defaultTasks.map((task,idx)=>(
                  editingDefault===task.id
                    ? <TaskForm key={task.id} task={task}
                        onSave={d=>{setDefaultTasks(ts=>ts.map(t=>t.id===task.id?{...t,...d}:t));setEditingDefault(null);}}
                        onCancel={()=>setEditingDefault(null)}
                        onDelete={()=>{setDefaultTasks(ts=>ts.filter(t=>t.id!==task.id));setEditingDefault(null);}}
                      />
                    : <div key={task.id} className="manage-row">
                        <div style={{display:"flex",flexDirection:"column",gap:2}}>
                          <button className="icon-btn" onClick={()=>moveDefault(idx,-1)} disabled={idx===0} style={{opacity:idx===0?.3:1}}>↑</button>
                          <button className="icon-btn" onClick={()=>moveDefault(idx,+1)} disabled={idx===defaultTasks.length-1} style={{opacity:idx===defaultTasks.length-1?.3:1}}>↓</button>
                        </div>
                        <div style={{fontSize:20}}>{task.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:800,color:"#5a006a"}}>{task.title}</div>
                          <div style={{fontSize:11,color:"#c068a0",fontWeight:700}}>{task.category} · {task.duration}</div>
                        </div>
                        <button className="edt-btn" onClick={()=>setEditingDefault(task.id)}>编辑</button>
                        <button className="icon-btn" style={{color:"#e05080",borderColor:"rgba(255,160,180,0.4)"}} onClick={()=>setDefaultTasks(ts=>ts.filter(t=>t.id!==task.id))}>✕</button>
                      </div>
                ))}
                {addingDefault
                  ? <TaskForm task={{id:genId(),icon:"✨",title:"",category:"",description:"",duration:"",tip:"",xp:20}} title="＋ 新增每日必做"
                      onSave={d=>{setDefaultTasks(ts=>[...ts,{...d,id:genId()}]);setAddingDefault(false);}}
                      onCancel={()=>setAddingDefault(false)}/>
                  : <button className="add-dashed" onClick={()=>setAddingDefault(true)}>＋ 新增每日必做任务</button>
                }
              </div>
            ) : (
              defaultTasks.map(task=>(
                <TaskRow key={task.id} task={task} checked={!!todayChecked[task.id]}
                  onToggle={()=>toggle(task.id)} expanded={expanded===task.id}
                  onExpand={()=>setExpanded(expanded===task.id?null:task.id)}/>
              ))
            )}

            {todayFixed.length>0 && <>
              <div className="section-label">本周固定 · {todayPlan.day}</div>
              {todayFixed.map(task=>(
                <TaskRow key={task.id} task={task} checked={!!todayChecked[task.id]}
                  onToggle={()=>toggle(task.id)} expanded={expanded===task.id}
                  onExpand={()=>setExpanded(expanded===task.id?null:task.id)}
                  badge={<span className="badge-fixed">📅 本周固定</span>}/>
              ))}
            </>}

            <div className="section-label">
              今日专属 · {todayKey}
              {todayExtras.length>0&&<span style={{fontSize:10,color:"#c068a0",fontWeight:700}}>{todayExtras.length} 项</span>}
            </div>
            {todayExtras.length===0&&!addingExtra&&(
              <div style={{textAlign:"center",padding:"14px 0 6px",color:"#d0a0c8",fontSize:13,fontWeight:700}}>今天还没有专属任务，加一个吧 ✨</div>
            )}
            {todayExtras.map(task=>(
              editingExtra===task.id
                ? <TaskForm key={task.id} task={task}
                    onSave={d=>{setExtraTasksByDay(p=>({...p,[todayKey]:(p[todayKey]||[]).map(t=>t.id===task.id?{...t,...d}:t)}));setEditingExtra(null);}}
                    onCancel={()=>setEditingExtra(null)}
                    onDelete={()=>{setExtraTasksByDay(p=>({...p,[todayKey]:(p[todayKey]||[]).filter(t=>t.id!==task.id)}));setCheckedByDay(p=>{const d={...(p[todayKey]||{})};delete d[task.id];return{...p,[todayKey]:d};});setEditingExtra(null);}}/>
                : <TaskRow key={task.id} task={task} checked={!!todayChecked[task.id]}
                    onToggle={()=>toggle(task.id)} onEdit={()=>setEditingExtra(task.id)}
                    expanded={expanded===task.id} onExpand={()=>setExpanded(expanded===task.id?null:task.id)}
                    badge={<span className="badge-extra">✨ 今日专属</span>}/>
            ))}
            {addingExtra
              ? <TaskForm task={{id:genId(),icon:"✨",title:"",category:"今日专属",description:"",duration:"",tip:"",xp:15}} title="✨ 添加今日专属任务"
                  onSave={d=>{setExtraTasksByDay(p=>({...p,[todayKey]:[...(p[todayKey]||[]),{...d,id:genId()}]}));setAddingExtra(false);}}
                  onCancel={()=>setAddingExtra(false)}/>
              : <button className="add-dashed yellow" onClick={()=>setAddingExtra(true)}>＋ 添加今日专属任务</button>
            }
          </div>
        )}

        {/* ══ WEEK ══ */}
        {tab==="week" && (
          <div className="fu">
            <div style={{fontSize:12,fontWeight:900,color:"#b060a0",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>本周打卡总览</div>
            <div style={{fontSize:11,color:"#c068a0",fontWeight:700,marginBottom:14}}>{weekDates[0]} ~ {weekDates[6]}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              {[{val:weekCompletedDays,sub:"/7",lbl:"全勤天数",color:"#9b28bf"},{val:`${weekAvgPct}%`,sub:"",lbl:"平均完成率",color:weekAvgPct>=80?"#059669":"#9b28bf"}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.65)",border:"1px solid rgba(255,190,220,0.35)",borderRadius:16,padding:"12px 14px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.val}<span style={{fontSize:14,color:"#c09ac0",fontWeight:700}}>{s.sub}</span></div>
                  <div style={{fontSize:11,color:"#c068a0",fontWeight:700,marginTop:1}}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:12,fontWeight:900,color:"#b060a0",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>每日安排 &amp; 固定任务</div>
            {weeklyPlan.map((plan,i)=>{
              const pct=weekStats[i]; const isToday=i===todayIdx; const isFuture=i>todayIdx; const isPerfect=pct!==null&&pct>=100;
              const dayExtras=(extraTasksByDay[weekDates[i]]||[]).length;
              const fixedCount=(plan.fixedTasks||[]).length;
              return (
                <div key={i} className={`wk-day ${isToday?"today-day":""} ${isFuture?"future-day":""}`}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:22}}>{plan.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:900,color:"#5a006a"}}>{plan.day}</span>
                        {isToday&&<span style={{background:"linear-gradient(135deg,#f0abcb,#d946a8)",color:"#fff",fontSize:10,fontWeight:900,padding:"2px 9px",borderRadius:20}}>今天</span>}
                        {fixedCount>0&&<span style={{background:"rgba(200,240,255,0.85)",color:"#005580",fontSize:9,fontWeight:900,padding:"1px 7px",borderRadius:6}}>固定{fixedCount}项</span>}
                        {dayExtras>0&&<span style={{background:"rgba(255,240,180,0.85)",color:"#a07000",fontSize:9,fontWeight:900,padding:"1px 7px",borderRadius:6}}>+{dayExtras}专属</span>}
                      </div>
                      <div style={{fontSize:11,color:"#c068a0",fontWeight:700}}>{plan.focus}</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:900,color:isPerfect?"#059669":"#9b28bf",flexShrink:0}}>
                      {pct!==null?(isPerfect?"✓ 100%":`${pct}%`):(isFuture?"—":"未记录")}
                    </span>
                  </div>
                  <div style={{height:7,background:"rgba(240,200,230,0.5)",borderRadius:4,overflow:"hidden",marginBottom:10}}>
                    <div style={{height:"100%",borderRadius:4,transition:"width .5s",background:isPerfect?"linear-gradient(90deg,#6ee7b7,#10b981)":"linear-gradient(90deg,#f9a8d4,#d946a8)",width:pct!==null?`${pct}%`:"0%"}}/>
                  </div>
                  {editingWeekDay===i
                    ? <WeekDayForm plan={plan}
                        onSave={d=>{setWeeklyPlan(p=>p.map((x,j)=>j===i?{...x,...d}:x));setEditingWeekDay(null);}}
                        onCancel={()=>setEditingWeekDay(null)}/>
                    : <button className="edt-btn" style={{marginBottom:8}} onClick={()=>setEditingWeekDay(i)}>编辑安排</button>
                  }
                  {(plan.fixedTasks||[]).map(task=>(
                    editingFixed?.dayIdx===i&&editingFixed?.taskId===task.id
                      ? <TaskForm key={task.id} task={task}
                          onSave={d=>{setWeeklyPlan(p=>p.map((x,j)=>j===i?{...x,fixedTasks:(x.fixedTasks||[]).map(t=>t.id===task.id?{...t,...d}:t)}:x));setEditingFixed(null);}}
                          onCancel={()=>setEditingFixed(null)}
                          onDelete={()=>{setWeeklyPlan(p=>p.map((x,j)=>j===i?{...x,fixedTasks:(x.fixedTasks||[]).filter(t=>t.id!==task.id)}:x));setEditingFixed(null);}}/>
                      : <div key={task.id} className="fixed-task-chip">
                          <span style={{fontSize:16}}>{task.icon}</span>
                          <span style={{flex:1}}>{task.title}{task.duration?` · ${task.duration}`:""}</span>
                          <button className="icon-btn" style={{fontSize:11,padding:"2px 6px",color:"#005580",borderColor:"rgba(100,200,240,0.4)"}} onClick={()=>setEditingFixed({dayIdx:i,taskId:task.id})}>编辑</button>
                          <button className="icon-btn" style={{fontSize:11,padding:"2px 6px",color:"#e05080",borderColor:"rgba(255,160,180,0.4)"}} onClick={()=>setWeeklyPlan(p=>p.map((x,j)=>j===i?{...x,fixedTasks:(x.fixedTasks||[]).filter(t=>t.id!==task.id)}:x))}>✕</button>
                        </div>
                  ))}
                  {addingFixed===i
                    ? <TaskForm task={{id:genId(),icon:"📅",title:"",category:"本周固定",description:"",duration:"",tip:"",xp:20}} title={`${plan.day} · 添加固定任务`}
                        onSave={d=>{setWeeklyPlan(p=>p.map((x,j)=>j===i?{...x,fixedTasks:[...(x.fixedTasks||[]),{...d,id:genId()}]}:x));setAddingFixed(null);}}
                        onCancel={()=>setAddingFixed(null)}/>
                    : <button className="add-dashed" style={{marginTop:8,fontSize:11,padding:"8px"}} onClick={()=>{setAddingFixed(i);setEditingFixed(null);}}>＋ 添加 {plan.day} 固定任务</button>
                  }
                  {isToday&&pct!==null&&!isPerfect&&<div style={{fontSize:11,color:"#c060a0",fontWeight:700,marginTop:8}}>还差 {allTodayTasks.length-Math.round(pct*allTodayTasks.length/100)} 项，加油！✨</div>}
                  {isPerfect&&<div style={{fontSize:11,color:"#16a34a",fontWeight:700,marginTop:8}}>🌟 完美完成！</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TIPS ══ */}
        {tab==="tips" && (
          <div className="fu">
            {TIPS.map((tip,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.55)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255,190,220,0.4)",borderRadius:20,padding:"16px",marginBottom:9,display:"flex",gap:12,alignItems:"flex-start"}}>
                <span style={{fontSize:22,flexShrink:0}}>{tip.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:900,color:"#9b28bf",marginBottom:5}}>{tip.title}</div>
                  <div style={{fontSize:13,color:"#a060b0",lineHeight:1.7,fontWeight:700}}>{tip.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ REMINDERS ══ */}
        {tab==="reminders" && (
          <div className="fu">
            {permission!=="granted" && (
              <div style={{background:"rgba(255,220,240,0.7)",border:"1.5px solid rgba(217,70,168,0.3)",borderRadius:18,padding:"16px",marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:6}}>🔔</div>
                <div style={{fontSize:13,fontWeight:800,color:"#7a0070",marginBottom:4}}>
                  {permission==="denied"?"通知权限已被拒绝":"开启通知权限"}
                </div>
                <div style={{fontSize:12,color:"#b060a0",fontWeight:700,marginBottom:12,lineHeight:1.6}}>
                  {permission==="denied"?"请到手机设置 → Chrome → 通知，手动开启权限":"允许通知后，即可在指定时间收到健身提醒"}
                </div>
                {permission!=="denied"&&(
                  <button className="save-btn" onClick={async()=>{ const p=await requestPermission(); setPermission(p); if(p==="granted") scheduleAll(reminders); }}>允许通知</button>
                )}
              </div>
            )}
            {permission==="granted"&&(
              <div style={{background:"rgba(220,255,220,0.6)",border:"1px solid rgba(100,200,100,0.4)",borderRadius:14,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>✅</span>
                <span style={{fontSize:12,fontWeight:800,color:"#1a7a1a"}}>通知权限已开启，提醒将按时送达</span>
              </div>
            )}
            <div style={{background:"rgba(255,245,200,0.7)",border:"1px solid rgba(200,170,50,0.4)",borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,flexShrink:0}}>💡</span>
              <div style={{fontSize:12,color:"#7a6000",fontWeight:700,lineHeight:1.6}}>建议添加到主屏幕（浏览器菜单 → 添加到主屏幕），App 关闭时也能收到提醒。</div>
            </div>
            <div style={{fontSize:12,fontWeight:900,color:"#b060a0",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>提醒设置</div>
            {reminders.map((r,i)=>(
              editingReminder===r.id
                ? <ReminderEditForm key={r.id} reminder={r}
                    onSave={d=>{setReminders(rs=>rs.map(x=>x.id===r.id?{...x,...d}:x));setEditingReminder(null);}}
                    onCancel={()=>setEditingReminder(null)}/>
                : <div key={r.id} style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255,190,220,0.4)",borderRadius:18,padding:"14px 16px",marginBottom:9}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{fontSize:24}}>{r.enabled?"🔔":"🔕"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:900,color:"#5a006a",marginBottom:2}}>{r.label}</div>
                        <div style={{fontSize:12,color:"#c068a0",fontWeight:700}}>{r.time} · {r.message.slice(0,20)}…</div>
                      </div>
                      <div onClick={()=>setReminders(rs=>rs.map(x=>x.id===r.id?{...x,enabled:!x.enabled}:x))}
                        style={{width:44,height:24,borderRadius:12,background:r.enabled?"linear-gradient(135deg,#f0abcb,#d946a8)":"rgba(220,200,220,0.6)",cursor:"pointer",position:"relative",transition:"background .3s",flexShrink:0}}>
                        <div style={{position:"absolute",top:3,left:r.enabled?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .3s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
                      </div>
                      <button className="edt-btn" onClick={()=>setEditingReminder(r.id)}>编辑</button>
                    </div>
                  </div>
            ))}
            {permission==="granted"&&(
              <button className="add-dashed" style={{marginTop:8}} onClick={()=>fireNotification("🌸 测试提醒","这是一条测试通知，收到说明提醒功能正常！")}>
                发送测试通知
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
