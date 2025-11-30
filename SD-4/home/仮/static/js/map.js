// Leaflet 初期化
const map = L.map('map', {
  zoomControl: false
}).setView([35.394789, 139.465846], 13);

// OSM タイル
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// 現在地取得して初期位置に設定
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

// 住所検索（Enter だけで発動）
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

// OSRM ルート描画
async function drawRoute(start, end) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes[0].geometry;

  L.geoJSON(route, {
    style: {
      color: 'blue',
      weight: 4
    }
  }).addTo(map);
}

// ======== ピン登録モード ========
let mode = "normal";  // "normal" | "register" | "select"
let selectedMarkers = [];
const modeBtn = document.getElementById("modeToggleBtn");

function updateModeButton() {
  if (mode === "normal") {
    modeBtn.classList.remove("btn-danger", "btn-warning");
    modeBtn.classList.add("btn-primary");
    modeBtn.innerText = "🔵 通常モード";
  }
  else if (mode === "register") {
    modeBtn.classList.remove("btn-primary", "btn-warning");
    modeBtn.classList.add("btn-danger");
    modeBtn.innerText = "📍 ピン登録モード：ON";
  }
  else if (mode === "select") {
    modeBtn.classList.remove("btn-primary", "btn-danger");
    modeBtn.classList.add("btn-warning");
    modeBtn.innerText = "🟡 選択モード";
  }
}

modeBtn.addEventListener("click", () => {
  if (mode === "normal") {
    mode = "register";
  } else if (mode === "register") {
    mode = "select";
  } else {
    mode = "normal";  // select → normal に戻る
  }
  updateModeButton();
});

// 初期表示
updateModeButton();
//選択モードアイコン
// 通常（青）
const normalIcon = L.ExtraMarkers.icon({
  icon: "fa-number",
  number: "",
  markerColor: "blue",
  shape: "circle",
  prefix: "fa"
});

// 選択中（赤）
const selectedIcon = L.ExtraMarkers.icon({
  icon: "fa-check",
  markerColor: "red",
  shape: "circle",
  prefix: "fa"
});
// ========== マーカー追加 ==========
function addMarker(lat, lng, data = { name: "", datetime: "", photo: "" }) {
  const marker = L.marker([lat, lng], { icon: normalIcon }).addTo(map);
  marker.data = data;

  marker.isSelected = false;

  marker.on("click", () => handleMarkerClick(marker));

  return marker;
}

// ========== パネル表示 ==========
const panel = new bootstrap.Offcanvas('#markerDetailPanel');

function openPanel(marker) {
  // マーカー情報をフォームにセット
  document.getElementById('markerName').value = marker.data.name || "";
  document.getElementById('markerDate').value = marker.data.datetime || "";
  document.getElementById('markerPhoto').value = ""; // 表示不可

  const inputs = document.querySelectorAll("#markerDetailPanel input");
  const saveBtn = document.querySelector("#markerDetailPanel button[type='submit']");
  const deleteBtn = document.getElementById("deleteBtn");

  // ===== モードに応じた入力制御 =====
  if (mode === "normal") {
    inputs.forEach(i => i.disabled = true);
    saveBtn.style.display = "none";
    deleteBtn.style.display = "none";
  }

  else if (mode === "register") {
    inputs.forEach(i => i.disabled = false);
    saveBtn.style.display = "block";
    deleteBtn.style.display = "block";  // ← 登録モードだけ削除ボタンも表示
  }

  else if (mode === "select") {
    inputs.forEach(i => i.disabled = true);
    saveBtn.style.display = "none";
    deleteBtn.style.display = "none";  // ← 非表示に変更
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
        taken_at: marker.data.taken_at,
        photo_path: ""
      })
    })
      .then(res => res.json())
      .then(resData => {
        marker.dbId = resData.id;   // ← DBのID
        console.log("DB保存完了 | ID:", resData.id);
      });
      
    panel.hide();
  };
  // 削除処理
  deleteBtn.onclick = () => {

  if (marker.dbId) {
    // DB削除
    fetch(`/api/markers/${marker.dbId}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(result => {
        console.log("削除完了:", result);

        map.removeLayer(marker);  // ← 地図から削除
        panel.hide();             // ← パネル閉じる
      })
      .catch(err => {
        console.error("削除失敗:", err);
      });

  } else {
    // DB未登録のピン
    map.removeLayer(marker);
    panel.hide();
  }
};
  panel.show();
};

map.on("click", (e) => {
  if (mode !== "register") return;   // 登録モード以外はピンを置かない

  const { lat, lng } = e.latlng;

  // マーカー追加
  const marker = addMarker(lat, lng);

  // 追加したマーカーをすぐ編集
  openPanel(marker);
});

// マーカー選択切替関数
function handleMarkerClick(marker) {
  if (mode === "select") {  // 選択モード
    marker.isSelected = !marker.isSelected;
    if (marker.isSelected) {
      marker.setIcon(selectedIcon);
      selectedMarkers.push(marker); // 配列に追加
    } else {
      marker.setIcon(normalIcon);
      const idx = selectedMarkers.indexOf(marker);
      if (idx !== -1) selectedMarkers.splice(idx, 1);
    }
    return; // パネルは開かない
  }
  // 登録モードならパネルを開く
  if (mode === "register") openPanel(marker);
}
// ▼ DB からマーカー読込
fetch("/api/markers")
  .then(res => res.json())
  .then(data => {
    data.forEach(m => {
      const markerObj = addMarker(m.lat, m.lng, {
        name: m.name,
        datetime: m.datetime,
        photo: m.photo_path
      });
      markerObj.dbId = m.id;
    });
  })
  .catch(err => console.error("マーカー読み込みエラー:", err));