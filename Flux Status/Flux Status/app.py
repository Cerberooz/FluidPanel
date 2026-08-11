import os
from datetime import datetime, timezone

import requests
from flask import Flask, render_template

app = Flask(__name__)

# ---------- CONFIGURATION ----------
PANEL_URL = os.environ.get("PANEL_URL", "https://panel.fluxservers.cloud").rstrip("/")
API_KEY = os.environ.get("PANEL_API_KEY", "")
# -----------------------------------

REGION_ORDER = ["Europe", "Asia", "North America", "Oceania", "South America", "Africa", "Other"]

# Match both a location's full name (for example "Frankfurt, Germany") and
# common location short codes. Add an entry when a new country is added.
LOCATION_REGIONS = {
    "Europe": (
        ("🇩🇪", ("germany", "frankfurt", "de-", "de_", "deu")),
        ("🇫🇷", ("france", "paris", "fr-", "fr_", "fra")),
        ("🇳🇱", ("netherlands", "amsterdam", "nl-", "nl_", "nld")),
        ("🇬🇧", ("united kingdom", "uk", "london", "england", "gb-", "gb_")),
        ("🇫🇮", ("finland", "helsinki", "fi-", "fi_", "fin")),
        ("🇸🇪", ("sweden", "stockholm", "se-", "se_", "swe")),
        ("🇵🇱", ("poland", "warsaw", "pl-", "pl_", "pol")),
        ("🇪🇸", ("spain", "madrid", "es-", "es_", "esp")),
        ("🇮🇹", ("italy", "milan", "it-", "it_", "ita")),
        ("🇨🇭", ("switzerland", "zurich", "ch-", "ch_", "che")),
        ("🇳🇴", ("norway", "oslo", "no-", "no_", "nor")),
    ),
    "Asia": (
        ("🇸🇬", ("singapore", "sg-", "sg_", "sgp")),
        ("🇯🇵", ("japan", "tokyo", "osaka", "jp-", "jp_", "jpn")),
        ("🇭🇰", ("hong kong", "hk-", "hk_", "hkg")),
        ("🇮🇳", ("india", "mumbai", "delhi", "in-", "in_", "ind")),
        ("🇰🇷", ("korea", "seoul", "kr-", "kr_", "kor")),
        ("🇮🇩", ("indonesia", "jakarta", "id-", "id_", "idn")),
    ),
    "North America": (
        ("🇺🇸", ("united states", "usa", "us-", "us_", "new york", "dallas", "miami", "los angeles", "chicago")),
        ("🇨🇦", ("canada", "toronto", "montreal", "ca-", "ca_", "can")),
    ),
    "Oceania": (("🇦🇺", ("australia", "sydney", "melbourne", "au-", "au_", "aus")),),
    "South America": (("🇧🇷", ("brazil", "sao paulo", "são paulo", "br-", "br_", "bra")),),
    "Africa": (("🇿🇦", ("south africa", "johannesburg", "cape town", "za-", "za_", "zaf")),),
}


def fetch_resource(path):
    """Fetch an Application API collection, or return None on failure."""
    if not API_KEY:
        print("PANEL_API_KEY is not configured")
        return None
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "Application/vnd.pterodactyl.v1+json",
    }
    try:
        resp = requests.get(f"{PANEL_URL}/api/application/{path}", headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except requests.exceptions.RequestException as e:
        print(f"API error fetching {path}: {e}")
        return None

def location_region(location_name: str):
    """Return a display region and flag from a panel location name/code."""
    value = location_name.casefold()
    for region, countries in LOCATION_REGIONS.items():
        for flag, aliases in countries:
            if any(alias in value for alias in aliases):
                return region, flag
    return "Other", "🌐"


def capacity(total, used):
    """Calculate a safe, display-ready capacity summary in panel units (MB)."""
    total = max(int(total or 0), 0)
    used = max(int(used or 0), 0)
    if total == 0:
        return {"total": 0, "used": used, "free": 0, "free_percent": 0.0, "known": False}

    free = max(total - used, 0)
    return {
        "total": total,
        "used": used,
        "free": free,
        "free_percent": round((free / total) * 100, 2),
        "known": True,
    }


def process_nodes(nodes_raw, locations):
    """Extract relevant fields and determine status."""
    processed = []
    for node in nodes_raw:
        attrs = node.get("attributes", {})
        maintenance = attrs.get("maintenance_mode", False)
        location = locations.get(attrs.get("location_id"), {})
        location_name = location.get("long") or location.get("short") or f"Location {attrs.get('location_id', 'N/A')}"
        region, flag = location_region(location_name)
        allocated = attrs.get("allocated_resources") or {}
        # "Active" if NOT in maintenance, else "Offline"
        status = "offline" if maintenance else "active"
        processed.append({
            "id": attrs.get("id", "?"),
            "name": attrs.get("name", "Unnamed Node"),
            "description": attrs.get("description", "No description"),
            "location_id": attrs.get("location_id", "N/A"),
            "location_name": location_name,
            "region": region,
            "flag": flag,
            "memory": capacity(attrs.get("memory"), allocated.get("memory")),
            "disk": capacity(attrs.get("disk"), allocated.get("disk")),
            "public": attrs.get("public", True),
            "created_at": attrs.get("created_at", ""),
            "status": status,
            "maintenance_mode": maintenance,
        })
    return processed


def group_nodes(nodes):
    groups = {region: [] for region in REGION_ORDER}
    for node in nodes:
        groups.setdefault(node["region"], []).append(node)
    return [
        {"name": region, "nodes": sorted(groups[region], key=lambda node: (node["location_name"], node["name"]))}
        for region in REGION_ORDER
        if groups.get(region)
    ]

@app.route("/")
def status_page():
    raw = fetch_resource("nodes")

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

    location_raw = fetch_resource("locations") or []
    locations = {
        item.get("attributes", {}).get("id"): item.get("attributes", {})
        for item in location_raw
    }
    nodes = process_nodes(raw, locations)
    node_groups = group_nodes(nodes)
    total = len(nodes)
    active_count = sum(1 for n in nodes if n["status"] == "active")
    progress = (active_count / total * 100) if total > 0 else 0

    return render_template(
        "status.html",
        error=False,
        error_message=None,
        nodes=nodes,
        node_groups=node_groups,
        total=total,
        active_count=active_count,
        progress=round(progress, 1),
        now=datetime.now(timezone.utc),
    )

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
