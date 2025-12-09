// Leaflet 初期化
// zoomControl: false でデフォルトのズームコントロール非表示
//setview 地図の 初期表示位置とズームレベルを設定 現在:神奈川県横浜〜藤沢あたり
const map = L.map('map', { zoomControl: false }).setView([35.394789, 139.465846], 13);

// OSM タイル 実際に地図の画像を読み込んで表示する処理
// maxZoom: 19 最大ズーム倍率を19まで許可
// .addTo(map) このタイル（地図）をmap に追加する
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// 現在地取得して初期位置に設定

if (navigator.geolocation) { // 位置情報が利用可能か確認
    navigator.geolocation.getCurrentPosition( // 現在地取得
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // 現在地へ視点移動 ズームレベルを 15 に設定
            map.setView([lat, lng], 15);

            // マーカー表示
            L.marker([lat, lng])
                .addTo(map)
                .bindPopup("現在地")// ポップアップ表示
                .openPopup();// ポップアップを自動で開く
        },
        (err) => {
            console.error("位置情報が許可されませんでした: ", err);
        }
    );
} else {
    alert("このブラウザでは位置情報が利用できません");
}

// 住所検索（Enter だけで発動）
//getElementById("addressInput") 住所入力欄を取得
//addEventListener("keydown", ...) キーが押された瞬間を検知
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addressInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") { // Enter キーが押された場合
            searchAddress(); // 住所検索関数を呼び出す
        }
    });
});

// 住所検索関数
function searchAddress() {
    const addr = document.getElementById("addressInput").value; // 入力された住所を取得
    if (!addr) return; // 空欄なら何もしない

    // Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`;
    //apiにfetchでリクエストを送信
    fetch(url, {
        headers: {
            "User-Agent": "MyMapApp/1.0 (contact@example.com)",
            "Referer": window.location.origin
        }
    })
        .then(response => response.json()) // レスポンスをJSONに変換
        .then(result => { // 結果処理
            if (result.length === 0) {
                alert("該当する住所が見つかりませんでした。");
                return;
            }
            //緯度経度を取得
            const lat = result[0].lat;
            const lon = result[0].lon;

            map.setView([lat, lon], 16);// 地図の中心を検索結果に移動、ズームレベル16
        })
        .catch(() => {
            alert("住所検索中にエラーが発生しました。");
        });
}

// マーカー管理
let allMarkers = [];
let mode = "normal"; // "normal" | "register" | "select"
let highlightTimeout = null;

// モード切替ボタン
function updateModeButton() {
    const modeBtn = document.getElementById("modeToggleBtn"); // モード切替ボタン
    const routeBtn = document.getElementById("routeGenerationBtn"); // ルート生成ボタン

    if (!modeBtn) return console.error("モードボタンが見つかりません"); // 安全確認

    // モードごとのボタン表示
    if (mode === "normal") { // 通常モード
        modeBtn.className = "btn btn-primary mode-btn";
        modeBtn.innerText = "🔵 通常モード";
        if (routeBtn) routeBtn.style.display = "inline-block"; // 表示
    } else if (mode === "register") { // 登録モード
        modeBtn.className = "btn btn-danger mode-btn";
        modeBtn.innerText = "📍 登録モード";
        if (routeBtn) routeBtn.style.display = "none"; // 非表示
    } else if (mode === "select") { // 選択モード
        modeBtn.className = "btn btn-warning mode-btn";
        modeBtn.innerText = "🟡 選択モード";
        if (routeBtn) routeBtn.style.display = "none"; // 非表示
    }
}

// DOMContentLoaded HTMLがすべて読み込まれた瞬間に、中の処理を実行する
document.addEventListener("DOMContentLoaded", () => {
    // モードボタン初期化
    const modeBtn = document.getElementById("modeToggleBtn");// モード切替ボタンを取得
    if (modeBtn) { //ボタンが存在する場合のみ処理を実行 もし間違えてた時JavaScriptが 即クラッシュ するから
        modeBtn.addEventListener("click", () => { //クリックされた時
            if (mode === "normal") mode = "register"; // 通常→登録
            else if (mode === "register") mode = "select"; // 登録→選択
            else mode = "normal"; // 選択→通常
            updateModeButton(); // ボタン表示更新
        });
    }

    // マーカーパネル Offcanvas 初期化
    window.panel = new bootstrap.Offcanvas(document.getElementById('markerDetailPanel'));

    // 初回モードボタン表示
    updateModeButton();
});

// 選択モード用アイコン
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

// マーカー追加関数

let markerIdCounter = 0;

function addMarker(lat, lng, data = { name: "", datetime: "", photo: "" }) {// data: 任意の追加情報オブジェクト
    const marker = L.marker([lat, lng], { icon: normalIcon }).addTo(map); // マーカー作成・地図追加 icon: アイコン指定
    marker.data = data; // マーカーにデータを紐付け
    marker.dbId = data.id || `tmp_${markerIdCounter++}`; // 一時ID設定
    marker.on("click", () => handleMarkerClick(marker)); // クリック時処理登録
    allMarkers.push(marker); // 全マーカー配列に追加
    return marker;
}

// マーカー詳細パネル
function openPanel(marker) {
    document.getElementById('markerName').value = marker.data.name || ""; // マーカー名
    document.getElementById('markerDate').value = marker.data.datetime || ""; //撮影日時
    document.getElementById('markerPhoto').value = ""; //写真パス（未使用）

    const inputs = document.querySelectorAll("#markerDetailPanel input"); // 入力欄群
    const saveBtn = document.querySelector("#markerDetailPanel button[type='submit']"); // 保存ボタン
    const deleteBtn = document.getElementById("deleteBtn"); // 削除ボタン
    const setStartBtn = document.getElementById("setStartBtn"); // スタート設定ボタン
    const setGoalBtn = document.getElementById("setGoalBtn"); // ゴール設定ボタン
    // モードに応じた入力制御 
    if (mode === "normal" || mode === "select") {
        inputs.forEach(i => i.disabled = true);
        saveBtn.style.display = "none"; // 非表示
        deleteBtn.style.display = "none";
        setStartBtn.style.display = "inline-block"; //表示
        setGoalBtn.style.display = "inline-block";
    } else if (mode === "register") {
        inputs.forEach(i => i.disabled = false);
        saveBtn.style.display = "block";
        deleteBtn.style.display = "block";
        setStartBtn.style.display = "none";
        setGoalBtn.style.display = "none";
    }

    // 保存処理
    const form = document.getElementById("markerForm");
    form.onsubmit = (e) => { // フォーム送信時
        e.preventDefault(); //ページ遷移を防止（SPA処理の基本）
        marker.data.name = document.getElementById('markerName').value; // マーカー名取得
        marker.data.datetime = document.getElementById('markerDate').value; // 撮影日時取得

        // DB保存処理
        fetch("/api/markers", {
            method: "POST", // POSTメソッドで送信
            headers: { "Content-Type": "application/json" }, // JSON形式で送信
            body: JSON.stringify({
                lat: marker.getLatLng().lat, // 緯度
                lng: marker.getLatLng().lng, // 経度
                name: marker.data.name, // マーカー名
                taken_at: marker.data.datetime, // 撮影日時
                photo_path: "" // 写真パス（未使用）
            })
        })
            .then(res => res.json()) // レスポンスをJSONに変換
            .then(resData => {
                marker.dbId = resData.id; // DBから返されたIDをマーカーに保存
                console.log("DB保存完了 | ID:", resData.id);
            });

        panel.hide();
    };

    // 削除処理
    deleteBtn.onclick = () => {
        if (mode !== "register") return; // 登録モード以外では削除禁止
        if (marker.dbId) { // DBに保存されている場合は削除API呼び出し
            fetch(`/api/markers/${marker.dbId}`, { method: "DELETE" }) // DELETEメソッドで送信
                .then(res => res.json())
                .then(() => { //地図&配列から削除
                    map.removeLayer(marker);
                    allMarkers = allMarkers.filter(m => m !== marker);
                    panel.hide();
                });
        } else { //DB未保存の場合は単純に削除
            map.removeLayer(marker);
            allMarkers = allMarkers.filter(m => m !== marker);
            panel.hide();
        }
    };

    // スタート設定ボタン

    setStartBtn.onclick = () => {
        setStartMarker(marker.getLatLng());
        panel.hide();
    };
    //ゴール設定ボタン
    setGoalBtn.onclick = () => {
        setGoalMarker(marker.getLatLng());
        panel.hide();
    };

    currentPanelMarker = marker; // 現在のパネルマーカーを更新

    panel.show();
}

// マップクリック時処理（スタート→ゴール自動モード、ループ）

let selectingGoal = false; // ゴール設定モードフラグ

map.on("click", (e) => { //地図クリックイベント
    const latlng = e.latlng; // クリック位置の緯度経度取得

    // 登録モード：マーカー追加
    if (mode === "register") {
        const marker = addMarker(latlng.lat, latlng.lng); // マーカー追加
        openPanel(marker);
        return;
    }

    // 通常モード：スタート→ゴール設定
    if (mode === "normal") {
        if (!routeStart || (!routeGoal && !selectingGoal)) { //スタートが決まっていない、またはゴールが決まっていないがゴール設定モードではない場合
            setStartMarker(latlng);
            setStatus("スタート地点を設定しました");
            selectingGoal = true; // 次のクリックはゴール設定
            return;
        }

        if (selectingGoal) {
            // ゴール設定モード
            setGoalMarker(latlng);
            setStatus("ゴール地点を設定しました");
            selectingGoal = false; // ゴール設定完了
            return;
        }

        // 両方設定済み → スタートに置き換え、ゴール設定モードへ
        setStartMarker(latlng);
        if (goalMarker) {
            map.removeLayer(goalMarker);// 既存ゴールマーカー削除
            goalMarker = null;
            routeGoal = null;
        }
        setStatus("スタート地点を再設定しました。次にゴールを設定してください");
        selectingGoal = true; // ゴール設定モードへ
    }

    // 選択モード/その他は何もしない
});

// マーカー選択切替関数

let selectedMarkers = [];
let selectedPanel;
document.addEventListener("DOMContentLoaded", () => {
    const panelEl = document.getElementById('selectedMarkersPanel');
    if (panelEl) selectedPanel = new bootstrap.Offcanvas(panelEl, { backdrop: false, scroll: true });

});

function handleMarkerClick(marker) {
    if (mode === "select") {
        marker.isSelected = !marker.isSelected; // フラグで管理
        if (marker.isSelected && !selectedMarkers.includes(marker)) selectedMarkers.push(marker);
        else if (!marker.isSelected) selectedMarkers = selectedMarkers.filter(m => m !== marker);
        updateSelectedMarkersPanel();
        if (selectedMarkers.length > 0) selectedPanel.show();
        return;
    }
    openPanel(marker);
}

// DB からマーカー読込

fetch("/api/markers") //サーバーにアクセス
    .then(res => res.json())// レスポンスをJSONに変換
    .then(data => {
        data.forEach(m => { //一件ずつ追加
            const marker = addMarker(m.lat, m.lng, { name: m.name, datetime: m.taken_at, photo: m.photo_path });
            marker.dbId = m.id;
        });
    })
    .catch(err => console.error("マーカー読み込みエラー:", err));

// ルート生成

let polyline = null; //OSRMから取得した道は、最終的にこれで描くなぜ null から始める？まだルートが存在しないから あとで削除処理ができるようにするため
let arrowsLayer = L.layerGroup().addTo(map);//矢印用のレイヤーグループ
let highlightMarker = null; // ステップハイライト用マーカー

// OSRMルート取得関数
async function fetchRouteByCoords(coordsStr) { // coordsStr: "lng,lat;lng,lat;..."
    const url = 'https://router.project-osrm.org/route/v1/driving/' + coordsStr + '?overview=full&geometries=geojson&steps=true';
    const res = await fetch(url); //OSRMサーバーに 非同期通信でリクエスト送信
    if (!res.ok) throw new Error('HTTP ' + res.status); //エラーチェック
    return await res.json(); //レスポンスをJSONで返す
}

// ルート描画メイン関数（スタート＋選択マーカー＋ゴール）

async function drawRouting(selectedMarkers) {
    if (!routeStart || !routeGoal) {
        alert("スタートとゴールを設定してください"); // 両方設定されていない場合強制終了
        return;
    }

    if (selectedMarkers.length === 0) {
        alert("ルートに含めるマーカーを選択してください"); // 選択マーカーが0個の場合強制終了
        return;
    }

    // スタート + 選択マーカー + ゴールの座標列を1つの文字列にまとめる
    const waypoints = [routeStart, ...selectedMarkers.map(m => m.getLatLng()), routeGoal];
    //OSRM用の座標文字列を作成
    const coordsStr = waypoints.map(p => `${p.lng},${p.lat}`).join(';');

    try {
        setStatus('ルート取得中...');
        const data = await fetchRouteByCoords(coordsStr);//OSRMにルート取得リクエスト

        if (!data.routes || data.routes.length === 0) {
            setStatus('ルートが見つかりません'); // ルートが見つからなかった場合
            return;
        }

        const route = data.routes[0];

        // 既存のルートがあれば削除
        if (polyline) {
            map.removeLayer(polyline);
            polyline = null;
        }
        clearArrows();

        // 新ルート描画
        polyline = L.geoJSON(route.geometry, {
            style: { color: '#2b8cff', weight: 6, opacity: 0.9 }
        }).addTo(map);

        // 地図範囲調整
        map.fitBounds(polyline.getBounds().pad(0.1));

        // 矢印描画
        addArrowsToRoute(route.geometry, 10);

        // ルート案内表示
        showDirections(route);

        setStatus('ルート描画完了');
    } catch (e) {
        console.error(e);
        setStatus('OSRMエラー: ' + e.message);
    }
}

// 矢印描画

function clearArrows() { arrowsLayer.clearLayers(); } // 矢印クリア関数

function addArrowsToRoute(lineGeoJSON, interval_m = 10) { //矢印をルート状に並べる
    arrowsLayer.clearLayers(); // 既存矢印クリア
    try {
        const turfCoords = lineGeoJSON.coordinates; // GeoJSON の座標配列を取得
        const line = turf.lineString(turfCoords); //Turfで距離・角度計算ができる形に変換
        const length_km = turf.length(line, { units: 'kilometers' }); // 総距離をkm単位で取得
        if (length_km <= 0) return; // 長さ0以下なら何もしない

        const step_km = interval_m / 1000; // 間隔をkm単位に変換

        for (let dist = step_km; dist < length_km; dist += step_km) { //distルートのどの位置か += step_kmで間隔指定
            const pt = turf.along(line, dist, { units: 'kilometers' }); //矢印を置く位置
            const ahead = turf.along(line, Math.min(dist + Math.min(0.0005, step_km), length_km), { units: 'kilometers' }); //少し先の位置（角度計算用）
            let bearing = turf.bearing(pt, ahead); // 進行方向の角度計算
            if (isNaN(bearing)) bearing = 0; // NaN対策

            const [lng, lat] = pt.geometry.coordinates; // 緯度経度取得
            const s = 14; // アイコンサイズ
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24"> 
                <g transform="translate(12,12) rotate(${bearing}) translate(-12,-12)">
                    <path d="M12 2 L16 10 L12 8 L8 10 Z" fill="#0066cc" stroke="#003366" stroke-width="0.35"/>
                </g>
            </svg>`; // SVG矢印アイコン
            //Leaflet のカスタムアイコンに変換
            const icon = L.divIcon({ html: svg, className: 'route-arrow-icon', iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
            const mk = L.marker([lat, lng], { icon: icon, interactive: false });
            arrowsLayer.addLayer(mk); // 地図に矢印マーカーを追加
        }

    } catch (e) {
        console.error('addArrowsToRoute', e);
    }
}

// ルート案内パネル

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

// ルート生成ボタン

let routingMode = "optimized"; // ルート方式 初期値は最短

document.addEventListener("DOMContentLoaded", () => {
    const routeBtn = document.getElementById("routeGenerationBtn");
    routeBtn.addEventListener("click", () => {

        if (!selectedMarkers || selectedMarkers.length === 0) {
            alert("ルートに含めるマーカーを選択してください");
            return;
        }

        // routingMode が "manual" なら選択順ルート生成
        if (routingMode === "manual") {
            drawRouting(selectedMarkers); // 選択順ルート
        } 
        // 最短ルート
        else if (routingMode === "optimized") {
            drawOptimizedRoute(selectedMarkers); // 最短ルート
        }
    });
});

// ステータス表示

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

// スタート/ゴールマーカー管理

let startMarker = null;
let goalMarker = null;
let routeStart = null;
let routeGoal = null;

// アイコン
const startIcon = L.ExtraMarkers.icon({ icon: "fa-play", markerColor: "yellow", shape: "circle", prefix: "fa" });
const endIcon = L.ExtraMarkers.icon({ icon: "fa-flag-checkered", markerColor: "yellow", shape: "circle", prefix: "fa" });

// マーカー設置関数
function setStartMarker(latlng) {
    if (startMarker) map.removeLayer(startMarker);
    startMarker = L.marker(latlng, { icon: startIcon }).addTo(map);
    routeStart = latlng;
}

function setGoalMarker(latlng) {
    if (goalMarker) map.removeLayer(goalMarker);
    goalMarker = L.marker(latlng, { icon: endIcon }).addTo(map);
    routeGoal = latlng;
}

// 現在地ボタンからスタート設定
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("currentLocationStartBtn").addEventListener("click", () => {
        if (!navigator.geolocation) return alert("このブラウザでは位置情報が利用できません");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
                setStartMarker(latlng);
                map.setView(latlng, 15);
            },
            (err) => console.error("位置情報取得失敗:", err)
        );
    });
});
// マーカーパネルのボタンからスタート/ゴール設定

let currentPanelMarker = null; // パネルで表示中のマーカー

//ログアウト確認モーダル

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logoutYes").addEventListener("click", () => {
    window.location.href = "/logout";
  });
});

// ルート方式切替ボタン
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("routingModeToggleBtn").addEventListener("click", () => {
      routingMode = routingMode === "manual" ? "optimized" : "manual";
      document.getElementById("routingModeToggleBtn").textContent =
          `ルート方式：${routingMode === "manual" ? "選択順" : "最短"}`;
  });
});

// 最短ルート生成関数（スタート・ゴール固定）
async function drawOptimizedRoute(selectedMarkers) {
    if (!routeStart || !routeGoal) {
        alert("スタートとゴールを設定してください");
        return;
    }
    if (selectedMarkers.length === 0) {
        alert("ルートに含めるマーカーを選択してください");
        return;
    }

    try {
        setStatus("最短ルート計算中...");

        // スタート + 選択マーカー + ゴールの座標列
        const waypoints = [routeStart, ...selectedMarkers.map(m => m.getLatLng()), routeGoal];
        const coordsStr = waypoints.map(p => `${p.lng},${p.lat}`).join(";");

        // /trip API にリクエスト
        const url = `https://router.project-osrm.org/trip/v1/driving/${coordsStr}?source=first&destination=last&roundtrip=false&overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        if (!data.trips || data.trips.length === 0) {
            setStatus("ルートが見つかりません");
            return;
        }

        const trip = data.trips[0];

        // 既存ルート削除
        if (polyline) { map.removeLayer(polyline); polyline = null; }
        clearArrows();

        // OSRM の最短ルートを描画
        polyline = L.geoJSON(trip.geometry, {
            style: { color: '#2b8cff', weight: 6, opacity: 0.9 }
        }).addTo(map);

        // 地図の表示範囲を調整
        map.fitBounds(polyline.getBounds().pad(0.1));

        // 矢印描画
        addArrowsToRoute(trip.geometry, 10);

        // ルート案内表示
        showDirections(trip);

        setStatus("最短ルート描画完了");
    } catch (e) {
        console.error(e);
        setStatus("OSRM /trip エラー: " + e.message);
    }
}
// 選択マーカーリスト更新
function updateSelectedMarkersPanel() {
    const listEl = document.getElementById('selectedMarkersList');
    listEl.innerHTML = '';

    selectedMarkers.forEach((marker, index) => {
        marker.isSelected = true;
        marker.setIcon(L.ExtraMarkers.icon({
            icon: 'fa-number',
            number: String(index + 1),
            markerColor: 'red',
            shape: 'circle',
            prefix: 'fa'
        }));

        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <span><strong>${index + 1}.</strong> ${marker.data.name || 'マーカー'}</span>
            <span>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="moveMarkerUp(${index})">⬆︎</button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="moveMarkerDown(${index})">⬇︎</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deselectMarker(${index})">✕</button>
            </span>
        `;

        listEl.appendChild(li);
    });

    // 選択配列に含まれないマーカーは青に戻す
    allMarkers.forEach(marker => {
        if (!selectedMarkers.includes(marker)) {
            marker.isSelected = false;
            marker.setIcon(normalIcon);
        }
    });
}

//順序入れ替え関数
function moveMarkerUp(idx) {
    if (idx <= 0) return;
    [selectedMarkers[idx - 1], selectedMarkers[idx]] = [selectedMarkers[idx], selectedMarkers[idx - 1]];
    updateSelectedMarkersPanel();
}

function moveMarkerDown(idx) {
    if (idx >= selectedMarkers.length - 1) return;
    [selectedMarkers[idx + 1], selectedMarkers[idx]] = [selectedMarkers[idx], selectedMarkers[idx + 1]];
    updateSelectedMarkersPanel();
}

// 選択解除
function deselectMarker(idx) {
    const marker = selectedMarkers[idx];
    marker.isSelected = false;          // 選択状態フラグを解除
    marker.setIcon(normalIcon);         // アイコンを青に戻す
    selectedMarkers.splice(idx, 1);
    updateSelectedMarkersPanel();
}
// 仮のペットボトル飲料データ（全10件）
const products = [
  {
    name: "アクアウォーター",
    img: "https://via.placeholder.com/40?text=AQ"
  },
  {
    name: "アクアウォーター ライト",
    img: "https://via.placeholder.com/40?text=AQL"
  },
  {
    name: "アクアウォーター スパークリング",
    img: "https://via.placeholder.com/40?text=AQS"
  },
  {
    name: "アクアウォーター レモン",
    img: "https://via.placeholder.com/40?text=AQLm"
  },
  {
    name: "アクアウォーター マイルド",
    img: "https://via.placeholder.com/40?text=AQM"
  },

  { name: "ポカリスエット 500ml", img: "https://via.placeholder.com/40" },
  { name: "ポカリスエット イオンウォーター 500ml", img: "https://via.placeholder.com/40" },

  { name: "コカ・コーラ 500ml", img: "https://via.placeholder.com/40" },
  { name: "コカ・コーラ ゼロ 500ml", img: "https://via.placeholder.com/40" },

  { name: "いろはす 天然水 555ml", img: "https://via.placeholder.com/40" },
  { name: "いろはす 白桃 555ml", img: "https://via.placeholder.com/40" },

  { name: "綾鷹 緑茶 525ml", img: "https://via.placeholder.com/40" }
];

// DOM
const searchInput = document.getElementById("productSearch");
const searchResults = document.getElementById("searchResults");

// 入力で候補を表示
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim();
  searchResults.innerHTML = "";

  if (keyword === "") {
    searchResults.style.display = "none";
    return;
  }

  const filtered = products.filter(p => p.name.includes(keyword));

  if (filtered.length === 0) {
    searchResults.style.display = "none";
    return;
  }

  filtered.forEach(p => {
    const item = document.createElement("button");
    item.classList.add(
      "list-group-item",
      "list-group-item-action",
      "d-flex",
      "align-items-center",
      "gap-2"
    );

    item.innerHTML = `
      <img src="${p.img}" width="40" height="40" class="rounded">
      <span>${p.name}</span>
    `;

    item.addEventListener("click", () => {
      searchInput.value = p.name;
      searchResults.style.display = "none";
    });

    searchResults.appendChild(item);
  });

  searchResults.style.display = "block";
});

// 商品以外の場所クリックで閉じる
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target)) {
    searchResults.style.display = "none";
  }
});
