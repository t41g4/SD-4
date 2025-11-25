<?php
session_start();

// フォームから送信された値を受け取る
$login_id = $_POST['login_id'] ?? '';
$password = $_POST['password'] ?? '';

// 空チェック（未入力対策）
if ($login_id === '' || $password === '') {
    header("Location: login.html?error=1");
    exit();
}

try {
    // DB接続設定
    $dsn = 'mysql:host=localhost;dbname=your_db_name;charset=utf8';
    $db_user = 'root'; // XAMPPのデフォルト
    $db_pass = '';     // XAMPPは空

    // PDOで接続
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // login_id に一致するユーザーを検索
    $sql = "SELECT * FROM users WHERE login_id = :login_id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':login_id', $login_id, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // ユーザーが存在しない
    if (!$user) {
        header("Location: login.html?error=1");
        exit();
    }

    // パスワード照合（bcrypt）
    if (!password_verify($password, $user['password_hash'])) {
        header("Location: login.html?error=1");
        exit();
    }

    // ✅ ログイン成功！
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['login_id'] = $user['login_id'];

    // ホーム画面へ
    header("Location: home.php");
    exit();

} catch (PDOException $e) {
    echo "Database error: " . htmlspecialchars($e->getMessage());
    exit();
}
