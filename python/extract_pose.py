import cv2
import mediapipe as mp
import json
import sys

def main(video_path, output_path):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False,
                        model_complexity=1,
                        enable_segmentation=False,
                        min_detection_confidence=0.5)

    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    results_dict = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Convert the BGR image to RGB.
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process with MediaPipe Pose.
        result = pose.process(rgb_frame)

        keypoints = {}
        if result.pose_landmarks:
            for idx, landmark in enumerate(result.pose_landmarks.landmark):
                keypoints[f'kp_{idx}'] = {
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                }

        results_dict[f'frame_{frame_count}'] = keypoints
        frame_count += 1

    cap.release()
    pose.close()

    # Save results to JSON
    with open(output_path, 'w') as f:
        json.dump(results_dict, f, indent=2)

    print(f'Pose keypoints extracted for {frame_count} frames and saved to {output_path}')


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extract_pose.py <input_video.mp4> <output_keypoints.json>")
    else:
        main(sys.argv[1], sys.argv[2])
