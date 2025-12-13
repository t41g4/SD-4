-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2025-12-13 10:40:38
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
(3, 'ポカリ', '/images/pocari.png'),
(4, '伊右衛門', '/images/iyemon.png'),
(5, '伊右衛門 濃い茶', '/images/iyemon_koicha.png'),
(6, '伊右衛門 ほうじ茶', '/images/iyemon_hojicha.png'),
(7, '伊右衛門 特茶', '/images/iyemon_tokucha.png'),
(8, '烏龍茶', '/images/oolong_tea.png'),
(9, 'サントリー天然水', '/images/suntory_tennensui.png'),
(10, 'サントリー天然水 朝摘みオレンジ', '/images/tennensui_orange.png'),
(11, 'GREEN DA・KA・RA', '/images/green_dakara.png'),
(12, 'GREEN DA・KA・RA やさしい麦茶', '/images/dakara_mugicha.png'),
(13, 'デカビタC', '/images/decavita_c.png'),
(14, 'C.C.レモン', '/images/cc_lemon.png'),
(15, 'C.C.レモン 塩', '/images/cc_lemon_salt.png'),
(16, 'ペプシコーラ', '/images/pepsi.png'),
(17, 'ペプシ ジャパンコーラ', '/images/pepsi_japan.png'),
(18, 'なっちゃん オレンジ', '/images/natchan_orange.png'),
(19, 'なっちゃん りんご', '/images/natchan_apple.png'),
(20, 'なっちゃん ぶどう', '/images/natchan_grape.png'),
(21, 'BOSS ブラック', '/images/boss_black.png'),
(22, 'BOSS 無糖', '/images/boss_muto.png'),
(23, 'BOSS カフェオレ', '/images/boss_cafeau_lait.png'),
(24, 'BOSS レインボーマウンテン', '/images/boss_rainbow.png'),
(25, 'BOSS 贅沢微糖', '/images/boss_zeitaku.png'),
(26, 'BOSS プレミアムボス', '/images/premium_boss.png'),
(27, 'おしるこ', '/images/oshiruko.png'),
(28, 'コーンポタージュ', '/images/corn_potage.png'),
(29, 'レモンスカッシュ', '/images/lemon_squash.png'),
(30, 'ジンジャーエール', '/images/ginger_ale.png'),
(31, 'なっちゃん みかんスパークリング', '/images/natchan_sparkling.png');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
