import cv2
import mediapipe as mp
import numpy as np
from tensorflow import keras

# ✅ MUST match the keypoints you trained on
KEYPOINT_INDEXES = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
PHASES = ["Setup", "Takeoff", "Flight", "Entry"]

# ✅ Load trained model
model = keras.models.load_model("models/saved_model/swim_phase_classifier.keras")

# ✅ Load Mediapipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

def predict_phase_from_frame(frame):
    """Process a single frame and return predicted phase name (or None if no pose found)."""
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if not results.pose_landmarks:
        return None  # No person detected

    # extract only training keypoints
    landmarks = results.pose_landmarks.landmark
    keypoints = []
    for idx in KEYPOINT_INDEXES:
        kp = landmarks[idx]
        keypoints.extend([kp.x, kp.y, kp.z, kp.visibility])

    # predict
    input_data = np.array(keypoints).reshape(1, -1)
    pred = model.predict(input_data, verbose=0)
    phase = PHASES[np.argmax(pred)]
    return phase

def run_video(video_path):
    cap = cv2.VideoCapture(video_path)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        phase = predict_phase_from_frame(frame)

        # Draw prediction on frame
        if phase:
            cv2.putText(frame, f"Phase: {phase}",
                        (30, 50), cv2.FONT_HERSHEY_SIMPLEX,
                        1, (0, 255, 0), 2)

        cv2.imshow("Swim Phase Detection", frame)

        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # 🔥 TEST ON ORIGINAL LABELED VIDEO FIRST
    run_video("videos/2ea9648cd87f4781b1622dfa552a0c75.mp4")

    # 🏊‍♂️ THEN TRY A DIFFERENT VIDEO (swap filename)
    # run_video("data/test_video.mp4")
