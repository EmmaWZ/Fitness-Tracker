import { useState, useEffect } from "react";

const DAILY_TASKS = [
  {
    id: "cardio",
    category: "有氧燃脂",
    icon: "🔥",
    title: "有氧训练",
    description: "快走/跑步/骑车/跳绳",
    duration: "30–45 分钟",
    tip: "心率保持在最大心率的65–75%，燃脂效果最佳",
    xp: 30,
  },
  {
    id: "strength",
    category: "力量塑形",
    icon: "💪",
    title: "力量训练",
    description: "复合动作为主（深蹲/硬拉/卧推/划船）",
    duration: "40–60 分钟",
    tip: "每组8–12次，组间休息60s，提升代谢率",
    xp: 40,
  },
  {
    id: "core",
    category: "体态核心",
    icon: "⚡",
    title: "核心训练",
    description: "平板支撑 / 死虫 / 鸟狗 / 卷腹",
    duration: "10–15 分钟",
    tip: "核心稳定是体态改善的基础，每天必练",
    xp: 20,
  },
  {
    id: "stretch",
    category: "体态修复",
    icon: "🧘",
    title: "拉伸放松",
    description: "胸椎 / 髋屈肌 / 肩部拉伸",
    duration: "10–15 分钟",
    tip: "改善圆肩驼背，保持训练后肌肉弹性",
    xp: 15,
  },
  {
    id: "steps",
    category: "日常活动",
    icon: "👟",
    title: "每日步数",
    description: "全天保持活跃，避免久坐",
    duration: "≥ 8000 步",
    tip: "NEAT（非运动活动产热）占每日消耗的15–30%",
    xp: 15,
  },
  {
    id: "water",
    category: "营养支持",
    icon: "💧",
    title: "足量饮水",
    description: "白水 / 淡茶 / 无糖饮料",
    duration: "≥ 2000 mL",
    tip: "充分水合有助于代谢废物排出和脂肪动员",
    xp: 10,
  },
  {
    id: "protein",
    category: "营养支持",
    icon: "🥩",
    title: "蛋白质摄入",
    description: "鸡胸/鱼/蛋/豆腐/乳清蛋白",
    duration: "体重 × 1.6–2g",
    tip: "高蛋白保留肌肉、提升饱腹感，减脂必备",
    xp: 10,
  },
  {
    id: "sleep",
    category: "恢复",
    icon: "🌙",
    title: "优质睡眠",
    description: "保证深度睡眠，避免熬夜",
    duration: "7–9 小时",
    tip: "睡眠不足导致皮质醇升高，阻碍脂肪分解",
    xp: 20,
  },
];

const WEEKLY_PLAN = [
  { day: "周一", focus: "上肢力量 + 有氧", emoji: "💪" },
  { day: "周二", focus: "下肢力量 + 核心", emoji: "🦵" },
  { day: "周三", focus: "低强度有氧 + 拉伸", emoji: "🧘" },
  { day: "周四", focus: "全身力量 + HIIT", emoji: "⚡" },
  { day: "周五", focus: "上肢力量 + 有氧", emoji: "🔥" },
  { day: "周六", focus: "户外活动 / 长距离步行", emoji: "🌿" },
  { day: "周日", focus: "主动恢复 + 充分拉伸", emoji: "🌙" },
];

const todayIndex = new Date().getDay(); // 0=Sun
const dayMap = [6, 0, 1, 2, 3, 4, 5]; // JS Sun=0 → 周日=index6

export default function FitnessTracker() {
  const todayKey = new Date().toISOString().split("T")[0];
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(`fit_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [tab, setTab] = useState("today");
  const [expanded, setExpanded] = useState(null);
  const [streak, setStreak] = useState(7);

  useEffect(() => {
    try {
      localStorage.setItem(`fit_${todayKey}`, JSON.stringify(checked));
    } catch {}
  }, [checked, todayKey]);

  const toggle = (id) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalXP = DAILY_TASKS.filter((t) => checked[t.id]).reduce(
    (s, t) => s + t.xp,
    0
  );
  const maxXP = DAILY_TASKS.reduce((s, t) => s + t.xp, 0);
  const progress = Math.round((completedCount / DAILY_TASKS.length) * 100);

  const todayPlan = WEEKLY_PLAN[dayMap[todayIndex]];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e8e4dc",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        .bg-orb {
          position: fixed; border-radius: 50%; filter: blur(80px);
          pointer-events: none; z-index: 0;
        }
        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }
        .card:hover { background: rgba(255,255,255,0.06); }
        .task-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .task-item.done {
          background: rgba(180, 255, 140, 0.06);
          border-color: rgba(180, 255, 140, 0.2);
        }
        .task-item:hover { transform: translateX(3px); }
        .check-btn {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          background: transparent;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .check-btn.done {
          background: #b4ff8c;
          border-color: #b4ff8c;
        }
        .tab-btn {
          padding: 8px 20px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: rgba(180, 255, 140, 0.15);
          border-color: #b4ff8c;
          color: #b4ff8c;
        }
        .progress-bar {
          height: 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #b4ff8c, #5de8b0);
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .xp-badge {
          background: rgba(93,232,176,0.15);
          border: 1px solid rgba(93,232,176,0.3);
          color: #5de8b0;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .category-tag {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.05em;
        }
        .tip-box {
          background: rgba(180,255,140,0.05);
          border-left: 2px solid rgba(180,255,140,0.4);
          padding: 8px 12px;
          border-radius: 0 8px 8px 0;
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
        }
        .week-day-card {
          padding: 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          text-align: center;
          transition: all 0.2s;
        }
        .week-day-card.active-day {
          background: rgba(180,255,140,0.08);
          border-color: rgba(180,255,140,0.3);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

      {/* Background orbs */}
      <div className="bg-orb" style={{ width:400,height:400,background:"rgba(180,255,140,0.06)",top:-100,right:-100 }} />
      <div className="bg-orb" style={{ width:300,height:300,background:"rgba(93,232,176,0.05)",bottom:100,left:-80 }} />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 16px 80px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
              {new Date().toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"long"})}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:16 }}>🔥</span>
              <span style={{ fontSize:13, color:"#ff8c42", fontWeight:700 }}>{streak} 天连击</span>
            </div>
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, letterSpacing:"-0.02em", color:"#fff", lineHeight:1.1 }}>
            今日训练<br/><span style={{ color:"#b4ff8c" }}>减脂塑形</span>
          </h1>
        </div>

        {/* XP / Progress Card */}
        <div className="card fade-up" style={{ padding:"18px 20px", marginBottom:20, animationDelay:"0.05s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>今日完成度</p>
              <p style={{ fontSize:26, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#fff" }}>
                {completedCount}<span style={{ fontSize:14, color:"rgba(255,255,255,0.3)", fontWeight:400 }}>/{DAILY_TASKS.length}</span>
              </p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>经验值</p>
              <p style={{ fontSize:26, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#5de8b0" }}>
                {totalXP}<span style={{ fontSize:14, color:"rgba(255,255,255,0.3)", fontWeight:400 }}>/{maxXP}</span>
              </p>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width:`${progress}%` }} />
          </div>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:6, textAlign:"right" }}>{progress}% 完成</p>
          {completedCount === DAILY_TASKS.length && (
            <div style={{ marginTop:12, textAlign:"center", padding:"8px", background:"rgba(180,255,140,0.1)", borderRadius:8, color:"#b4ff8c", fontSize:13, fontWeight:600 }}>
              🎉 今日全部完成！太棒了！
            </div>
          )}
        </div>

        {/* Today's focus */}
        <div className="card fade-up" style={{ padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12, animationDelay:"0.08s" }}>
          <span style={{ fontSize:24 }}>{todayPlan.emoji}</span>
          <div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>今日重点</p>
            <p style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{todayPlan.focus}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {[["today","今日任务"],["week","每周计划"],["tips","减脂要点"]].map(([key,label])=>(
            <button key={key} className={`tab-btn ${tab===key?"active":""}`} onClick={()=>setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* TODAY TAB */}
        {tab === "today" && (
          <div className="fade-up">
            {DAILY_TASKS.map((task, i) => (
              <div
                key={task.id}
                className={`task-item ${checked[task.id] ? "done" : ""}`}
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
              >
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <button
                    className={`check-btn ${checked[task.id] ? "done" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggle(task.id); }}
                  >
                    {checked[task.id] ? "✓" : ""}
                  </button>
                  <span style={{ fontSize:20 }}>{task.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                      <span className="category-tag">{task.category}</span>
                      <span className="xp-badge">+{task.xp} XP</span>
                    </div>
                    <p style={{ fontSize:15, fontWeight:600, color: checked[task.id] ? "rgba(255,255,255,0.5)" : "#fff",
                      textDecoration: checked[task.id] ? "line-through" : "none" }}>
                      {task.title}
                    </p>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:2 }}>
                      {task.description} · {task.duration}
                    </p>
                  </div>
                  <span style={{ color:"rgba(255,255,255,0.25)", fontSize:12, transition:"transform 0.2s",
                    transform: expanded===task.id ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                </div>
                {expanded === task.id && (
                  <div className="tip-box">
                    💡 {task.tip}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* WEEK TAB */}
        {tab === "week" && (
          <div className="fade-up">
            <div style={{ display:"grid", gap:10 }}>
              {WEEKLY_PLAN.map((plan, i) => (
                <div key={i} className={`week-day-card ${dayMap[todayIndex] === i ? "active-day" : ""}`}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:22 }}>{plan.emoji}</span>
                    <div style={{ textAlign:"left" }}>
                      <p style={{ fontSize:12, fontWeight:700, color: dayMap[todayIndex]===i ? "#b4ff8c" : "rgba(255,255,255,0.5)", marginBottom:2 }}>
                        {plan.day} {dayMap[todayIndex]===i && "· 今天"}
                      </p>
                      <p style={{ fontSize:14, color:"#fff", fontWeight:500 }}>{plan.focus}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIPS TAB */}
        {tab === "tips" && (
          <div className="fade-up">
            {[
              { icon:"🔥", title:"热量缺口", content:"每日热量缺口控制在300–500kcal，避免过度节食导致肌肉流失。慢慢来，每周减重0.5–1kg最理想。" },
              { icon:"💪", title:"力量训练优先", content:"减脂期不能只做有氧！力量训练提高基础代谢率，帮你在休息时也持续燃烧脂肪，并塑造肌肉线条。" },
              { icon:"🥩", title:"蛋白质是关键", content:"高蛋白饮食保留肌肉、提升饱腹感、加速代谢。每天每公斤体重摄入1.6–2g蛋白质是减脂期标配。" },
              { icon:"⚡", title:"HIIT vs LISS", content:"HIIT（高强度间歇）燃脂效率高，每周2–3次即可；LISS（低强度稳态有氧）可每天进行，两者结合效果最佳。" },
              { icon:"🧘", title:"体态改善重点", content:"圆肩驼背改善：每天拉伸胸大肌，强化中下斜方肌和菱形肌。骨盆前倾改善：强化臀部和腹部，拉伸髋屈肌。" },
              { icon:"🌙", title:"睡眠与恢复", content:"睡眠不足使皮质醇升高，抑制脂肪分解，增加暴食欲望。7–9小时优质睡眠是减脂的隐藏利器。" },
              { icon:"📏", title:"衡量进展", content:"不要只看体重！拍照对比、量围度（腰/臀/手臂）、感受体力变化，这些往往比体重更能反映真实进步。" },
            ].map((tip, i) => (
              <div key={i} className="card" style={{ padding:"16px", marginBottom:10 }}>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{tip.icon}</span>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:"#b4ff8c", marginBottom:6 }}>{tip.title}</p>
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
