<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Content-Type: application/json');

$response = array(
    'success' => false,
    'photos' => array(),
    'error' => null
);

try {
    $bookingId = $_GET['bookingId'] ?? '';
    
    if (empty($bookingId)) {
        throw new Exception('Booking ID is required');
    }

    // Validate booking ID format
    if (!preg_match('/^[a-zA-Z0-9-_]+$/', $bookingId)) {
        throw new Exception('Invalid booking ID format');
    }

    // Verify galleries directory exists
    $galleryDir = "../uploads/galleries/$bookingId/";
    $photos = array();

    if (is_dir($galleryDir)) {
        $files = scandir($galleryDir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && !is_dir($galleryDir . $file)) {
                // Verify it's an image
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'jpeg', 'png'])) {
                    // Get file info
                    $filePath = $galleryDir . $file;
                    $fileInfo = getimagesize($filePath);
                    
                    if ($fileInfo !== false) {
                        $photos[] = array(
                            'url' => "/uploads/galleries/$bookingId/$file",
                            'name' => $file,
                            'size' => filesize($filePath),
                            'width' => $fileInfo[0],
                            'height' => $fileInfo[1],
                            'type' => $fileInfo['mime']
                        );
                    }
                }
            }
        }
    }

    $response['success'] = true;
    $response['photos'] = $photos;

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    http_response_code(400);
}

echo json_encode($response);