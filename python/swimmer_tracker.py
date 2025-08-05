import cv2

def main(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error opening video file")
        return

    # Read first frame
    ret, frame = cap.read()
    if not ret:
        print("Can't read video file")
        return

    # Select ROI (bounding box) manually on first frame
    bbox = cv2.selectROI("Select Swimmer to Track", frame, False)
    cv2.destroyWindow("Select Swimmer to Track")

    # Initialize tracker with first frame and bounding box
    tracker = cv2.TrackerCSRT_create()
    tracker.init(frame, bbox)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Update tracker and get updated position
        success, bbox = tracker.update(frame)

        if success:
            # Tracking success, draw bounding box
            x, y, w, h = [int(v) for v in bbox]
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(frame, "Tracking", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        else:
            # Tracking failure
            cv2.putText(frame, "Lost Track!", (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        cv2.imshow("Swimmer Tracker", frame)

        key = cv2.waitKey(30) & 0xFF
        if key == ord('q'):  # Quit on 'q'
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    video_file = "videos/test_start.mp4"  # Replace with your video path
    main(video_file)
