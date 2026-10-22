const React = window.__OCTOP_REACT__;
const { jsx: _jsx, jsxs: _jsxs } = window.__OCTOP_JSX__;
const { useEffect, useMemo, useRef, useState } = React;

const STYLE_ID = "octop-rerun-navigation-styles";
const autoOpenedCalls = new Set();

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes orn-pulse { 0%,100% { opacity:.42; transform:scale(.82) } 50% { opacity:1; transform:scale(1.14) } }
    @keyframes orn-dash { to { stroke-dashoffset:-28 } }
    @keyframes orn-fade { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
    .orn-root * { box-sizing:border-box }
    .orn-root button { font:inherit }
    .orn-tab { transition:background .18s ease,color .18s ease,transform .18s ease }
    .orn-tab:hover { transform:translateY(-1px) }
    .orn-action { transition:background .18s ease,border-color .18s ease,transform .18s ease }
    .orn-action:hover { transform:translateY(-1px) }
    .orn-action:active { transform:translateY(0) }
    .orn-map-grid { background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:24px 24px }
    .orn-event { animation:orn-fade .25s ease both }
    .orn-scroll::-webkit-scrollbar { width:6px;height:6px }
    .orn-scroll::-webkit-scrollbar-thumb { background:rgba(151,166,158,.28);border-radius:9px }
  `;
  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function formatEta(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `${s} 秒`;
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`;
}

function safeViewerUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const parsed = new URL(value, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function safeApiPath(value) {
  if (typeof value !== "string") return "";
  const path = value.trim();
  return path.startsWith("/") && !path.startsWith("//") ? path : "";
}

function responseData(value) {
  if (!value || typeof value !== "object") return {};
  if (value.data && typeof value.data === "object") return value.data;
  return value;
}

function Icon({ name, size = 16, color = "currentColor", stroke = 1.8 }) {
  const paths = {
    target: [
      _jsx("circle", { cx: 12, cy: 12, r: 7 }),
      _jsx("circle", { cx: 12, cy: 12, r: 2 }),
      _jsx("path", { d: "M12 2v3M12 19v3M2 12h3M19 12h3" }),
    ],
    route: [
      _jsx("circle", { cx: 6, cy: 18, r: 2 }),
      _jsx("circle", { cx: 18, cy: 6, r: 2 }),
      _jsx("path", { d: "M7.6 16.8c2.2-1.5 1.5-4.7 4.1-5.8 2-.9 3.3.1 4.8-3.2" }),
    ],
    clock: [_jsx("circle", { cx: 12, cy: 12, r: 9 }), _jsx("path", { d: "M12 7v5l3.2 2" })],
    wifi: [_jsx("path", { d: "M4 9a12 12 0 0116 0M7 12.5a7.5 7.5 0 0110 0M10.5 16a2.5 2.5 0 013 0" }), _jsx("circle", { cx: 12, cy: 19, r: 1, fill: color, stroke: "none" })],
    map: [_jsx("path", { d: "M3 6l5-2 8 3 5-2v13l-5 2-8-3-5 2V6zM8 4v13M16 7v13" })],
    cube: [_jsx("path", { d: "M12 2.8l8 4.5v9.4l-8 4.5-8-4.5V7.3l8-4.5zM4.4 7.5L12 12l7.6-4.5M12 12v9" })],
    pause: [_jsx("path", { d: "M8 5v14M16 5v14" })],
    play: [_jsx("path", { d: "M8 5l11 7-11 7V5z" })],
    stop: [_jsx("rect", { x: 6, y: 6, width: 12, height: 12, rx: 2 })],
    expand: [_jsx("path", { d: "M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" })],
    external: [_jsx("path", { d: "M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6" })],
    spark: [_jsx("path", { d: "M12 3l1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3zM5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7L5 15z" })],
    chevron: [_jsx("path", { d: "M9 18l6-6-6-6" })],
  };
  return _jsx("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    children: React.Children.toArray(paths[name] || paths.spark),
  });
}

function Badge({ children, tone = "neutral", dark }) {
  const tones = {
    lime: dark ? ["rgba(184,243,74,.12)", "#cafa73", "rgba(184,243,74,.22)"] : ["#ecfbd3", "#345b05", "#cdeb9c"],
    coral: dark ? ["rgba(255,138,101,.12)", "#ffad94", "rgba(255,138,101,.22)"] : ["#fff0eb", "#9c341c", "#ffd0c2"],
    neutral: dark ? ["rgba(255,255,255,.055)", "#acbab4", "rgba(255,255,255,.09)"] : ["#f1f4f2", "#52605a", "#e1e7e4"],
  };
  const [background, color, border] = tones[tone] || tones.neutral;
  return _jsx("span", {
    style: { display: "inline-flex", alignItems: "center", gap: 6, height: 25, padding: "0 9px", borderRadius: 999, background, color, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },
    children,
  });
}

function Metric({ icon, label, value, detail, dark }) {
  return _jsxs("div", {
    style: { minWidth: 0, padding: "11px 12px", borderRadius: 13, background: dark ? "rgba(255,255,255,.035)" : "#f6f8f7", border: dark ? "1px solid rgba(255,255,255,.065)" : "1px solid #e8ecea" },
    children: [
      _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, color: dark ? "#84938c" : "#7a8982", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }, children: [_jsx(Icon, { name: icon, size: 13 }), label] }),
      _jsxs("div", { style: { marginTop: 7, display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }, children: [
        _jsx("strong", { style: { color: dark ? "#f2f6f3" : "#14201b", fontSize: 16, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: value }),
        detail ? _jsx("span", { style: { color: dark ? "#6f7c76" : "#9aa59f", fontSize: 10, whiteSpace: "nowrap" }, children: detail }) : null,
      ] }),
    ],
  });
}

function MapView({ dark, progress, destination }) {
  const p = clamp(progress, 0, 1);
  const robotX = 94 + p * 137;
  const robotY = 197 - p * 72;
  return _jsxs("div", {
    className: "orn-map-grid",
    style: { position: "relative", minHeight: 330, height: "100%", overflow: "hidden", borderRadius: 15, background: dark ? "#111a17" : "#edf2ef", border: dark ? "1px solid rgba(255,255,255,.065)" : "1px solid #dfe7e3" },
    children: [
      _jsxs("div", { style: { position: "absolute", zIndex: 3, top: 12, left: 12, display: "flex", gap: 6 }, children: [
        _jsx(Badge, { tone: "lime", dark, children: _jsxs(React.Fragment, { children: [_jsx("span", { style: { width: 6, height: 6, borderRadius: 99, background: "#98d52c", boxShadow: "0 0 0 4px rgba(152,213,44,.13)" } }), "LOCALIZED 96%"] }) }),
        _jsx(Badge, { dark, children: "2D MAP" }),
      ] }),
      _jsxs("svg", { viewBox: "0 0 520 330", preserveAspectRatio: "xMidYMid meet", style: { position: "absolute", inset: 0, width: "100%", height: "100%" }, children: [
        _jsx("defs", { children: _jsx("filter", { id: "orn-shadow", x: "-50%", y: "-50%", width: "200%", height: "200%", children: _jsx("feDropShadow", { dx: 0, dy: 4, stdDeviation: 5, floodColor: "#000", floodOpacity: .25 }) }) }),
        _jsx("path", { d: "M55 60H212V91H311V54H468V163H432V279H274V254H166V285H55V60Z", fill: dark ? "#18231f" : "#f8faf9", stroke: dark ? "#3a4a43" : "#cbd6d1", strokeWidth: 2 }),
        _jsx("path", { d: "M55 160h111M166 60v100M212 91v69M311 54v106M212 160h99M432 163H311M311 160v94M166 160v125M274 254v-58M311 196h121", fill: "none", stroke: dark ? "#35433d" : "#d6dedb", strokeWidth: 2 }),
        _jsx("path", { d: "M91 221C118 200 144 214 162 186C183 154 197 169 221 145C240 126 259 130 286 116C312 102 338 105 375 104", fill: "none", stroke: dark ? "rgba(184,243,74,.14)" : "rgba(112,165,27,.14)", strokeWidth: 13, strokeLinecap: "round" }),
        _jsx("path", { d: "M91 221C118 200 144 214 162 186C183 154 197 169 221 145C240 126 259 130 286 116C312 102 338 105 375 104", fill: "none", stroke: "#aee83d", strokeWidth: 3.2, strokeLinecap: "round", strokeDasharray: "7 7", style: { animation: "orn-dash 1.6s linear infinite" } }),
        _jsx("path", { d: "M88 224C67 244 65 260 79 274", fill: "none", stroke: dark ? "#55645d" : "#a9b7b0", strokeWidth: 2, strokeDasharray: "4 5" }),
        _jsx("circle", { cx: 375, cy: 104, r: 17, fill: "rgba(255,138,101,.13)", stroke: "rgba(255,138,101,.35)" }),
        _jsx("circle", { cx: 375, cy: 104, r: 6.5, fill: "#ff8a65", filter: "url(#orn-shadow)" }),
        _jsx("path", { d: "M375 92l4 7h-8l4-7z", fill: "#fff" }),
        _jsx("circle", { cx: robotX, cy: robotY, r: 18, fill: "rgba(184,243,74,.11)", style: { transformOrigin: `${robotX}px ${robotY}px`, animation: "orn-pulse 2s ease-in-out infinite" } }),
        _jsx("circle", { cx: robotX, cy: robotY, r: 10, fill: "#efffcf", stroke: "#739f1d", strokeWidth: 3, filter: "url(#orn-shadow)" }),
        _jsx("path", { d: `M${robotX} ${robotY - 7}l4 7-4-2-4 2 4-7z`, fill: "#426110" }),
        _jsx("text", { x: 82, y: 92, fill: dark ? "#65756d" : "#89968f", fontSize: 11, fontWeight: 600, children: "客厅" }),
        _jsx("text", { x: 348, y: 81, fill: dark ? "#87958e" : "#67756e", fontSize: 11, fontWeight: 700, children: destination || "厨房门口" }),
        _jsx("text", { x: 335, y: 232, fill: dark ? "#65756d" : "#89968f", fontSize: 11, fontWeight: 600, children: "走廊" }),
        _jsx("text", { x: 87, y: 268, fill: dark ? "#65756d" : "#89968f", fontSize: 11, fontWeight: 600, children: "工作区" }),
      ] }),
      _jsxs("div", { style: { position: "absolute", left: 12, bottom: 12, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, color: dark ? "#cbd5d0" : "#33423b", background: dark ? "rgba(8,13,11,.82)" : "rgba(255,255,255,.88)", backdropFilter: "blur(10px)", border: dark ? "1px solid rgba(255,255,255,.07)" : "1px solid rgba(24,49,38,.08)", fontSize: 11 }, children: [
        _jsx("span", { style: { width: 7, height: 7, borderRadius: 99, background: "#b8f34a" } }),
        _jsx("strong", { children: "Octop Rover" }),
        _jsx("span", { style: { opacity: .55 }, children: `· ${Math.round(p * 100)}%` }),
      ] }),
    ],
  });
}

function CameraView({ dark }) {
  return _jsxs("div", {
    style: { position: "relative", minHeight: 145, overflow: "hidden", borderRadius: 14, background: dark ? "linear-gradient(145deg,#26312c,#101714 58%,#1f2924)" : "linear-gradient(145deg,#e2e7e4,#c4cec9 58%,#edf1ef)", border: dark ? "1px solid rgba(255,255,255,.065)" : "1px solid #dfe7e3" },
    children: [
      _jsx("div", { style: { position: "absolute", inset: "14% 12% 0", borderTop: dark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(42,64,53,.15)", transform: "perspective(240px) rotateX(58deg)", backgroundImage: dark ? "linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)" : "linear-gradient(rgba(32,58,45,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(32,58,45,.07) 1px,transparent 1px)", backgroundSize: "20px 20px" } }),
      _jsx("div", { style: { position: "absolute", left: "13%", top: "19%", width: "28%", height: "52%", border: dark ? "1px solid rgba(255,255,255,.09)" : "1px solid rgba(41,65,53,.12)", background: dark ? "#313d37" : "#b9c4bf", transform: "skewY(-7deg)" } }),
      _jsx("div", { style: { position: "absolute", right: "13%", top: "28%", width: "25%", height: "43%", borderRadius: "7px 7px 2px 2px", background: dark ? "#34423b" : "#aebbb4", boxShadow: dark ? "0 15px 30px #0b100e" : "0 15px 30px rgba(64,84,74,.2)" } }),
      _jsx("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 45%,rgba(7,12,10,.38))" } }),
      _jsxs("div", { style: { position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, color: "#f2f6f3", fontSize: 9, letterSpacing: ".08em", fontWeight: 800 }, children: [_jsx("span", { style: { width: 6, height: 6, borderRadius: 9, background: "#ff8a65", boxShadow: "0 0 0 4px rgba(255,138,101,.13)" } }), "CAM 01 · DEMO"] }),
      _jsx("div", { style: { position: "absolute", left: "49%", top: "54%", width: 42, height: 32, border: "1px solid rgba(184,243,74,.62)", borderRadius: 5 } }),
      _jsx("div", { style: { position: "absolute", left: "calc(49% + 2px)", top: "calc(54% - 15px)", padding: "2px 5px", borderRadius: 4, background: "#b8f34a", color: "#253506", fontSize: 8, fontWeight: 800, children: "CLEAR 0.94" } }),
    ],
  });
}

function Timeline({ events, dark }) {
  const rows = Array.isArray(events) ? events.slice(0, 4) : [];
  return _jsxs("div", {
    style: { minHeight: 0 },
    children: [
      _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }, children: [
        _jsx("div", { style: { color: dark ? "#e5ebe8" : "#1d2923", fontSize: 11, fontWeight: 800, letterSpacing: ".05em" }, children: "MISSION LOG" }),
        _jsx("span", { style: { color: dark ? "#6e7d75" : "#99a49f", fontSize: 10 }, children: "实时" }),
      ] }),
      _jsx("div", { className: "orn-scroll", style: { maxHeight: 142, overflow: "auto" }, children: rows.map((event, index) =>
        _jsxs("div", { className: "orn-event", style: { position: "relative", display: "grid", gridTemplateColumns: "13px 1fr auto", gap: 8, minHeight: 35, color: dark ? "#bbc6c0" : "#53615a", fontSize: 10 }, children: [
          _jsx("span", { style: { position: "relative", zIndex: 1, width: 7, height: 7, marginTop: 4, borderRadius: 20, background: event.kind === "active" ? "#b8f34a" : dark ? "#4c5d54" : "#bdc8c2", boxShadow: event.kind === "active" ? "0 0 0 4px rgba(184,243,74,.1)" : "none" } }),
          _jsx("span", { style: { paddingBottom: 10, lineHeight: 1.45, color: index === 0 ? (dark ? "#eff5f1" : "#243029") : undefined }, children: event.text || "" }),
          _jsx("span", { style: { color: dark ? "#66746d" : "#9aa59f", whiteSpace: "nowrap" }, children: event.time || "" }),
          index < rows.length - 1 ? _jsx("span", { style: { position: "absolute", left: 3, top: 13, bottom: -2, width: 1, background: dark ? "#2b3832" : "#dfe6e2" } }) : null,
        ] }, `${event.time || index}-${index}`),
      ) }),
    ],
  });
}

function RerunPanel({ viewerUrl, dark }) {
  if (!viewerUrl) {
    return _jsxs("div", {
      style: { minHeight: 430, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", borderRadius: 15, border: dark ? "1px dashed rgba(184,243,74,.2)" : "1px dashed #bfd590", background: dark ? "radial-gradient(circle at 50% 40%,rgba(184,243,74,.065),transparent 36%),#111916" : "radial-gradient(circle at 50% 40%,rgba(151,205,48,.11),transparent 38%),#f4f7f5", color: dark ? "#e8efeb" : "#1a271f" },
      children: [_jsxs("div", { style: { maxWidth: 390, padding: 30 }, children: [
        _jsx("div", { style: { width: 56, height: 56, margin: "0 auto 18px", borderRadius: 17, display: "grid", placeItems: "center", color: "#b8f34a", background: dark ? "rgba(184,243,74,.09)" : "#eaf8cf", border: dark ? "1px solid rgba(184,243,74,.18)" : "1px solid #d4edaa" }, children: _jsx(Icon, { name: "cube", size: 27 }) }),
        _jsx("div", { style: { fontSize: 18, fontWeight: 800 }, children: "等待 Rerun 实时流" }),
        _jsx("p", { style: { margin: "9px 0 16px", color: dark ? "#88968f" : "#708078", fontSize: 12, lineHeight: 1.65 }, children: "在工具配置中填入机器人电脑的 Rerun Web Viewer 完整地址，此处将直接嵌入实时可视化。" }),
        _jsx("code", { style: { display: "inline-block", padding: "8px 11px", borderRadius: 8, color: dark ? "#c7f570" : "#4e760a", background: dark ? "#0b110e" : "#e9f1ed", fontSize: 11 }, children: "http://ROBOT_IP:9090" }),
      ] })],
    });
  }
  return _jsxs("div", { style: { position: "relative", minHeight: 430, height: "100%", overflow: "hidden", borderRadius: 15, background: "#090b0a", border: dark ? "1px solid rgba(255,255,255,.08)" : "1px solid #dfe5e2" }, children: [
    _jsx("iframe", { src: viewerUrl, title: "Rerun Web Viewer", allow: "fullscreen; clipboard-read; clipboard-write", sandbox: "allow-scripts allow-same-origin allow-downloads allow-popups", style: { display: "block", width: "100%", height: "100%", minHeight: 430, border: 0, background: "#090b0a" } }),
    _jsx("a", { href: viewerUrl, target: "_blank", rel: "noreferrer", title: "在新窗口打开 Rerun", style: { position: "absolute", zIndex: 4, top: 10, right: 10, width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 9, color: "#eff5f1", background: "rgba(15,22,19,.78)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "blur(8px)" }, children: _jsx(Icon, { name: "external", size: 15 }) }),
  ] });
}

function ActionButton({ icon, label, onClick, dark, danger = false, primary = false, disabled = false }) {
  let background = dark ? "rgba(255,255,255,.045)" : "#f5f7f6";
  let color = dark ? "#d5ded9" : "#405048";
  let border = dark ? "rgba(255,255,255,.085)" : "#e0e6e3";
  if (primary) {
    background = "#b8f34a";
    color = "#263408";
    border = "#b8f34a";
  } else if (danger) {
    background = dark ? "rgba(255,138,101,.08)" : "#fff3ef";
    color = dark ? "#ff9d80" : "#b94a2d";
    border = dark ? "rgba(255,138,101,.18)" : "#ffd6c9";
  }
  return _jsxs("button", { className: "orn-action", type: "button", onClick, disabled, style: { minWidth: 0, height: 36, padding: "0 13px", borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: `1px solid ${border}`, background, color, cursor: disabled ? "wait" : "pointer", opacity: disabled ? .58 : 1, fontSize: 11, fontWeight: 800 }, children: [_jsx(Icon, { name: icon, size: 14 }), label] });
}

function NavigationCockpit(props) {
  ensureStyles();
  const context = props.host.getToolContext();
  const dark = context.theme === "dark";
  const initial = props.data && typeof props.data === "object" ? props.data : {};
  const [data, setData] = useState(initial);
  const [activeTab, setActiveTab] = useState("overview");
  const [wide, setWide] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [controlError, setControlError] = useState("");
  const [syncState, setSyncState] = useState("connected");
  const rootRef = useRef(null);
  const dataRef = useRef(initial);
  const viewerUrl = useMemo(() => safeViewerUrl(data.viewer_url), [data.viewer_url]);

  useEffect(() => {
    dataRef.current = initial;
    setData(initial);
  }, [props.data]);
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 690));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (initial.auto_open === false || !props.callId || autoOpenedCalls.has(props.callId)) return;
    autoOpenedCalls.add(props.callId);
    props.host.openSidePanel({
      callId: props.callId,
      title: "导航驾驶舱",
      toolName: props.toolName,
    });
  }, [initial.auto_open, props.callId, props.host, props.toolName]);

  const replaceData = (nextData, persist = true) => {
    dataRef.current = nextData;
    setData(nextData);
    if (persist && props.callId) props.host.patchResult(props.callId, nextData);
  };

  const patch = (next, eventText) => {
    const current = dataRef.current;
    const nextData = {
      ...current,
      ...next,
      revision: Number(current.revision || 0) + 1,
      updated_at: new Date().toISOString(),
      events: eventText
        ? [{ time: "刚刚", kind: "active", text: eventText }, ...(Array.isArray(current.events) ? current.events : [])].slice(0, 5)
        : current.events,
    };
    replaceData(nextData);
  };

  useEffect(() => {
    if (data.mode !== "demo" || data.state !== "navigating") return undefined;
    const timer = setInterval(() => {
      const current = dataRef.current;
      if (current.mode !== "demo" || current.state !== "navigating") return;
      const distance = Math.max(0, Number(current.distance_remaining_m || 0) - .12);
      const progress = Math.min(1, Number(current.progress || 0) + .006);
      const arrived = distance <= .05 || progress >= 1;
      const nextData = {
        ...current,
        state: arrived ? "succeeded" : "navigating",
        distance_remaining_m: arrived ? 0 : distance,
        eta_seconds: arrived ? 0 : Math.max(1, Number(current.eta_seconds || 0) - 1),
        progress: arrived ? 1 : progress,
        speed_mps: arrived ? 0 : .31,
        revision: Number(current.revision || 0) + 1,
        updated_at: new Date().toISOString(),
        events: arrived
          ? [{ time: "刚刚", kind: "active", text: `已到达${current.destination || "目的地"}` }, ...(Array.isArray(current.events) ? current.events : [])].slice(0, 5)
          : current.events,
      };
      replaceData(nextData);
    }, 1000);
    return () => clearInterval(timer);
  }, [data.mode, data.state]);

  useEffect(() => {
    const statusPath = safeApiPath(data.status_path);
    if (data.mode === "demo" || !statusPath) return undefined;
    let active = true;
    let timer;
    const poll = async () => {
      let nextDelay = 1000;
      try {
        const current = dataRef.current;
        const separator = statusPath.includes("?") ? "&" : "?";
        const result = await props.host.request(
          `${statusPath}${separator}after_revision=${encodeURIComponent(String(current.revision || 0))}`,
        );
        if (!active) return;
        const remote = responseData(result);
        if (Object.keys(remote).length) replaceData({ ...current, ...remote }, false);
        setSyncState("connected");
      } catch {
        nextDelay = 2500;
        if (active) setSyncState("reconnecting");
      } finally {
        if (active) timer = setTimeout(poll, nextDelay);
      }
    };
    poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [data.mode, data.status_path, props.host]);

  const dispatchAction = async (action) => {
    if (pendingAction) return;
    setControlError("");
    const current = dataRef.current;
    const actionPath = safeApiPath(current.actions?.[action]);
    if (!actionPath || current.mode === "demo") {
      if (action === "pause") patch({ state: "paused", speed_mps: 0 }, "模拟导航已暂停");
      if (action === "resume") patch({ state: "navigating", speed_mps: .31 }, "模拟导航已继续");
      if (action === "cancel") patch({ state: "cancelled", speed_mps: 0 }, "模拟任务已停止");
      if (action === "restart") patch({ state: "navigating", progress: .12, distance_remaining_m: 13.6, eta_seconds: 81, speed_mps: .31 }, "模拟任务已重新开始");
      return;
    }
    setPendingAction(action);
    try {
      const result = await props.host.request(actionPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission_id: current.mission_id,
          expected_revision: current.revision,
        }),
      });
      const remote = responseData(result);
      replaceData({ ...current, ...remote }, false);
    } catch (error) {
      setControlError(error instanceof Error ? error.message : "操作失败，请重试");
    } finally {
      setPendingAction("");
    }
  };

  const state = data.state || "navigating";
  const paused = state === "paused";
  const stopped = state === "cancelled";
  const succeeded = state === "succeeded";
  const progress = clamp(data.progress, 0, 1);
  const statusLabel = succeeded ? "已到达" : stopped ? "已停止" : paused ? "已暂停" : "导航中";
  const text = dark ? "#eff4f1" : "#17231d";
  const muted = dark ? "#83918a" : "#74827b";
  const panel = dark ? "#16201c" : "#ffffff";
  const border = dark ? "rgba(255,255,255,.075)" : "#e3e9e6";

  return _jsxs("section", {
    ref: rootRef,
    className: "orn-root",
    "data-octop-plugin-ui": "rerun-navigation",
    style: { width: "100%", maxWidth: 960, minWidth: 0, overflow: "hidden", borderRadius: 20, color: text, background: dark ? "#0e1512" : "#f4f7f5", border: `1px solid ${border}`, boxShadow: dark ? "0 18px 50px rgba(0,0,0,.24)" : "0 18px 50px rgba(20,42,31,.11)", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
    children: [
      _jsxs("header", { style: { padding: wide ? "17px 18px 15px" : "15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: panel, borderBottom: `1px solid ${border}` }, children: [
        _jsxs("div", { style: { minWidth: 0, display: "flex", alignItems: "center", gap: 11 }, children: [
          _jsx("div", { style: { width: 36, height: 36, flex: "0 0 auto", borderRadius: 11, display: "grid", placeItems: "center", color: "#b8f34a", background: dark ? "#202d27" : "#17231d", boxShadow: "inset 0 0 0 1px rgba(184,243,74,.13)" }, children: _jsx(Icon, { name: "route", size: 20, stroke: 2.2 }) }),
          _jsxs("div", { style: { minWidth: 0 }, children: [
            _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("strong", { style: { fontSize: 13.5, letterSpacing: "-.01em" }, children: "Navigation Cockpit" }), _jsx(Badge, { tone: data.mode === "demo" ? "coral" : "lime", dark, children: data.mode === "demo" ? "UI DEMO" : "LIVE" })] }),
            _jsxs("div", { style: { marginTop: 3, color: muted, fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: ["MISSION / ", data.mission_id || "nav_demo_01", " · REV ", String(data.revision || 0), syncState === "reconnecting" ? " · RECONNECTING" : ""] }),
          ] }),
        ] }),
        _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          _jsx(Badge, { tone: stopped ? "coral" : "lime", dark, children: _jsxs(React.Fragment, { children: [_jsx("span", { style: { width: 6, height: 6, borderRadius: 99, background: stopped ? "#ff8a65" : "#aee83d", boxShadow: stopped ? "none" : "0 0 0 4px rgba(174,232,61,.11)" } }), statusLabel] }) }),
          props.callId ? _jsx("button", { type: "button", title: "在侧边栏打开", onClick: () => props.host.openSidePanel({ callId: props.callId, title: "导航驾驶舱", toolName: props.toolName }), style: { width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 9, border: `1px solid ${border}`, color: muted, background: dark ? "rgba(255,255,255,.035)" : "#f8faf9", cursor: "pointer" }, children: _jsx(Icon, { name: "expand", size: 14 }) }) : null,
        ] }),
      ] }),
      _jsxs("div", { style: { padding: wide ? "14px 18px 0" : "13px 14px 0", background: panel, display: "flex", alignItems: "center", gap: 7 }, children: [
        _jsx("button", { className: "orn-tab", type: "button", onClick: () => setActiveTab("overview"), style: { height: 31, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9, border: 0, cursor: "pointer", color: activeTab === "overview" ? (dark ? "#eef4f0" : "#142019") : muted, background: activeTab === "overview" ? (dark ? "rgba(255,255,255,.075)" : "#edf2ef") : "transparent", fontSize: 11, fontWeight: 750 }, children: _jsxs(React.Fragment, { children: [_jsx(Icon, { name: "map", size: 14 }), "导航概览"] }) }),
        _jsx("button", { className: "orn-tab", type: "button", onClick: () => setActiveTab("rerun"), style: { height: 31, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9, border: 0, cursor: "pointer", color: activeTab === "rerun" ? (dark ? "#eef4f0" : "#142019") : muted, background: activeTab === "rerun" ? (dark ? "rgba(255,255,255,.075)" : "#edf2ef") : "transparent", fontSize: 11, fontWeight: 750 }, children: _jsxs(React.Fragment, { children: [_jsx(Icon, { name: "cube", size: 14 }), "Rerun 实时流", viewerUrl ? _jsx("span", { style: { width: 5, height: 5, marginLeft: 1, borderRadius: 10, background: "#aee83d" } }) : null] }) }),
      ] }),
      _jsx("div", { style: { padding: wide ? 18 : 14 }, children: activeTab === "rerun" ? _jsx(RerunPanel, { viewerUrl, dark }) : _jsxs(React.Fragment, { children: [
        _jsxs("div", { style: { display: "grid", gridTemplateColumns: wide ? "repeat(4,minmax(0,1fr))" : "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 10 }, children: [
          _jsx(Metric, { icon: "target", label: "Destination", value: data.destination || "厨房门口", dark }),
          _jsx(Metric, { icon: "route", label: "Remaining", value: `${Number(data.distance_remaining_m || 0).toFixed(1)} m`, detail: `${Math.round(progress * 100)}%`, dark }),
          _jsx(Metric, { icon: "clock", label: "Arrival", value: formatEta(data.eta_seconds), detail: "ETA", dark }),
          _jsx(Metric, { icon: "wifi", label: "Connection", value: data.network?.status === "good" ? "良好" : "检查中", detail: `${data.network?.latency_ms || "—"} ms`, dark }),
        ] }),
        _jsxs("div", { style: { display: "grid", gridTemplateColumns: wide ? "minmax(0,1.72fr) minmax(235px,.78fr)" : "1fr", gap: 10, minHeight: 330 }, children: [
          _jsx(MapView, { dark, progress, destination: data.destination }),
          _jsxs("aside", { style: { minWidth: 0, display: "grid", gridTemplateRows: "auto 1fr", gap: 13, padding: 12, borderRadius: 15, background: panel, border: `1px solid ${border}` }, children: [_jsx(CameraView, { dark }), _jsx(Timeline, { events: data.events, dark })] }),
        ] }),
      ] }) }),
      controlError ? _jsx("div", { style: { margin: "0 14px 10px", padding: "9px 11px", borderRadius: 9, color: dark ? "#ffad94" : "#a83e24", background: dark ? "rgba(255,138,101,.08)" : "#fff0eb", border: dark ? "1px solid rgba(255,138,101,.17)" : "1px solid #ffd1c4", fontSize: 11 }, children: controlError }) : null,
      _jsxs("footer", { style: { padding: wide ? "13px 18px" : "12px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, background: panel, borderTop: `1px solid ${border}` }, children: [
        _jsxs("div", { style: { minWidth: 0, display: "flex", alignItems: "center", gap: 8, color: muted, fontSize: 10.5 }, children: [_jsx("span", { style: { width: 7, height: 7, flex: "0 0 auto", borderRadius: 20, background: "#aee83d", boxShadow: "0 0 0 4px rgba(174,232,61,.1)" } }), _jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: `位于${data.current_area || "起居区"} · ${Number(data.speed_mps || 0).toFixed(2)} m/s · ${data.network?.band || "Wi-Fi"}` })] }),
        _jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 }, children: [
          stopped || succeeded
            ? _jsx(ActionButton, { icon: "play", label: pendingAction ? "处理中" : "重新开始", primary: true, dark, disabled: !!pendingAction, onClick: () => dispatchAction("restart") })
            : _jsx(ActionButton, { icon: paused ? "play" : "pause", label: pendingAction ? "处理中" : paused ? "继续" : "暂停", primary: !paused, dark, disabled: !!pendingAction, onClick: () => dispatchAction(paused ? "resume" : "pause") }),
          !succeeded ? _jsx(ActionButton, { icon: "stop", label: "停止", danger: true, dark, disabled: !!pendingAction || stopped, onClick: () => dispatchAction("cancel") }) : null,
        ] }),
      ] }),
    ],
  });
}

export function setup(host) {
  host.registerRenderer({
    id: "rerun_navigation",
    tools: ["show_navigation_cockpit", "robot_navigate_to", "robot_get_status"],
    component: NavigationCockpit,
  });
}
