<?php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Serve existing files directly
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// Default fallback (optional)
require_once __DIR__ . '/register.php';