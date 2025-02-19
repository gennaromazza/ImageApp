<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$response = array(
    'success' => false,
    'url' => null,
    'error' => null
);

try {
    if (!isset($_FILES['photo'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['photo'];
    $bookingId = $_POST['bookingId'] ?? '';
    
    if (empty($bookingId)) {
        throw new Exception('Booking ID is required');
    }

    // Validate booking ID format
    if (!preg_match('/^[a-zA-Z0-9-_]+$/', $bookingId)) {
        throw new Exception('Invalid booking ID format');
    }

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG and PNG are allowed.');
    }

    // Validate file size (5MB max)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('File size exceeds 5MB limit');
    }

    // Create galleries directory if it doesn't exist
    $uploadDir = "../uploads/galleries/$bookingId/";
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $filename = uniqid() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $filename;

    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Verify the uploaded file is a valid image
        $imageInfo = getimagesize($targetPath);
        if ($imageInfo === false) {
            unlink($targetPath);
            throw new Exception('Invalid image file');
        }

        $response['success'] = true;
        $response['url'] = "/uploads/galleries/$bookingId/$filename";
        $response['name'] = $filename;
        $response['width'] = $imageInfo[0];
        $response['height'] = $imageInfo[1];
        $response['size'] = $file['size'];
    } else {
        throw new Exception('Failed to move uploaded file');
    }

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    http_response_code(400);
}

header('Content-Type: application/json');
echo json_encode($response);