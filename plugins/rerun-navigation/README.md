# Rerun 导航驾驶舱

这是 Octop 中面向具身 Agent 的可视化插件原型。当前版本只模拟导航任务，不会向真实机器人发送控制命令。

## 体验预览

在 Octop 仓库根目录启动静态服务：

```bash
python3 -m http.server 4173
```

打开 `http://127.0.0.1:4173/plugins/rerun-navigation/preview/`。

## 安装到 Octop

```bash
octop plugin install ./plugins/rerun-navigation --force
```

在 Dashboard 中启用 `show_navigation_cockpit` 工具。调用后会自动打开右侧 Tool UI Dock，左侧聊天保持可用。传入 `auto_open: false` 可禁止自动打开。

## 连接 Rerun

1. 在远程电脑上启动 Rerun Web Viewer，并确保本机能通过 HTTP(S) 访问。
2. 在 Octop 的工具配置里，把 `rerun_viewer_url` 设为完整的 Viewer 地址，例如 `http://192.168.1.42:9090`。
3. 再次调用工具，在「Rerun 实时流」标签中查看嵌入视图。

Rerun 页面使用 `iframe` 嵌入，因此：

- Octop 使用 HTTPS 时，Rerun Viewer 也应使用 HTTPS，否则浏览器可能拦截混合内容。
- Viewer 不应返回禁止嵌入的 `X-Frame-Options` / CSP 头。
- Rerun SDK 与 Web Viewer 应使用兼容版本。

## 数据协议

任何 Octop 插件工具或 MCP 工具都可复用此 renderer：

```json
{
  "octop_ui": { "renderer": "rerun_navigation", "version": 1 },
  "data": {
    "mission_id": "nav_205",
    "mode": "live",
    "auto_open": true,
    "revision": 31,
    "state": "navigating",
    "destination": "厨房门口",
    "current_area": "起居区",
    "distance_remaining_m": 8.4,
    "eta_seconds": 54,
    "progress": 0.42,
    "speed_mps": 0.31,
    "viewer_url": "http://192.168.1.42:9090",
    "status_path": "/robot/missions/nav_205/status",
    "actions": {
      "pause": "/robot/missions/nav_205/pause",
      "resume": "/robot/missions/nav_205/resume",
      "cancel": "/robot/missions/nav_205/cancel",
      "restart": "/robot/missions/nav_205/restart"
    },
    "network": { "status": "good", "latency_ms": 24, "band": "2.4 GHz" },
    "events": [{ "time": "刚刚", "kind": "active", "text": "路径已更新" }]
  },
  "text": "正在前往厨房门口。"
}
```

不要在 tool result 中传输视频、地图或 Rerun 记录数据；只传状态字段和 `viewer_url`。

## 实时状态与操作

- `mode: "demo"`：插件在浏览器中模拟任务进度，暂停/继续/停止只修改演示数据。
- `mode: "live"`：插件每秒通过 `host.request()` 请求 `status_path`，请求由 Octop 携带认证。
- `actions`：右侧按钮向对应的 Octop `/api` 相对路径发送 `POST`，内容为 `mission_id` 和 `expected_revision`。
- 操作返回值可直接是任务状态对象，也可放在 `{ "data": { ... } }` 中。

不要将 Robot Gateway 的 token 放进 `data`、`viewer_url` 或前端 JavaScript。`status_path` 和 `actions` 应指向 Octop 同源后端代理，再由服务端访问 Gateway。
