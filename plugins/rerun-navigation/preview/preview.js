const React = window.React;
const ReactDOM = window.ReactDOM;

window.__OCTOP_REACT__ = React;
function createJsxElement(type, props, key, staticChildren) {
  const { children, ...rest } = props || {};
  const nextProps = key == null ? rest : { ...rest, key };
  if (staticChildren && Array.isArray(children)) {
    return React.createElement(type, nextProps, ...children);
  }
  return React.createElement(type, nextProps, children);
}
window.__OCTOP_JSX__ = {
  jsx(type, props, key) {
    return createJsxElement(type, props, key, false);
  },
  jsxs(type, props, key) {
    return createJsxElement(type, props, key, true);
  },
};

const registrations = [];
const host = {
  registerRenderer(registration) { registrations.push(registration); },
  getToolContext() { return { agentId: "preview", threadId: "preview", locale: "zh", theme: "dark" }; },
  patchResult(_callId, nextData) { render(nextData); },
  request() { return Promise.reject(new Error("Preview host has no API")); },
  openSidePanel() {
    const status = document.getElementById("dock-status");
    if (status) status.textContent = "右侧 Dock 已自动打开 · 实时更新";
  },
  closeSidePanel() {},
};

const module = await import("../ui/index.js");
module.setup(host);
const Component = registrations[0].component;

const initialData = {
  mode: "demo",
  auto_open: true,
  mission_id: "nav_demo_01",
  revision: 18,
  state: "navigating",
  destination: "厨房门口",
  current_area: "起居区",
  distance_remaining_m: 8.4,
  eta_seconds: 54,
  progress: 0.42,
  speed_mps: 0.31,
  localization_quality: 0.96,
  network: { status: "good", latency_ms: 24, band: "2.4 GHz" },
  viewer_url: "",
  status_path: "",
  actions: {},
  events: [
    { time: "刚刚", kind: "active", text: "已绕过前方障碍物" },
    { time: "12 秒前", kind: "normal", text: "路径更新完成" },
    { time: "31 秒前", kind: "normal", text: "开始前往厨房门口" },
  ],
};

let currentData = initialData;
const previewRoot = ReactDOM.createRoot(document.getElementById("root"));
function render(nextData = currentData) {
  currentData = nextData;
  previewRoot.render(
    React.createElement(Component, {
      pluginId: "rerun-navigation",
      toolName: "show_navigation_cockpit",
      callId: "preview-call",
      status: "done",
      args: { destination: "厨房门口" },
      data: currentData,
      host,
      isStreaming: false,
    }),
  );
}

render();
