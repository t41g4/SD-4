-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost
-- 生成日時: 2025 年 12 月 12 日 22:32
-- サーバのバージョン： 10.4.28-MariaDB
-- PHP のバージョン: 8.1.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `sd-4`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `markers`
--

CREATE TABLE `markers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `taken_at` datetime DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `markers`
--

INSERT INTO `markers` (`id`, `user_id`, `name`, `latitude`, `longitude`, `taken_at`, `photo_path`, `created_at`) VALUES
(2, 5, '自販機1', 35.396320217291745, 139.46608453989032, NULL, '', '2025-12-01 17:45:10'),
(3, 5, '自販機２', 35.39602941986086, 139.46510285139084, NULL, '', '2025-12-01 18:14:42'),
(4, 5, '自販機3', 35.39689087687094, 139.46483194828036, NULL, '', '2025-12-01 18:54:27'),
(5, 5, '自販機4', 35.3977785615221, 139.46810960769656, NULL, '', '2025-12-01 19:39:04'),
(6, 5, '変更してみたよ', 35.39865311812369, 139.464408159256, '2025-12-13 04:18:56', '/static/uploads/LINE_ALBUM__251015_1.jpg', '2025-12-01 21:16:14'),
(8, 6, 'ローソン前', 35.397231958828975, 139.46268081665042, '2025-12-02 12:02:00', '', '2025-12-02 03:02:48'),
(12, 5, '渋谷原公園前', 35.39995618986267, 139.46381807327273, '2025-12-10 03:29:00', '/static/uploads/S__132800912.jpg', '2025-12-12 18:29:55');
(13, 0, '戸塚区自販機1', 35.39967633730531, 139.53404903411868, '2025-12-13 10:25:20', '', '2025-12-13 01:25:20'),
(14, 0, '戸塚区自販機2', 35.40065581700626, 139.5336735248566, '2025-12-13 10:25:35', '', '2025-12-13 01:25:35'),
(15, 0, '戸塚区自販機3', 35.4018014433432, 139.53352332115176, '2025-12-13 10:25:43', '', '2025-12-13 01:25:43'),
(16, 0, '戸塚区自販機4', 35.402719681706785, 139.53220367431643, '2025-12-13 10:25:54', '', '2025-12-13 01:25:54'),
(17, 0, '戸塚区自販機5', 35.40283336763369, 139.53190326690677, '2025-12-13 10:26:07', '', '2025-12-13 01:26:07'),
(18, 0, '戸塚区自販機6', 35.40311320923231, 139.5313882827759, '2025-12-13 10:26:17', '', '2025-12-13 01:26:17'),
(19, 0, '戸塚区自販機7', 35.40360292969235, 139.53148484230044, '2025-12-13 10:26:26', '', '2025-12-13 01:26:26'),
(20, 0, '文教1', 35.37113502280101, 139.40242767333987, '2025-12-13 10:30:07', '', '2025-12-13 01:30:02'),
(21, 0, '文教2', 35.374424392681384, 139.4044876098633, '2025-12-13 10:30:14', '', '2025-12-13 01:30:14'),
(22, 0, '文教3', 35.37799355726121, 139.40663337707522, '2025-12-13 10:30:21', '', '2025-12-13 01:30:21'),
(23, 0, '文教4', 35.38128264758105, 139.411096572876, '2025-12-13 10:30:28', '', '2025-12-13 01:30:28'),
(24, 0, '文教5', 35.384081767769786, 139.41633224487308, '2025-12-13 10:30:35', '', '2025-12-13 01:30:35'),
(25, 0, '文教6', 35.383451974194934, 139.42122459411624, '2025-12-13 10:30:49', '', '2025-12-13 01:30:49'),
(26, 0, '文教内メディア棟', 35.37064510517786, 139.4167211651802, '2025-12-13 10:31:56', '', '2025-12-13 01:31:56'),
(27, 0, '文教内厚生棟', 35.36974837325385, 139.41713690757754, '2025-12-13 10:32:19', '', '2025-12-13 01:32:19'),
(28, 0, '文教内1号館', 35.36979649082956, 139.41605329513553, '2025-12-13 10:34:18', '', '2025-12-13 01:32:31'),
(29, 0, '文教内2号館', 35.3700895699894, 139.41650122404099, '2025-12-13 10:34:12', '', '2025-12-13 01:32:45'),
(30, 0, '文教内学生食堂外', 35.370367338061605, 139.41645026206973, '2025-12-13 10:33:08', '', '2025-12-13 01:33:08'),
(31, 0, '文教内学生食堂中', 35.370459198158606, 139.41641807556155, '2025-12-13 10:33:22', '', '2025-12-13 01:33:22'),
(32, 0, '文教内3号館', 35.370846321704406, 139.41625177860263, '2025-12-13 10:34:05', '', '2025-12-13 01:33:34'),
(33, 0, '文教内図書館', 35.370387022376896, 139.4157126545906, '2025-12-13 10:33:47', '', '2025-12-13 01:33:47'),
(34, 0, '文教内4号館', 35.370817888964794, 139.4159379601479, '2025-12-13 10:33:59', '', '2025-12-13 01:33:59');

-- --------------------------------------------------------

--
-- テーブルの構造 `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `products`
--

INSERT INTO `products` (`id`, `name`, `image_url`) VALUES
(1, 'コーラ', '/images/coke.png'),
(2, '水', '/images/water.png'),
(3, 'ポカリ', '/images/pocari.png');

-- --------------------------------------------------------

--
-- テーブルの構造 `restocks`
--

CREATE TABLE `restocks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `marker_id` int(11) NOT NULL,
  `quantity` double NOT NULL,
  `restocked_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `restocks`
--

INSERT INTO `restocks` (`id`, `user_id`, `product_id`, `marker_id`, `quantity`, `restocked_at`) VALUES
(1, 5, 2, 3, 12, '2025-12-12 08:14:28');

-- --------------------------------------------------------

--
-- テーブルの構造 `routes`
--

CREATE TABLE `routes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_lat` double NOT NULL,
  `start_lng` double NOT NULL,
  `goal_lat` double NOT NULL,
  `goal_lng` double NOT NULL,
  `mode` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `routes`
--

INSERT INTO `routes` (`id`, `name`, `start_lat`, `start_lng`, `goal_lat`, `goal_lng`, `mode`, `created_at`) VALUES
(1, 'テスト1', 35.4017664626273, 139.4635605812073, 35.39559212851686, 139.46315288543704, 'optimized', '2025-12-10 14:19:20');

-- --------------------------------------------------------

--
-- テーブルの構造 `route_markers`
--

CREATE TABLE `route_markers` (
  `id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `marker_id` int(11) DEFAULT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `order_num` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `route_markers`
--

INSERT INTO `route_markers` (`id`, `route_id`, `marker_id`, `lat`, `lng`, `order_num`) VALUES
(1, 1, 6, 35.39865311812369, 139.464408159256, 1),
(2, 1, 8, 35.397231958828975, 139.46268081665042, 2);

-- --------------------------------------------------------

--
-- テーブルの構造 `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `login_id` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `users`
--

INSERT INTO `users` (`id`, `login_id`, `password_hash`, `created_at`) VALUES
(0, 'kanrisya', 'scrypt:32768:8:1$4PhMpqwPGFaulZHL$a85f52219fc3e328d55024e5d7637c9fb107a42abb7266f963a69234029a8682201fcbeb4e18634e7464d51785a2b6a246bf54942df7b607a4a46207a0e25bc2', '2025-12-09 05:32:28'),
(5, 'c4p31048', 'scrypt:32768:8:1$lDaNhSQYhO1mWFaX$68fa20435a1b761801e22d8054a8b941f4d2efa44780de2f14bfbdb73251aa1277d63aecf7c86c4180e1bbe66efb7a89f73c87d64a84a388ff3c6c7c096b2e3f', '2025-11-29 13:37:02'),
(6, 'demo', 'scrypt:32768:8:1$TMSc6wCeWIqMRGv2$235e91a52817a05c717905d1385c0efa588d26441127ecf4c99ccbfec9a25ba3aba4d894254ae8d35f2acd84983f5175c81d36dfa4b9f7ae7b6e2e08ef0aba90', '2025-12-02 03:02:10'),
(7, 'neko', 'scrypt:32768:8:1$kyZYxd4lfr9BSNmK$b9748195730b83f9e452eab3e17f77d6caaf2fa421256b0fb86c0b0130a71002bb30d31538b11dd829ebac7de9071edd463a795bb1b7361e25a31c386c94f120', '2025-12-02 03:05:33'),
(8, 'c4p31114', 'scrypt:32768:8:1$4PhMpqwPGFaulZHL$a85f52219fc3e328d55024e5d7637c9fb107a42abb7266f963a69234029a8682201fcbeb4e18634e7464d51785a2b6a246bf54942df7b607a4a46207a0e25bc2', '2025-12-09 05:32:28');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `markers`
--
ALTER TABLE `markers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `restocks`
--
ALTER TABLE `restocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `marker_id` (`marker_id`);

--
-- テーブルのインデックス `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `route_markers`
--
ALTER TABLE `route_markers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_id` (`route_id`);

--
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `login_id` (`login_id`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `markers`
--
ALTER TABLE `markers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- テーブルの AUTO_INCREMENT `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- テーブルの AUTO_INCREMENT `restocks`
--
ALTER TABLE `restocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- テーブルの AUTO_INCREMENT `routes`
--
ALTER TABLE `routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- テーブルの AUTO_INCREMENT `route_markers`
--
ALTER TABLE `route_markers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- テーブルの AUTO_INCREMENT `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `markers`
--
ALTER TABLE `markers`
  ADD CONSTRAINT `markers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- テーブルの制約 `restocks`
--
ALTER TABLE `restocks`
  ADD CONSTRAINT `restocks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `restocks_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `restocks_ibfk_3` FOREIGN KEY (`marker_id`) REFERENCES `markers` (`id`);

--
-- テーブルの制約 `route_markers`
--
ALTER TABLE `route_markers`
  ADD CONSTRAINT `rm_route_fk` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
