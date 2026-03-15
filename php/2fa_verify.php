<?php
session_start();
require '../vendor/autoload.php';

use RobThree\Auth\TwoFactorAuth;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$otp = $input['otp'] ?? '';

if (empty($otp) || !preg_match('/^\d{6}$/', $otp)) {
    echo json_encode(['success' => false, 'message' => 'Invalid OTP format.']);
    exit;
}

if (!isset($_SESSION['2fa_secret'])) {
    echo json_encode(['success' => false, 'message' => 'No secret found. Please generate a secret first.']);
    exit;
}

try {
    $tfa = new TwoFactorAuth();
    $result = $tfa->verifyCode($_SESSION['2fa_secret'], $otp);

    if ($result) {
        // Optionally, mark 2FA as enabled for the user
        // $_SESSION['2fa_enabled'] = true;
        echo json_encode(['success' => true, 'message' => 'OTP verified successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid OTP. Please try again.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Verification failed: ' . $e->getMessage()]);
}
