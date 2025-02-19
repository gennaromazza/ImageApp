<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

$response = array(
    'success' => false,
    'error' => null
);

try {
    $bookingId = $_GET['bookingId'] ?? '';
    
    if (empty($bookingId)) {
        throw new Exception('Booking ID is required');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Read selected photos
        $selectedFile = "../uploads/galleries/$bookingId/selected.json";
        if (file_exists($selectedFile)) {
            $selected = json_decode(file_get_contents($selectedFile), true);
            $response['success'] = true;
            $response['selectedPhotos'] = $selected['photos'] ?? [];
        } else {
            $response['success'] = true;
            $response['selectedPhotos'] = [];
        }
    } 
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Save selected photos
        $data = json_decode(file_get_contents('php://input'), true);
        $selectedPhotos = $data['selectedPhotos'] ?? [];
        
        if (!file_exists("../uploads/galleries/$bookingId")) {
            mkdir("../uploads/galleries/$bookingId", 0755, true);
        }
        
        file_put_contents(
            "../uploads/galleries/$bookingId/selected.json",
            json_encode(['photos' => $selectedPhotos])
        );
        
        $response['success'] = true;
    }

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
}

echo json_encode($response);