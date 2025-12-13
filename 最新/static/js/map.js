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
    const addr = document.getElementById("addressInput").value;
    if (!addr) return;

    // 自分のサーバーを経由するURL
    const url = `/api/search_address?q=${encodeURIComponent(addr)}`;

    fetch(url) // ヘッダー指定は不要
        .then(response => response.json())
        .then(result => {
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
    window.regPanel = new bootstrap.Offcanvas(document.getElementById('markerDetailPanel')); // 登録用
    window.viewPanel = new bootstrap.Offcanvas(document.getElementById('markerViewPanel'));   // 閲覧用
    window.restockModal = new bootstrap.Modal(document.getElementById('restockModal')); // 在庫補充モーダル
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

// ■ パネルを開く関数
function openPanel(marker) {
    // 【重要】現在操作中のマーカーをグローバル変数にセット（在庫補充などで使うため）
    currentPanelMarker = marker;

    // 日付整形（共通処理）
    // dateStr という変数に格納して、後で使い回せるようにします
    let dateObj;
    if (marker.data.datetime) {
        dateObj = new Date(marker.data.datetime);
    } else {
        dateObj = new Date();
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}/${month}/${day}`; // ★ここで変数 dateStr を定義

    // ==========================================
    // モードによる分岐
    // ==========================================

    if (mode === "register") {
        // --------------------------------------
        // 登録モード：既存の markerDetailPanel (登録用) を使用
        // --------------------------------------
        document.getElementById('markerName').value = marker.data.name || "";
        document.getElementById('markerDate').value = dateStr; // 定義した dateStr を使用
        document.getElementById('markerPhoto').value = "";

        // ■ 追加: 編集モード判定（一時IDでなければ編集）
        const isEdit = marker.dbId && !String(marker.dbId).startsWith("tmp_");
        // ■ 追加: ボタンのテキスト切り替え
        const saveBtn = document.getElementById("regSaveBtn"); // HTMLでIDを追加しておくこと
        if (saveBtn) saveBtn.innerText = isEdit ? "更新" : "保存";

        // ■ 追加: 写真プレビュー表示
        const regImgEl = document.getElementById('regMarkerPhotoPreview');
        const regNoPhotoEl = document.getElementById('regNoPhotoText');

        if (regImgEl && regNoPhotoEl) {
            if (marker.data.photo) {
                regImgEl.src = marker.data.photo;
                regImgEl.style.display = "block";
                regNoPhotoEl.style.display = "none";
            } else {
                regImgEl.style.display = "none";
                regNoPhotoEl.style.display = "block";
            }
        }
        // ■ 追加: 削除ボタンの表示制御
        const deleteBtn = document.getElementById("deleteBtn");

        // 保存処理
        const form = document.getElementById("markerForm");
        form.onsubmit = (e) => {
            e.preventDefault();
            marker.data.name = document.getElementById('markerName').value;
            // 日付はサーバー側で自動設定

            const formData = new FormData();
            // ■ 追加: 編集時はIDを送信する
            if (isEdit) {
                formData.append("id", marker.dbId);
            }

            formData.append("latitude", marker.getLatLng().lat);
            formData.append("longitude", marker.getLatLng().lng);
            formData.append("name", marker.data.name);

            const fileInput = document.getElementById('markerPhoto');
            if (fileInput.files[0]) {
                formData.append("photo", fileInput.files[0]);
            }

            fetch("/api/markers", { method: "POST", body: formData })
                .then(res => {
                    if (!res.ok) throw new Error("保存失敗");
                    return res.json();
                })
                .then(resData => {
                    marker.dbId = resData.id;
                    marker.data.datetime = new Date().toISOString();
                    // 写真パスが返ってきたら更新
                    if (resData.photo_path) marker.data.photo = resData.photo_path;

                    alert(isEdit ? "更新しました" : "登録しました");
                    if (window.regPanel) window.regPanel.hide();
                })
                .catch(err => {
                    console.error(err);
                    alert("保存エラー");
                });
        };

        // 削除処理
        deleteBtn.onclick = () => {
            if (!confirm("削除しますか？")) return;
            // DB保存済みならAPIを叩く
            if (marker.dbId && String(marker.dbId).indexOf('tmp_') === -1) {
                fetch(`/api/markers/${marker.dbId}`, { method: "DELETE" })
                    .then(res => res.json())
                    .then(() => {
                        map.removeLayer(marker);
                        allMarkers = allMarkers.filter(m => m !== marker);
                        if (window.regPanel) window.regPanel.hide();
                    });
            } else {
                // 未保存なら地図から消すだけ
                map.removeLayer(marker);
                allMarkers = allMarkers.filter(m => m !== marker);
                if (window.regPanel) window.regPanel.hide();
            }
        };

        if (window.regPanel) window.regPanel.show();

    } else {
        // --------------------------------------
        // 通常/選択モード：新しい markerViewPanel (閲覧用) を使用
        // --------------------------------------

        // 表示データのセット (IDに view がついていることに注意)
        document.getElementById('viewMarkerName').value = marker.data.name || "名称未設定";
        document.getElementById('viewMarkerDate').value = dateStr;

        // 写真表示
        const imgEl = document.getElementById('viewMarkerPhoto');
        const noPhotoEl = document.getElementById('noPhotoText');
        if (marker.data.photo) {
            imgEl.src = marker.data.photo;
            imgEl.style.display = "block";
            noPhotoEl.style.display = "none";
        } else {
            imgEl.style.display = "none";
            noPhotoEl.style.display = "block";
        }

        // スタート/ゴールボタンの設定
        const setStartBtn = document.getElementById("setStartBtn");
        const setGoalBtn = document.getElementById("setGoalBtn");

        if (setStartBtn) {
            setStartBtn.onclick = () => {
                setStartMarker(marker.getLatLng());
                if (window.viewPanel) window.viewPanel.hide();
                setStatus("スタート地点を設定しました");
            };
        }

        if (setGoalBtn) {
            setGoalBtn.onclick = () => {
                setGoalMarker(marker.getLatLng());
                if (window.viewPanel) window.viewPanel.hide();
                setStatus("ゴール地点を設定しました");
            };
        }
        // 在庫補充ボタンの設定
        const openRestockBtn = document.getElementById("openRestockModalBtn");
        if (openRestockBtn) {
            openRestockBtn.onclick = () => {
                openRestockModal(marker);
            };
        }

        // 在庫補充UIのリセット
        if (document.getElementById("productSearch")) document.getElementById("productSearch").value = "";
        if (document.getElementById("searchResults")) document.getElementById("searchResults").style.display = "none";
        if (document.getElementById("numPadDisplay")) document.getElementById("numPadDisplay").value = "";
        selectedProductId = null;
        currentQuantity = "";

        if (window.viewPanel) window.viewPanel.show();
    }
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
    .then(res => res.json())
    .then(data => {
        data.forEach(m => {
            // サーバーからのレスポンスが { latitude: 35.xxx, longitude: 139.xxx, ... } の場合
            // addMarkerの引数は (lat, lng, data) なので、ここでマッピングする
            const lat = m.latitude !== undefined ? m.latitude : m.lat;   // 両方対応できるようにチェック
            const lng = m.longitude !== undefined ? m.longitude : m.lng;

            const marker = addMarker(lat, lng, {
                name: m.name,
                datetime: m.taken_at,
                photo: m.photo_path
            });
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

// アイコン (S: Start, G: Goal)
const startIcon = L.ExtraMarkers.icon({
    icon: "fa-number",    // 文字モード
    number: "S",          // Sを表示
    markerColor: "yellow", // 色は黄色のまま
    shape: "circle",
    prefix: "fa"
});

const endIcon = L.ExtraMarkers.icon({
    icon: "fa-number",    // 文字モード
    number: "G",          // Gを表示
    markerColor: "yellow", // 色は黄色のまま
    shape: "circle",
    prefix: "fa"
});

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

        // スタート + 選択マーカー + ゴール のリスト
        const waypoints = [routeStart, ...selectedMarkers.map(m => m.getLatLng()), routeGoal];

        // 座標文字列作成
        const coordsStr = waypoints.map(p => `${p.lng},${p.lat}`).join(";");

        // ★追加：座標の数だけ "curb" をセミコロン区切りで並べる
        // 例: 4地点なら "curb;curb;curb;curb"
        // これにより「すべての地点で、道路の左側（歩道側）に停車する」よう強制
        const approachesStr = waypoints.map(() => "curb").join(";");

        // ★修正：URLに &approaches=${approachesStr} を追加
        const url = `https://router.project-osrm.org/trip/v1/driving/${coordsStr}?source=first&destination=last&roundtrip=false&overview=full&geometries=geojson&steps=true&approaches=${approachesStr}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        // （以下、変更なし）
        if (!data.trips || data.trips.length === 0) {
            setStatus("ルートが見つかりません");
            return;
        }

        const trip = data.trips[0];

        if (polyline) { map.removeLayer(polyline); polyline = null; }
        clearArrows();

        polyline = L.geoJSON(trip.geometry, {
            style: { color: '#2b8cff', weight: 6, opacity: 0.9 }
        }).addTo(map);

        map.fitBounds(polyline.getBounds().pad(0.1));
        addArrowsToRoute(trip.geometry, 10);
        showDirections(trip);

        setStatus("最短ルート描画完了");
    } catch (e) {
        console.error(e);
        setStatus("OSRMエラー: " + e.message);
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

// 在庫補充機能のためのグローバル変数と定数

let allProducts = [];         // サーバーまたは仮データから取得
let selectedProductId = null; // 選択された商品ID
let currentQuantity = "";     // 数量
let currentUserId = window.CURRENT_USER_ID;        // ★仮ユーザー（DBに存在する user_id に合わせる）
// demoユーザーなら 6 に変更してOK

let searchInput;
let searchResults;
let numPadDisplay;

// サーバーから商品データを取得する関数
async function loadProducts() {
    try {
        const res = await fetch("/api/products");
        const data = await res.json();
        allProducts = data.map(p => ({
            id: p.id,
            name: p.name,
            img: p.image_url
        }));

        console.log("商品ロード済:", allProducts);
    } catch (e) {
        console.error("商品読み込み失敗:", e);
    }
}

// アプリ起動時に商品データを読み込む
document.addEventListener("DOMContentLoaded", async () => {
    searchInput = document.getElementById("productSearch");
    searchResults = document.getElementById("searchResults");
    numPadDisplay = document.getElementById("numPadDisplay");

    await loadProducts();

    setupProductSearch();
    setupNumberPad();
    setupRestockButton();
});

// 商品検索機能セットアップ
function setupProductSearch() {
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.trim();
        searchResults.innerHTML = "";
        selectedProductId = null;

        if (keyword === "") {
            searchResults.style.display = "none";
            return;
        }

        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));

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
                selectedProductId = p.id;
                searchResults.style.display = "none";

                // 追加: 選択した商品を明示
                document.getElementById("selectedProductDisplay").innerHTML =
                    `選択中: <img src="${p.img}" width="20"> ${p.name}`;

                currentQuantity = "";
                numPadDisplay.value = "";
            });

            searchResults.appendChild(item);
        });

        searchResults.style.display = "block";
    });

    // 外側クリックで閉じる
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target)) {
            searchResults.style.display = "none";
        }
    });
}

// ルート保存処理
document.getElementById("saveRouteBtn").addEventListener("click", () => {
    if (!routeStart || !routeGoal || selectedMarkers.length === 0) {
        return alert("スタート・ゴール・マーカーが必要です");
    }

    const modal = new bootstrap.Modal(document.getElementById("routeNameModal"));
    modal.show();
});

// ルート名保存ボタン
document.getElementById("routeNameSaveBtn").addEventListener("click", async () => {
    const name = document.getElementById("routeNameInput").value.trim() || "無題ルート";

    const routeData = {
        name,
        start: routeStart,
        goal: routeGoal,
        markers: selectedMarkers.map((m, idx) => ({
            id: m.dbId,
            lat: m.getLatLng().lat,
            lng: m.getLatLng().lng,
            order: idx + 1
        })),
        mode: routingMode
    };

    try {
        const res = await fetch("/api/routes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(routeData)
        });
        const data = await res.json();
        alert("ルート保存完了: ID=" + data.id);
        bootstrap.Modal.getInstance(document.getElementById("routeNameModal")).hide();
    } catch (e) {
        console.error(e);
        alert("ルート保存失敗");
    }
});

document.getElementById("loadRouteBtn").addEventListener("click", async () => {
    const modal = new bootstrap.Modal(document.getElementById("routeListModal"));
    modal.show();

    try {
        const res = await fetch("/api/routes");
        const list = await res.json();

        const ul = document.getElementById("routeList");
        ul.innerHTML = "";

        list.forEach(route => {
            const li = document.createElement("li");
            li.className = "list-group-item list-group-item-action";
            li.textContent = `${route.name}（${route.mode}）`;

            li.addEventListener("click", () => {
                loadRoute(route.id);
                modal.hide();
            });

            ul.appendChild(li);
        });

    } catch (e) {
        console.error(e);
        alert("ルート一覧の取得に失敗");
    }
});
// ルート読込関数（修正版）
async function loadRoute(routeId) {
    try {
        const res = await fetch(`/api/routes/${routeId}`);
        const data = await res.json();

        if (data.error) {
            alert("ルートが見つかりません");
            return;
        }

        // 1. 既存ルート表示のリセット
        if (polyline) { map.removeLayer(polyline); polyline = null; }
        clearArrows();

        // 選択状態を一度すべてリセット（アイコンを青に戻す）
        selectedMarkers.forEach(m => {
            m.isSelected = false;
            m.setIcon(normalIcon);
        });
        selectedMarkers = []; // 配列を空にする

        // 2. スタート・ゴール設定
        // DBのカラム名が start_lat/start_lng なのか、lat/lng なのかAPIのレスポンスによりますが、
        // JS側で受け取ったオブジェクト構造に合わせて設定してください。
        // ここでは data.start.lat / data.start.lng がある前提です。
        if (data.start) setStartMarker(L.latLng(data.start.lat, data.start.lng));
        if (data.goal) setGoalMarker(L.latLng(data.goal.lat, data.goal.lng));

        routingMode = data.mode; // 保存されたルート方式を復元
        if (document.getElementById("routingModeToggleBtn")) {
            document.getElementById("routingModeToggleBtn").textContent =
                `ルート方式：${routingMode === "manual" ? "選択順" : "最短"}`;
        }

        // 3. マーカー復元（ここが修正ポイント：既存マーカーを探して再利用）
        if (data.markers && data.markers.length > 0) {
            data.markers
                .sort((a, b) => a.order - b.order) // 保存された順序（order_num）でソート
                .forEach((m) => {
                    // allMarkersの中から、IDが一致するものを探す
                    // ※型不一致(String vs Number)を防ぐため String() で比較
                    const existingMarker = allMarkers.find(am => String(am.dbId) === String(m.marker_id));

                    if (existingMarker) {
                        // 既存マーカーが見つかった場合
                        existingMarker.isSelected = true; // 選択フラグをON
                        selectedMarkers.push(existingMarker); // 選択リストに追加
                    } else {
                        // 万が一見つからない場合（ロード後に削除された等）
                        console.warn(`マーカーID ${m.marker_id} は現在の地図上に存在しません。`);
                    }
                });
        }

        // 4. パネルと地図の描画更新
        updateSelectedMarkersPanel(); // ここでアイコンが赤色(番号付き)に変わります

        // ルート再描画
        if (selectedMarkers.length > 0 && routeStart && routeGoal) {
            if (routingMode === "manual") {
                drawRouting(selectedMarkers);
            } else {
                drawOptimizedRoute(selectedMarkers);
            }
        }

    } catch (e) {
        console.error(e);
        alert("ルート読込失敗: " + e.message);
    }
}

// ----------------------------------------------------
// キーパッドロジックの追加
// ----------------------------------------------------
function setupNumberPad() {
    const keypad = document.querySelector("#numPadWrapper"); // wrapper をHTML側に作成しておく

    if (!keypad) return;

    keypad.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const value = btn.textContent.trim();

        if (/^[0-9]$/.test(value)) {
            if (currentQuantity === "0" && value === "0") return;
            currentQuantity += value;
        } else if (value === "C") {
            currentQuantity = "";
        }
        numPadDisplay.value = currentQuantity || "0";
    });
}
// 在庫補充データ保存
// ---------------------------------------------
async function saveRestockData() {
    
    if (!currentPanelMarker || !currentPanelMarker.dbId) return alert("マーカーエラー");
    if (!selectedProductId) return alert("商品を選択してください");
    const quantity = parseInt(currentQuantity);
    if (isNaN(quantity) || quantity <= 0) return alert("数量を入力してください");

    const payload = {
        user_id: currentUserId,
        marker_id: currentPanelMarker.dbId,
        product_id: selectedProductId,
        quantity: quantity
    };

    try {
        const res = await fetch("/api/restocks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("サーバーエラー");
        // 入力クリア
        currentQuantity = "";
        numPadDisplay.value = "";
        // 商品選択は残す？クリアする？ → 今回は残します（同じ商品を連続補充するケースもあるため）
        
        // 履歴を再読み込み
        loadMarkerRestockHistory(currentPanelMarker.dbId);
    } catch (e) {
        console.error("補充エラー:", e);
        alert("補充保存に失敗しました");
    }
}

// ---------------------------------------------
// 在庫補充ボタン
// ---------------------------------------------
function setupRestockButton() {
    const btn = document.getElementById("restockSubmitBtn"); // ★id を使うのが安全

    if (!btn) return;

    btn.addEventListener("click", () => {
        saveRestockData();
    });
}

// ■ 新しい関数: 在庫補充モーダルを開く
function openRestockModal(marker) {
    // タイトル設定
    document.getElementById("restockModalTitle").textContent = `在庫補充: ${marker.data.name || "名称未設定"}`;

    // 入力リセット
    document.getElementById("productSearch").value = "";
    document.getElementById("searchResults").style.display = "none";
    document.getElementById("numPadDisplay").value = "";
    document.getElementById("selectedProductDisplay").textContent = "";
    selectedProductId = null;
    currentQuantity = "";

    // 履歴読み込み
    loadMarkerRestockHistory(marker.dbId);

    // 詳細パネルを閉じてモーダルを開く
    if (window.viewPanel) window.viewPanel.hide();
    window.restockModal.show();
}

// map.js の末尾に追加・上書き

// ■ 特定マーカーの履歴を読み込む（5列版：担当＋削除）
async function loadMarkerRestockHistory(markerId) {
    const tbody = document.getElementById("restockHistoryTableBody");
    // 列数に合わせて colspan="5" に変更
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">読み込み中...</td></tr>';

    try {
        const res = await fetch("/api/restocks");
        if (!res.ok) throw new Error("履歴取得失敗");
        
        const allData = await res.json();
        const markerData = allData.filter(d => String(d.marker_id) === String(markerId));
        
        tbody.innerHTML = "";
        
        if (markerData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">履歴はありません</td></tr>';
            return;
        }

        markerData.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="d-flex align-items-center gap-2">
                    <img src="${item.image_url || ''}" width="30" height="30" class="rounded">
                    <span class="text-truncate" style="max-width: 120px;">${item.product_name}</span>
                </td>
                <td class="align-middle fw-bold">${item.quantity}</td>
                <td class="align-middle small">${item.date}</td>
                <td class="align-middle small">${item.user_name || '-'}</td>
                
                <td class="align-middle text-center">
                    <button class="btn btn-danger btn-sm px-2" onclick="deleteRestock(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">エラーが発生しました</td></tr>';
    }
}

// ■ 新しい関数: モーダル内からの削除処理
async function deleteRestock(restockId) {
    if (!confirm("この履歴を削除しますか？")) return;

    try {
        const res = await fetch(`/api/restocks/${restockId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            // 削除成功したら、現在のマーカーの履歴を再読み込みして表示を更新
            // currentPanelMarker は openPanel でセットされているグローバル変数
            if (currentPanelMarker) {
                loadMarkerRestockHistory(currentPanelMarker.dbId);
            }
        } else {
            alert("削除に失敗しました");
        }
    } catch (e) {
        console.error("削除エラー:", e);
        alert("サーバーエラーが発生しました");
    }
}