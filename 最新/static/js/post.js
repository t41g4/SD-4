document.addEventListener("DOMContentLoaded", () => {
    loadRestockHistory();
    setupExcelButton();
});

// 履歴データの読み込み
async function loadRestockHistory() {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = ""; // 一旦クリア

    try {
        const res = await fetch("/api/restocks");
        if (!res.ok) throw new Error("データの取得に失敗しました");
        
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">履歴がありません</td></tr>`;
            return;
        }

        data.forEach(item => {
            const tr = document.createElement("tr");
            
            // 画像パスの調整（null対策）
            const imgSrc = item.image_url ? item.image_url : "https://via.placeholder.com/50?text=NoImg";

            tr.innerHTML = `
                <td class="text-center"><img src="${imgSrc}" alt="${item.product_name}"></td>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.marker_name}</td>
                <td>${item.date}</td>
                <td>${item.user_name || '-'}</td>
                <td class="text-center">
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">
                        <i class="bi bi-trash"></i> 削除
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // 削除ボタンにイベントリスナーを一括登録
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", handleDelete);
        });

    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">エラーが発生しました</td></tr>`;
    }
}

// 削除処理
async function handleDelete(e) {
    const btn = e.currentTarget; // クリックされたボタン
    const id = btn.dataset.id;
    
    if (!confirm("本当にこの履歴を削除しますか？")) return;

    try {
        const res = await fetch(`/api/restocks/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            // 成功したら行を画面から消す（リロードしなくても良いように）
            btn.closest("tr").remove();
            alert("削除しました");
        } else {
            alert("削除に失敗しました");
        }
    } catch (error) {
        console.error("削除エラー:", error);
        alert("サーバーエラーが発生しました");
    }
}

// Excelダウンロード設定
function setupExcelButton() {
    const btn = document.querySelector(".excel-btn");
    if (btn) {
        btn.addEventListener("click", () => {
            // 1. フォームの値を収集
            const range = document.querySelector('input[name="dateRange"]:checked').value;
            const target = document.getElementById("targetUser").value;
            const product = document.getElementById("productFilter").value;

            // 2. クエリパラメータを作成
            const params = new URLSearchParams({
                range: range,
                target: target,
                product: product
            });

            // 3. パラメータ付きでExcelダウンロードURLへ遷移
            // 例: /download/excel?range=week&target=self&product=コーラ
            window.location.href = `/download/excel?${params.toString()}`;
        });
    }
}

// (オプション) 「この条件で一覧を絞り込み」ボタンの実装
document.getElementById("applyFilterBtn").addEventListener("click", () => {
    // API経由で再取得する処理などをここに書きます（今回はExcel出力がメインなので割愛）
    // loadRestockHistory() に引数を渡してAPIを叩き直すなどの実装になります
});