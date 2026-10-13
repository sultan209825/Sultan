<?php
// ========================================================================
// 👑 Sultan Discord Radar Live Voice Telemetry API (PHP Backend for InfinityFree / cPanel)
// ========================================================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Pragma, Cache-Control');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$guildId = isset($_GET['guild_id']) ? preg_replace('/[^0-9]/', '', $_GET['guild_id']) : '1306240131224571957';
if (empty($guildId)) {
    $guildId = '1306240131224571957';
}

$widgetUrl = "https://discord.com/api/guilds/{$guildId}/widget.json";

function fetchWidgetDirect($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept: application/json',
        'Cache-Control: no-cache',
        'Pragma: no-cache'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && !empty($response)) {
        return json_decode($response, true);
    }
    return null;
}

function fetchWidgetViaProxy($url) {
    $proxyUrl = 'https://r.jina.ai/' . $url . '?_t=' . time();
    $ch = curl_init($proxyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: Mozilla/5.0',
        'Accept: application/json, text/plain',
        'Cache-Control: no-cache'
    ]);
    $text = curl_exec($ch);
    curl_close($ch);

    if (!empty($text)) {
        $first = strpos($text, '{');
        $last = strrpos($text, '}');
        if ($first !== false && $last !== false && $last > $first) {
            $jsonStr = substr($text, $first, ($last - $first + 1));
            return json_decode($jsonStr, true);
        }
    }
    return null;
}

// 1. Try Direct
$widgetData = fetchWidgetDirect($widgetUrl);

// 2. Try Jina proxy fallback
if (!$widgetData || !isset($widgetData['members'])) {
    $widgetData = fetchWidgetViaProxy($widgetUrl);
}

if ($widgetData && isset($widgetData['members'])) {
    echo json_encode([
        'success' => true,
        'source' => 'php_host',
        'data' => $widgetData
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(502);
echo json_encode([
    'success' => false,
    'error' => 'Failed to fetch Discord widget data from hosting.'
], JSON_UNESCAPED_UNICODE);
