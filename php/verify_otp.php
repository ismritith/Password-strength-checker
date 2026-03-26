<?php
// verify_otp.php

session_start();
require 'db_connection.php';

$ip = $_SERVER['REMOTE_ADDR'];
$userAgent = $_SERVER['HTTP_USER_AGENT'];

// Check if user came from login (2FA step)
if (!isset($_SESSION['2fa_user_id'])) {
    header("Location: ../front/login.html");
    exit();
}

$userId = $_SESSION['2fa_user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $otp = trim($_POST['otp'] ?? '');
    $errors = [];

    if (empty($otp)) {
        $errors[] = "OTP is required";
    }

    if (!empty($errors)) {
        echo json_encode([
            'success' => false,
            'message' => implode(', ', $errors)
        ]);
        exit;
    }

    // Fetch OTP from DB
    $stmt = $pdo->prepare("
        SELECT otp_hash, otp_expiry 
        FROM users 
        WHERE id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Check expiry
    if (strtotime($user['otp_expiry']) < time()) {
        echo json_encode(['success' => false, 'message' => 'OTP expired']);
        exit;
    }

    // Verify OTP
    if (!password_verify($otp, $user['otp_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid OTP']);
        exit;
    }

    // ✅ OTP correct → FINAL LOGIN

    // Log SUCCESS login
    $stmt = $pdo->prepare("
        INSERT INTO login_history (user_id, ip_address, user_agent, status) 
        VALUES (:user_id, :ip, :ua, 'success')
    ");
    $stmt->execute([
        ':user_id' => $userId,
        ':ip' => $ip,
        ':ua' => $userAgent
    ]);

    // Clear OTP from DB (important)
    $stmt = $pdo->prepare("
        UPDATE users 
        SET otp_hash = NULL, otp_expiry = NULL 
        WHERE id = :id
    ");
    $stmt->execute([':id' => $userId]);

    // Secure session login
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $_SESSION['user_name'] ?? 'User';

    // Remove temp session
    unset($_SESSION['2fa_user_id']);

    echo json_encode([
        'success' => true,
        'message' => 'Login successful'
    ]);
    exit;

} else {
    header("Location: ../front/login.html");
    exit;
}