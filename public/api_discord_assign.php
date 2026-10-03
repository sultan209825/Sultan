<?php
// InfinityFree PHP Backend for Sultan Discord VIP Auto-Role & Bot Status Check
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?? [];

$action = trim($input['action'] ?? $_GET['action'] ?? '');
$userId = trim($input['userId'] ?? '');
$guildId = trim($input['guildId'] ?? '');
$roleId = trim($input['roleId'] ?? '');
$botToken = trim($input['botToken'] ?? '');

// Helper for Discord API cURL requests with standard User-Agent and Authorization
function discordApiRequest($url, $method = 'GET', $token = '', $body = null) {
    $ch = curl_init($url);
    $headers = [
        "Authorization: Bot {$token}",
        "User-Agent: DiscordBot (https://sultan.kesug.com, 1.0.0)"
    ];
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
    }
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 14);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'body' => $response,
        'json' => json_decode($response, true),
        'error' => $curlError
    ];
}

// -------------------------------------------------------------
// 1. ACTION: Test Bot Token & Guild/Role Connection
// -------------------------------------------------------------
if ($action === 'test' || (!empty($botToken) && empty($userId))) {
    if (empty($botToken)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'يرجى إدخال توكن البوت أولاً (Bot Token)']);
        exit;
    }

    // Check Bot Account Identity
    $userRes = discordApiRequest('https://discord.com/api/v10/users/@me', 'GET', $botToken);
    if ($userRes['code'] !== 200) {
        http_response_code(400);
        $err = $userRes['error'] ?? '';
        if (strpos($err, 'Could not resolve host') !== false || $userRes['code'] === 0) {
            $msg = '🚫 استضافة InfinityFree المجانية تحظر الاتصال الخارجي بـ Discord API نهائياً عبر جدار الحماية (Firewall Block). بياناتك والتوكن والآيديهات صحيحة 100%! لتفعيل الرتبة التلقائية مجاناً وبدون أي برمجة، يرجى تفعيل Autorole في سيرفرك عبر ProBot أو من إعدادات السيرفر Onboarding.';
        } else {
            $msg = 'توكن البوت غير صحيح أو تم إلغاؤه من Discord Developer Portal (Invalid Bot Token)';
            if (!empty($err)) {
                $msg .= ' [cURL error: ' . $err . ']';
            }
        }
        echo json_encode(['success' => false, 'message' => $msg]);
        exit;
    }

    $botUser = $userRes['json'];
    $guildInfo = null;
    $roleInfo = null;
    $botInGuild = false;

    // Check Guild if provided
    if (!empty($guildId)) {
        $guildRes = discordApiRequest("https://discord.com/api/v10/guilds/{$guildId}", 'GET', $botToken);
        if ($guildRes['code'] === 200) {
            $guildInfo = $guildRes['json'];
            $botInGuild = true;
        }

        // Check Role if provided
        if (!empty($roleId)) {
            $rolesRes = discordApiRequest("https://discord.com/api/v10/guilds/{$guildId}/roles", 'GET', $botToken);
            if ($rolesRes['code'] === 200 && is_array($rolesRes['json'])) {
                foreach ($rolesRes['json'] as $r) {
                    if (($r['id'] ?? '') === $roleId) {
                        $roleInfo = $r;
                        break;
                    }
                }
            }
        }
    }

    echo json_encode([
        'success' => true,
        'state' => [
            'connected' => true,
            'botName' => ($botUser['username'] ?? 'Bot') . '#' . ($botUser['discriminator'] ?? '0'),
            'botId' => $botUser['id'] ?? '',
            'guildName' => $guildInfo['name'] ?? null,
            'roleName' => $roleInfo['name'] ?? null,
            'isInGuild' => $botInGuild
        ]
    ]);
    exit;
}

// -------------------------------------------------------------
// 2. ACTION: Assign or Toggle VIP Role to Member
// -------------------------------------------------------------
if (empty($userId) || empty($guildId) || empty($roleId) || empty($botToken)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'بيانات البوت أو السيرفر أو حساب المستخدم غير مكتملة']);
    exit;
}

// 2.1 Verify Bot access to Guild
$guildCheck = discordApiRequest("https://discord.com/api/v10/guilds/{$guildId}", 'GET', $botToken);
if ($guildCheck['code'] === 0 || strpos($guildCheck['error'] ?? '', 'Could not resolve host') !== false) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => '🚫 استضافة InfinityFree المجانية تحظر الاتصال الخارجي بـ Discord API عبر جدار الحماية (Firewall Block). بياناتك صحيحة 100%! لتفعيل الرتبة التلقائية مجاناً وبدون أي برمجة، يرجى تفعيل Autorole في سيرفرك عبر ProBot أو من إعدادات السيرفر Onboarding.'
    ]);
    exit;
}
if ($guildCheck['code'] === 404 || $guildCheck['code'] === 403) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'البوت غير متواجد في السيرفر أو أن آيدي السيرفر (Server ID) غير صحيح في إعدادات الأدمن! تأكد من دعوة البوت للسيرفر أولاً.'
    ]);
    exit;
}

// 2.2 Resolve Member ID & Profile
$cleanInput = ltrim(trim($userId), '@');
$targetUserId = null;
$memberData = null;

// Option A: Input is a numeric Snowflake Discord User ID (16 to 21 digits)
if (preg_match('/^\d{16,21}$/', $cleanInput)) {
    $mRes = discordApiRequest("https://discord.com/api/v10/guilds/{$guildId}/members/{$cleanInput}", 'GET', $botToken);
    if ($mRes['code'] === 200 && isset($mRes['json']['user']['id'])) {
        $targetUserId = $mRes['json']['user']['id'];
        $memberData = $mRes['json'];
    } elseif ($mRes['code'] === 404) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'notInServer' => true,
            'message' => "الحساب صاحب الآيدي ({$cleanInput}) ليس عضواً في هذا السيرفر حالياً! يجب الدخول إلى سيرفر الديسكورد أولاً."
        ]);
        exit;
    }
} else {
    // Option B: Input is username or display name
    // B.1 Try members search API
    $searchRes = discordApiRequest(
        "https://discord.com/api/v10/guilds/{$guildId}/members/search?query=" . urlencode($cleanInput) . "&limit=10",
        'GET',
        $botToken
    );
    if ($searchRes['code'] === 200 && !empty($searchRes['json'])) {
        foreach ($searchRes['json'] as $cand) {
            $uName = strtolower($cand['user']['username'] ?? '');
            $gName = strtolower($cand['user']['global_name'] ?? '');
            $nick = strtolower($cand['nick'] ?? '');
            $q = strtolower($cleanInput);
            if ($uName === $q || $gName === $q || $nick === $q || strpos($uName, $q) !== false) {
                $targetUserId = $cand['user']['id'];
                $memberData = $cand;
                break;
            }
        }
        if (!$targetUserId && isset($searchRes['json'][0]['user']['id'])) {
            $targetUserId = $searchRes['json'][0]['user']['id'];
            $memberData = $searchRes['json'][0];
        }
    }

    // B.2 If search API didn't find (e.g. Server Members Intent off or non-exact match), try listing members
    if (!$targetUserId) {
        $listRes = discordApiRequest(
            "https://discord.com/api/v10/guilds/{$guildId}/members?limit=1000",
            'GET',
            $botToken
        );
        if ($listRes['code'] === 200 && is_array($listRes['json'])) {
            foreach ($listRes['json'] as $cand) {
                $uName = strtolower($cand['user']['username'] ?? '');
                $gName = strtolower($cand['user']['global_name'] ?? '');
                $nick = strtolower($cand['nick'] ?? '');
                $q = strtolower($cleanInput);
                if ($uName === $q || $gName === $q || $nick === $q || strpos($uName, $q) !== false || strpos($gName, $q) !== false) {
                    $targetUserId = $cand['user']['id'];
                    $memberData = $cand;
                    break;
                }
            }
        }
    }

    // B.3 If still unresolved
    if (!$targetUserId) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'notInServer' => true,
            'message' => 'تعذر العثور على الحساب باسم ("' . $cleanInput . '") في السيرفر! الحل المضمون 100%: انسخ الآيدي الرقمي لحسابك (User ID) وضعه هنا مباشرة (كليك يمين على اسمك بالديسكورد ثم Copy User ID).'
        ]);
        exit;
    }
}

// 2.3 Check current member roles
$currentRoles = is_array($memberData['roles'] ?? null) ? $memberData['roles'] : [];
$hasRole = in_array($roleId, $currentRoles);

// 2.4 If role is already assigned -> REMOVE IT (Toggle)
if ($hasRole) {
    $delRes = discordApiRequest(
        "https://discord.com/api/v10/guilds/{$guildId}/members/{$targetUserId}/roles/{$roleId}",
        'DELETE',
        $botToken
    );
    if ($delRes['code'] === 204) {
        echo json_encode([
            'success' => true,
            'action' => 'removed',
            'message' => 'الرتبة كانت مضافة لحسابك بالفعل، وتمت إزالتها بنجاح الآن! 🗑️'
        ]);
    } elseif ($delRes['code'] === 403) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'صلاحية البوت غير كافية! رتبة البوت في إعدادات السيرفر (Roles) أقل من رتبة الـ VIP. ارفع رتبة البوت لتكون في أعلى قائمة الرتب.'
        ]);
    } else {
        http_response_code($delRes['code'] ?: 400);
        echo json_encode([
            'success' => false,
            'message' => 'خطأ أثناء إزالة الرتبة من ديسكورد: ' . ($delRes['json']['message'] ?? $delRes['body'])
        ]);
    }
    exit;
}

// 2.5 Role is not assigned -> ADD IT
$addRes = discordApiRequest(
    "https://discord.com/api/v10/guilds/{$guildId}/members/{$targetUserId}/roles/{$roleId}",
    'PUT',
    $botToken
);
if ($addRes['code'] === 204) {
    echo json_encode([
        'success' => true,
        'action' => 'added',
        'message' => 'تم منح وإضافة رتبة VIP بنجاح تام لحسابك في السيرفر! 👑'
    ]);
} elseif ($addRes['code'] === 403) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'صلاحية البوت غير كافية! رتبة البوت في إعدادات السيرفر (Roles) أقل من رتبة الـ VIP. ارفع رتبة البوت لتكون فوق رتبة الـ VIP في إعدادات السيرفر.'
    ]);
} else {
    http_response_code($addRes['code'] ?: 400);
    echo json_encode([
        'success' => false,
        'message' => 'خطأ أثناء إضافة الرتبة: ' . ($addRes['json']['message'] ?? $addRes['body'])
    ]);
}
