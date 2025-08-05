import cv2

# === Step 1: Load video ===
input_path = "videos/test_start.mp4"  # Change this to your video
cap = cv2.VideoCapture(input_path)

if not cap.isOpened():
    print("Error opening video file")
    exit()

# === Step 2: Read first frame and let user select ROI ===
ret, frame = cap.read()
if not ret:
    print("Can't read first frame")
    exit()

bbox = cv2.selectROI("Select swimmer's lane", frame, fromCenter=False, showCrosshair=True)
cv2.destroyWindow("Select swimmer's lane")

x, y, w, h = map(int, bbox)

# === Step 3: Set up output video ===
fps = cap.get(cv2.CAP_PROP_FPS)
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
output_path = "cropped_lane.mp4"
out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))

# === Step 4: Loop through video and crop ===
while True:
    ret, frame = cap.read()
    if not ret:
        break
    cropped = frame[y:y+h, x:x+w]
    out.write(cropped)

cap.release()
out.release()
print(f"Cropped video saved to: {output_path}")
