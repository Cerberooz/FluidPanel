import os
from datetime import datetime, timezone

import requests
from flask import Flask, render_template

app = Flask(__name__)

# ---------- CONFIGURATION ----------
PANEL_URL = os.environ.get("PANEL_URL", "https://panel.fluxservers.cloud").rstrip("/")
API_KEY = os.environ.get("PANEL_API_KEY", "")
# -----------------------------------

def fetch_nodes():
    """Fetch all nodes from the Pterodactyl API."""
    if not API_KEY:
        print("PANEL_API_KEY is not configured")
        return None
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
    }
    try:
        resp = requests.get(f"{PANEL_URL}/api/application/nodes", headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except requests.exceptions.RequestException as e:
        print(f"API error: {e}")
        return None

def process_nodes(nodes_raw):
    """Extract relevant fields and determine status."""
    processed = []
    for node in nodes_raw:
        attrs = node.get("attributes", {})
        maintenance = attrs.get("maintenance_mode", False)
        # "Active" if NOT in maintenance, else "Offline"
        status = "offline" if maintenance else "active"
        processed.append({
            "id": attrs.get("id", "?"),
            "name": attrs.get("name", "Unnamed Node"),
            "description": attrs.get("description", "No description"),
            "location_id": attrs.get("location_id", "N/A"),
            "public": attrs.get("public", True),
            "created_at": attrs.get("created_at", ""),
            "status": status,
            "maintenance_mode": maintenance,
        })
    return processed

@app.route("/")
def status_page():
    raw = fetch_nodes()

    if raw is None:
        # API call failed
        return render_template(
            "status.html",
            error=True,
            error_message="Could not connect to Pterodactyl panel. Check your settings or panel status.",
            nodes=[],
            total=0,
            active_count=0,
            progress=0
        )

    nodes = process_nodes(raw)
    total = len(nodes)
    active_count = sum(1 for n in nodes if n["status"] == "active")
    progress = (active_count / total * 100) if total > 0 else 0

    return render_template(
        "status.html",
        error=False,
        error_message=None,
        nodes=nodes,
        total=total,
        active_count=active_count,
        progress=round(progress, 1),
        now=datetime.now(timezone.utc),
    )

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
