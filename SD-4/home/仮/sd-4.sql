-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2025-12-02 04:08:37
-- サーバのバージョン： 10.4.32-MariaDB
-- PHP のバージョン: 8.2.12

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
(6, 5, '自販機5', 35.39865311812369, 139.464408159256, '2025-12-18 06:16:00', '', '2025-12-01 21:16:14'),
(8, 6, 'ローソン前', 35.397231958828975, 139.46268081665042, '2025-12-02 12:02:00', '', '2025-12-02 03:02:48'),
(9, 7, '渋谷原公園前', 35.399991171364064, 139.46380734443667, '2025-12-15 12:06:00', '', '2025-12-02 03:06:05');

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
(5, 'c4p31048', 'scrypt:32768:8:1$lDaNhSQYhO1mWFaX$68fa20435a1b761801e22d8054a8b941f4d2efa44780de2f14bfbdb73251aa1277d63aecf7c86c4180e1bbe66efb7a89f73c87d64a84a388ff3c6c7c096b2e3f', '2025-11-29 13:37:02'),
(6, 'demo', 'scrypt:32768:8:1$TMSc6wCeWIqMRGv2$235e91a52817a05c717905d1385c0efa588d26441127ecf4c99ccbfec9a25ba3aba4d894254ae8d35f2acd84983f5175c81d36dfa4b9f7ae7b6e2e08ef0aba90', '2025-12-02 03:02:10'),
(7, 'neko', 'scrypt:32768:8:1$kyZYxd4lfr9BSNmK$b9748195730b83f9e452eab3e17f77d6caaf2fa421256b0fb86c0b0130a71002bb30d31538b11dd829ebac7de9071edd463a795bb1b7361e25a31c386c94f120', '2025-12-02 03:05:33');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- テーブルの AUTO_INCREMENT `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `markers`
--
ALTER TABLE `markers`
  ADD CONSTRAINT `markers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
