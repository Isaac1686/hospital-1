<?php
$ch = curl_init('http://127.0.0.1:8000/api/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'laboratorist@hospital.com', 'password' => 'laboratory123']));
$res = curl_exec($ch);
$info = curl_getinfo($ch);
echo 'HTTP ' . $info['http_code'] . "\n";
echo substr($res,0,8000) . (strlen($res) > 8000 ? "\n... (truncated)" : "\n");
curl_close($ch);
