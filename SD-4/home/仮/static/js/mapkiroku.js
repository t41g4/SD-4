// =========================
// Leaflet 初期化
// =========================
const map = L.map('map', { zoomControl: false }).setView([35.394789, 139.465846], 13);

// OSM タイル
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// =========================
// 現在地取得して初期位置に設定
// =========================
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // 現在地へ視点移動
            map.setView([lat, lng], 15);

            // マーカー表示
            L.marker([lat, lng])
                .addTo(map)
                .bindPopup("現在地")
                .openPopup();
        },
        (err) => {
            console.error("位置情報が許可されませんでした: ", err);
        }
    );
} else {
    alert("このブラウザでは位置情報が利用できません");
}

// =========================
// 住所検索（Enter だけで発動）
// =========================
document.getElementById("addressInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        searchAddress();
    }
});

// 住所検索関数
function searchAddress() {
    const addr = document.getElementById("addressInput").value;
    if (!addr) return;

    // Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`;

    fetch(url, {
        headers: {
            "User-Agent": "MyMapApp/1.0 (contact@example.com)",
            "Referer": window.location.origin
        }
    })
        .then(response => response.json())
        .then(result => {
            if (result.length === 0) {
                alert("該当する住所が見つかりませんでした。");
                return;
            }
            const lat = result[0].lat;
            const lon = result[0].lon;

            // 地図移動
            map.setView([lat, lon], 16);
        })
        .catch(() => {
            alert("住所検索中にエラーが発生しました。");
        });
}

// =========================
// OSRM ルート描画
// =========================
async function drawRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes[0].geometry;

    L.geoJSON(route, {
        style: { color: 'blue', weight: 4 }
    }).addTo(map);
}

// =========================
// マーカー管理
// =========================
let allMarkers = [];
let mode = "normal"; // "normal" | "register" | "select"
let highlightTimeout = null;

// モード切替ボタン
function updateModeButton() {
    const modeBtn = document.getElementById("modeToggleBtn");
    if (!modeBtn) return console.error("モードボタンが見つかりません");

    if (mode === "normal") {
        modeBtn.className = "btn btn-primary mode-btn";
        modeBtn.innerText = "🔵 通常モード";
    } else if (mode === "register") {
        modeBtn.className = "btn btn-danger mode-btn";
        modeBtn.innerText = "📍 ピン登録モード：ON";
    } else if (mode === "select") {
        modeBtn.className = "btn btn-warning mode-btn";
        modeBtn.innerText = "🟡 選択モード";
    }
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    // モードボタン初期化
    const modeBtn = document.getElementById("modeToggleBtn");
    if (modeBtn) {
        modeBtn.addEventListener("click", () => {
            if (mode === "normal") mode = "register";
            else if (mode === "register") mode = "select";
            else mode = "normal";
            updateModeButton();
        });
    }

    // マーカーパネル Offcanvas 初期化
    window.panel = new bootstrap.Offcanvas(document.getElementById('markerDetailPanel'));

    // 初回モードボタン表示
    updateModeButton();
});

// =========================
// 選択モード用アイコン
// =========================
const normalIcon = L.ExtraMarkers.icon({
    icon: "fa-number",
    number: "",
    markerColor: "blue",
    shape: "circle",
    prefix: "fa"
});

const selectedIcon = L.ExtraMarkers.icon({
    icon: "fa-check",
    markerColor: "red",
    shape: "circle",
    prefix: "fa"
});

// =========================
// マーカー追加関数
// =========================
function addMarker(lat, lng, data = { name: "", datetime: "", photo: "" }) {
    const marker = L.marker([lat, lng], { icon: normalIcon }).addTo(map);
    marker.data = data;
    marker.isSelected = false;
    marker.on("click", () => handleMarkerClick(marker));
    allMarkers.push(marker);
    return marker;
}

// =========================
// マーカー詳細パネル
// =========================
function openPanel(marker) {
    document.getElementById('markerName').value = marker.data.name || "";
    document.getElementById('markerDate').value = marker.data.datetime || "";
    document.getElementById('markerPhoto').value = "";

    const inputs = document.querySelectorAll("#markerDetailPanel input");
    const saveBtn = document.querySelector("#markerDetailPanel button[type='submit']");
    const deleteBtn = document.getElementById("deleteBtn");

    // ===== モードに応じた入力制御 =====
    if (mode === "normal" || mode === "select") {
        inputs.forEach(i => i.disabled = true);
        saveBtn.style.display = "none";
        deleteBtn.style.display = "none";
    } else if (mode === "register") {
        inputs.forEach(i => i.disabled = false);
        saveBtn.style.display = "block";
        deleteBtn.style.display = "block";
    }

    // 保存処理
    const form = document.getElementById("markerForm");
    form.onsubmit = (e) => {
        e.preventDefault();
        marker.data.name = document.getElementById('markerName').value;
        marker.data.datetime = document.getElementById('markerDate').value;

        fetch("/api/markers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lat: marker.getLatLng().lat,
                lng: marker.getLatLng().lng,
                name: marker.data.name,
                taken_at: marker.data.datetime,
                photo_path: ""
            })
        })
        .then(res => res.json())
        .then(resData => {
            marker.dbId = resData.id;
            console.log("DB保存完了 | ID:", resData.id);
        });

        panel.hide();
    };

    // 削除処理
    deleteBtn.onclick = () => {
        if (mode !== "register") return; // 登録モード以外では無効
        if (marker.dbId) {
            fetch(`/api/markers/${marker.dbId}`, { method: "DELETE" })
                .then(res => res.json())
                .then(() => {
                    map.removeLayer(marker);
                    allMarkers = allMarkers.filter(m => m !== marker);
                    panel.hide();
                });
        } else {
            map.removeLayer(marker);
            allMarkers = allMarkers.filter(m => m !== marker);
            panel.hide();
        }
    };

    panel.show();
}

// =========================
// マップクリック時処理
// =========================
map.on("click", (e) => {
    if (mode === "normal") {
        routeStart = e.latlng;
        alert(`スタート地点を設定しました（${routeStart.lat.toFixed(5)}, ${routeStart.lng.toFixed(5)}）`);
        return;
    }

    if (mode === "register") {
        const { lat, lng } = e.latlng;
        const marker = addMarker(lat, lng);
        openPanel(marker);
        return;
    }

    // 選択モード/その他は何もしない
});

// =========================
// マーカー選択切替関数
// =========================
function handleMarkerClick(marker) {
    if (mode === "select") {
        marker.isSelected = !marker.isSelected;
        marker.setIcon(marker.isSelected ? selectedIcon : normalIcon);
        return;
    }

    // 登録モードや通常モードではパネル開く
    openPanel(marker);
}

// =========================
// DB からマーカー読込
// =========================
fetch("/api/markers")
    .then(res => res.json())
    .then(data => {
        data.forEach(m => {
            const marker = addMarker(m.lat, m.lng, { name: m.name, datetime: m.datetime, photo: m.photo_path });
            marker.dbId = m.id;
        });
    })
    .catch(err => console.error("マーカー読み込みエラー:", err));

// =========================
// ルート生成
// =========================
let polyline = null;
let arrowsLayer = L.layerGroup().addTo(map);
let highlightMarker = null;

// OSRMルート取得関数
async function fetchRouteByCoords(coordsStr) {
    const url = 'https://router.project-osrm.org/route/v1/driving/' + coordsStr + '?overview=full&geometries=geojson&steps=true';
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
}

// ルート描画メイン関数
async function drawRouting(markers) {
    if (markers.length < 2) {
        setStatus('編集ピンを2つ以上置いてください');
        return;
    }

    const coords = markers.map(m => {
        const p = m.getLatLng();
        return p.lng + ',' + p.lat;
    }).join(';');

    try {
        setStatus('ルート取得中...');
        const data = await fetchRouteByCoords(coords);
        if (!data.routes || data.routes.length === 0) {
            setStatus('ルートが見つかりません');
            return;
        }

        const route = data.routes[0];

        if (polyline) {
            map.removeLayer(polyline);
            polyline = null;
        }

        clearArrows();
        polyline = L.geoJSON(route.geometry, { style: { color: '#2b8cff', weight: 6, opacity: 0.9 } }).addTo(map);
        map.fitBounds(polyline.getBounds().pad(0.1));
        addArrowsToRoute(route.geometry, 10);
        showDirections(route);
        setStatus('ルート描画完了');

    } catch (e) {
        setStatus('OSRMエラー: ' + e.message);
        console.error(e);
    }
}

// =========================
// 矢印描画
// =========================
function clearArrows() { arrowsLayer.clearLayers(); }

function addArrowsToRoute(lineGeoJSON, interval_m = 10) {
    arrowsLayer.clearLayers();
    try {
        const turfCoords = lineGeoJSON.coordinates;
        const line = turf.lineString(turfCoords);
        const length_km = turf.length(line, { units: 'kilometers' });
        if (length_km <= 0) return;

        const step_km = interval_m / 1000;

        for (let dist = step_km; dist < length_km; dist += step_km) {
            const pt = turf.along(line, dist, { units: 'kilometers' });
            const ahead = turf.along(line, Math.min(dist + Math.min(0.0005, step_km), length_km), { units: 'kilometers' });
            let bearing = turf.bearing(pt, ahead);
            if (isNaN(bearing)) bearing = 0;

            const [lng, lat] = pt.geometry.coordinates;
            const s = 14; // アイコンサイズ
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24">
                <g transform="translate(12,12) rotate(${bearing}) translate(-12,-12)">
                    <path d="M12 2 L16 10 L12 8 L8 10 Z" fill="#0066cc" stroke="#003366" stroke-width="0.35"/>
                </g>
            </svg>`;

            const icon = L.divIcon({ html: svg, className: 'route-arrow-icon', iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
            const mk = L.marker([lat, lng], { icon: icon, interactive: false });
            arrowsLayer.addLayer(mk);
        }

    } catch (e) {
        console.error('addArrowsToRoute', e);
    }
}

// =========================
// ルート案内パネル
// =========================
const directionsPanel = new bootstrap.Offcanvas(document.getElementById('directionsPanel'), { backdrop: false, scroll: true });

// ステップを地図でハイライト
function highlightStepOnMap(step) {
    if (highlightMarker) { map.removeLayer(highlightMarker); highlightMarker = null; }

    if (step.maneuver && step.maneuver.location) {
        const [lng, lat] = step.maneuver.location;
        highlightMarker = L.circleMarker([lat, lng], { radius: 8, color: '#ff6600', weight: 2, fillOpacity: 0.9 }).addTo(map);
        map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 0.5, easeLinearity: 0.25 });

        if (highlightTimeout) { clearTimeout(highlightTimeout); highlightTimeout = null; }

        highlightTimeout = setTimeout(() => {
            if (highlightMarker) { map.removeLayer(highlightMarker); highlightMarker = null; highlightTimeout = null; }
        }, 5000);
    }
}

// ステップ表示用の関数
function formatStepInstruction(step) {
    const m = step.maneuver || {};
    const type = m.type || '';
    const mod = m.modifier || '';
    const road = step.name || '';
    const dist_m = Math.round(step.distance || 0);

    let action = '';
    if (type === 'depart') action = '出発';
    else if (type === 'arrive') action = '到着';
    else if (type === 'turn') {
        if (mod === 'left') action = '左折';
        else if (mod === 'right') action = '右折';
        else action = '方向転換';
    } else if (type === 'roundabout') action = 'ラウンドアバウト';
    else if (type === 'merge') action = '合流';
    else if (type === 'continue') action = '直進';
    else action = type || '進む';

    let s = action;
    if (road) s += ' → ' + road;
    s += `（約 ${dist_m} m）`;
    return s;
}

// Offcanvas にルート情報を表示
function showDirections(route) {
    const summary = document.getElementById('dir-summary');
    summary.innerHTML = `距離: ${(route.distance / 1000).toFixed(2)} km / 時間: ${Math.round(route.duration / 60)} 分`;

    const stepsEl = document.getElementById('dir-steps');
    stepsEl.innerHTML = '';

    let stepIndex = 0;
    (route.legs || []).forEach((leg, li) => {
        const liHeader = document.createElement('li');
        liHeader.className = 'list-group-item list-group-item-secondary';
        liHeader.textContent = `区間 ${li + 1} — ${(leg.distance / 1000).toFixed(2)} km / 約 ${Math.round(leg.duration / 60)} 分`;
        stepsEl.appendChild(liHeader);

        (leg.steps || []).forEach((step, si) => {
            stepIndex++;
            const liStep = document.createElement('li');
            liStep.className = 'list-group-item list-group-item-action';
            liStep.innerHTML = `<strong>${stepIndex}. ${formatStepInstruction(step)}</strong><br>
                操作: ${step.maneuver?.type || '-'} ${step.maneuver?.modifier || ''} 
                （位置: ${step.maneuver?.location ? step.maneuver.location[1].toFixed(6) + ', ' + step.maneuver.location[0].toFixed(6) : '不明'}）`;

            liStep.addEventListener('click', () => highlightStepOnMap(step));
            stepsEl.appendChild(liStep);
        });
    });

    directionsPanel.show();
}

// =========================
// ルート生成ボタン
// =========================
document.getElementById("routeGenerationBtn").addEventListener("click", () => {
    const selected = allMarkers.filter(m => m.isSelected);
    if (selected.length < 2) {
        alert("ルートを作成するには、2つ以上のマーカーを選択してください。");
        return;
    }
    drawRouting(selected);
});

// =========================
// ステータス表示
// =========================
function setStatus(msg) {
    const el = document.getElementById('routeStatus');
    if (!el) return;

    el.textContent = msg;
    el.style.display = "block";
    el.style.opacity = 1;

    setTimeout(() => {
        el.style.transition = "opacity 0.5s";
        el.style.opacity = 0;

        setTimeout(() => { el.style.display = "none"; }, 500);
    }, 3000);
}
