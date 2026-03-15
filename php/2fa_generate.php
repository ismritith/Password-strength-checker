<?php
session_start();
require '../vendor/autoload.php';

use RobThree\Auth\TwoFactorAuth;

header('Content-Type: application/json');

try {
    $tfa = new TwoFactorAuth('PasswordStrengthChecker');

    // Generate a new secret
    $secret = $tfa->createSecret();

    // Store in session
    $_SESSION['2fa_secret'] = $secret;

    // Generate QR code URL
    $qrCodeUrl = $tfa->getQRCodeImageAsDataUri('Password Strength Checker', $secret);

    echo json_encode([
        'success' => true,
        'secret' => $secret,
        'qrCodeUrl' => $qrCodeUrl
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to generate secret: ' . $e->getMessage()
    ]);
}
