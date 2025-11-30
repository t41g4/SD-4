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
document.getElementById("addressInput").addEventListener("keydown", function(e) {
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
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  const route = data.routes[0].geometry;

  L.geoJSON(route, {
    style: { color: 'blue', weight: 4 }
  }).addTo(map);
}

// ======== ピン登録モード ========
let isRegisterMode = false;
const modeBtn = document.getElementById("modeToggleBtn");

modeBtn.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;

  if (isRegisterMode) {
    modeBtn.classList.replace("btn-primary", "btn-danger");
    modeBtn.innerText = "📍 ピン登録モード：ON";
  } else {
    modeBtn.classList.replace("btn-danger", "btn-primary");
    modeBtn.innerText = "📍 ピン登録モード：OFF";
  }
});

// ========== マーカー追加 ==========
function addMarker(lat, lng, data = { name: "", datetime: "", photo: "" }) {
  const marker = L.marker([lat, lng]).addTo(map);
  marker.data = data;

  marker.on("click", () => openPanel(marker));

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

  // ===== モードに応じた入力可否切替 =====
  if (isRegisterMode) {
    inputs.forEach(i => i.disabled = false);
    saveBtn.style.display = "block";//保存ボタン表示
    deleteBtn.style.display = "block";//削除ボタン表示
  } else {
    inputs.forEach(i => i.disabled = true);
    saveBtn.style.display = "none";//保存ボタン非表示
    deleteBtn.style.display = "none";//削除ボタン非表示
  }

  // 保存処理
  const form = document.getElementById("markerForm");
  form.onsubmit = (e) => {
    e.preventDefault();

    marker.data.name = document.getElementById('markerName').value;
    marker.data.datetime = document.getElementById('markerDate').value;

    console.log("保存:", marker.data);
    panel.hide();
  };

  panel.show();
  // 削除処理
  deleteBtn.onclick = () => {
    map.removeLayer(marker);
    panel.hide();
  };
};

// ========== 地図クリックでピン追加 ==========
map.on("click", (e) => {
  if (!isRegisterMode) return;

  const { lat, lng } = e.latlng;

  // マーカー追加
  const marker = addMarker(lat, lng);

  // 追加したマーカーを即編集
  openPanel(marker);
});



