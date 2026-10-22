"""Rerun navigation cockpit preview for Octop.

The tool only produces a structured UI payload. It does not control a robot.
Future MCP navigation tools can reuse the same renderer by returning an
``octop_ui.renderer`` value of ``rerun_navigation``.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

from octop_harness.plugins import PluginContext, get_tool_config


async def show_navigation_cockpit(destination: str = "厨房门口") -> str:
    """Open a read-only preview of the navigation cockpit for a destination.

    This tool does not move a robot. Use it to preview the live navigation UI
    and an administrator-configured Rerun Web Viewer connection.
    """
    config = get_tool_config("show_navigation_cockpit") or {}
    viewer_url = str(config.get("rerun_viewer_url") or "").strip()
    destination = (destination or "").strip() or "厨房门口"
    now = datetime.now(UTC).isoformat()
    data = {
        "mode": "demo",
        "auto_open": True,
        "mission_id": "nav_demo_01",
        "revision": 18,
        "state": "navigating",
        "destination": destination,
        "current_area": "起居区",
        "distance_remaining_m": 8.4,
        "eta_seconds": 54,
        "progress": 0.42,
        "speed_mps": 0.31,
        "localization_quality": 0.96,
        "network": {"status": "good", "latency_ms": 24, "band": "2.4 GHz"},
        "viewer_url": viewer_url,
        "status_path": "",
        "actions": {},
        "updated_at": now,
        "events": [
            {"time": "刚刚", "kind": "active", "text": "已绕过前方障碍物"},
            {"time": "12 秒前", "kind": "normal", "text": "路径更新完成"},
            {"time": "31 秒前", "kind": "normal", "text": f"开始前往{destination}"},
        ],
    }
    payload = {
        "octop_ui": {"renderer": "rerun_navigation", "version": 1},
        "data": data,
        "text": f"已打开前往「{destination}」的导航驾驶舱预览（不会控制真实机器人）。",
    }
    return json.dumps(payload, ensure_ascii=False)


def setup(ctx: PluginContext) -> None:
    ctx.tool(
        "show_navigation_cockpit",
        show_navigation_cockpit,
        description=(
            "Show a read-only Octop navigation cockpit preview for a destination. "
            "This tool never moves a physical robot. Use it only to preview the "
            "navigation UI and configured Rerun Web Viewer."
        ),
        config_fields=[
            {
                "name": "rerun_viewer_url",
                "type": "text",
                "required": False,
                "description": (
                    "Full HTTP(S) URL of the Rerun Web Viewer hosted on the robot computer"
                ),
            },
        ],
    )
