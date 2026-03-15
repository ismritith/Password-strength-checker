<?php
// db_connection.php

$host = "localhost";
$dbname = "secure_login_register";   // Make sure this database exists in phpMyAdmin
$port = "3306";         // Default MySQL port
$username = "root";     // Default XAMPP username
$password = "";         // Default XAMPP password

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    // Optional test (you can remove this line later)
    // echo "Database connected successfully";

} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
