<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$response = array(
    'success' => false,
    'error' => null
);

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $bookingId = $data['bookingId'] ?? '';
    $photoUrl = $data['photoUrl'] ?? '';
    
    if (empty($bookingId) || empty($photoUrl)) {
        throw new Exception('Booking ID and photo URL are required');
    }

    // Extract filename from URL
    $filename = basename($photoUrl);
    $filepath = "../uploads/galleries/$bookingId/$filename";

    if (file_exists($filepath)) {
        if (unlink($filepath)) {
            $response['success'] = true;
        } else {
            throw new Exception('Failed to delete file');
        }
    } else {
        throw new Exception('File not found');
    }

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    http_response_code(400);
}

header('Content-Type: application/json');
echo json_encode($response);