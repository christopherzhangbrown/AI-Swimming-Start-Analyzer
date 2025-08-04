import json
import os

# ---- CONFIG ----
INPUT_FILE = r"C:\Projects\AI-Swimming-Start-Analyzer\annotations\merged_analysis_combined.json"
OUTPUT_FILE = r"C:\Projects\AI-Swimming-Start-Analyzer\annotations\normalized_pose_phase.json"

def normalize_keypoints(input_file, output_file):
    if not os.path.exists(input_file):
        print(f"❌ ERROR: Input file not found at {input_file}")
        return

    with open(input_file, 'r') as f:
        data = json.load(f)

    # ✅ Make sure width/height are in your JSON (add if missing later)
    frame_width = data["video_info"].get("width", 538)   # fallback if missing
    frame_height = data["video_info"].get("height", 960) # fallback if missing

    orientation = "vertical" if frame_height > frame_width else "horizontal"
    data["video_info"]["orientation"] = orientation

    for frame in data["frame_data"]:
        for kp_name, kp in frame["keypoints"].items():
            kp["x"] = kp["x"] / frame_width
            kp["y"] = kp["y"] / frame_height

    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"✅ Normalized JSON saved to {output_file}")
    print(f"📐 Video orientation detected: {orientation}")

# ---- RUN SCRIPT ----
if __name__ == "__main__":
    normalize_keypoints(INPUT_FILE, OUTPUT_FILE)
