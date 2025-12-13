-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2025-12-13 10:43:28
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
(1, 'テスト1', 35.4017664626273, 139.4635605812073, 35.39559212851686, 139.46315288543704, 'optimized', '2025-12-10 14:19:20'),
(2, '登録１', 35.401399164194, 139.4633460044861, 35.396134369430555, 139.45926904678348, 'manual', '2025-12-13 01:18:34'),
(3, '登録２', 35.39205872746594, 139.46405410766604, 35.39653667484895, 139.4674873352051, 'manual', '2025-12-13 01:20:08'),
(4, '登録３', 35.3690097, 139.4186557, 35.3967028438925, 139.46771264076236, 'optimized', '2025-12-13 01:21:38'),
(5, '登録４', 35.3690097, 139.4186557, 35.3967028438925, 139.46771264076236, 'optimized', '2025-12-13 01:22:39');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `routes`
--
ALTER TABLE `routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
