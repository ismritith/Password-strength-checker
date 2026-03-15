<?php
// login.php
session_start();
require 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $recaptchaResponse = $_POST['g-recaptcha-response'] ?? '';
    $errors = [];

    // Verify reCAPTCHA
    if (empty($recaptchaResponse)) {
        $errors[] = "Captcha verification failed";
    } else {
        $secretKey = '6Lf_DYssAAAAALLJg5WgoLsEg6xKY-6QVa7Shjuq'; // reCAPTCHA secret key what was that? 😂// alright the registeration process is now done. now just please change the design and add the 2 FA verification in this hunchha
        $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

        $ch = curl_init($verifyUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'secret' => $secretKey,
            'response' => $recaptchaResponse,
        ]));
        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        curl_close($ch);

        if (!$response) {
            error_log('reCAPTCHA verify failed: ' . $curlError);
            $errors[] = "Captcha verification failed";
        } else {
            $responseKeys = json_decode($response, true);
            if (empty($responseKeys['success'])) {
                error_log('reCAPTCHA verify response: ' . $response);
                $errors[] = "Captcha verification failed";
            }
        }
    }

    if (empty($email)) {
        $errors[] = 'Email is required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email format';
    }
    if (empty($password)) {
        $errors[] = 'Password is required';
    }

    if (!empty($errors)) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => implode(', ', $errors)
        ]);
        exit;
    }

    // Check if user exists
    $sql = "SELECT id, first_name, last_name, password FROM users WHERE email = :email LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
        // Redirect to index.php after successful login
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'redirect' => '../index.php',
            'message' => 'Login successful!'
        ]);
        exit;
    } else {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password.'
        ]);
        exit;
    }
} else {
    header('Location: ../front/login.html');
    exit;
}
