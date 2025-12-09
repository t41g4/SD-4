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
let highlightTimeout = null

// カスタムアイコン定義
const normalIcon = L.ExtraMarkers.icon({
    icon: "fa-map-marker",
    markerColor: "blue",
    shape: "circle",
    prefix: "fa"
});

// マーカー追加関数
function addMarker(lat, lng, data = { name: "", datetime: "", photo: "" }) {// data: 任意の追加情報オブジェクト
    const marker = L.marker([lat, lng], { icon: normalIcon }).addTo(map); // マーカー作成・地図追加 icon: アイコン指定
    marker.data = data; // マーカーにデータを紐付け
    marker.on("click", () => handleMarkerClick(marker)); // クリック時処理登録
    allMarkers.push(marker); // 全マーカー配列に追加
    return marker;
}
let currentPanelMarker = null;
const panel = new bootstrap.Offcanvas(
    document.getElementById("markerDetailPanel")
);
// マーカー詳細パネル
function openPanel(marker) {
    document.getElementById('markerName').value = marker.data.name || ""; // マーカー名
    document.getElementById('markerDate').value = marker.data.datetime || ""; //撮影日時
    document.getElementById('markerPhoto').value = ""; //写真パス（未使用）

    currentPanelMarker = marker; // 現在のパネルマーカーを更新

    panel.show();
}
// マーカークリック処理
function handleMarkerClick(marker) { //クリックされた マーカーオブジェクト1個 が marker に入る マーカを押すたびにこの関数が動くようになっている
    openPanel(marker);
}

// DB からマーカー読込
fetch("/api/markers") //サーバーにアクセス
    .then(res => res.json())// レスポンスをJSONに変換
    .then(data => {
        data.forEach(m => { //一件ずつ追加
            const marker = addMarker(m.lat, m.lng, { name: m.name, datetime: m.datetime, photo: m.photo_path });
            marker.dbId = m.id;
        });
    })
    .catch(err => console.error("マーカー読み込みエラー:", err));