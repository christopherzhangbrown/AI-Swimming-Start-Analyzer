import json, random, os

INPUT_FILE = r"C:\Projects\AI-Swimming-Start-Analyzer\data\normalized_pose_phase.json"
OUTPUT_DIR = r"C:\Projects\AI-Swimming-Start-Analyzer\data\splits"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(INPUT_FILE, "r") as f:
    data = json.load(f)

frames = data["frame_data"]
random.shuffle(frames)

total = len(frames)
train_split = int(total * 0.7)
val_split = int(total * 0.9)

train = frames[:train_split]
val = frames[train_split:val_split]
test = frames[val_split:]

def save_split(name, split_frames):
    split_data = {
        "video_info": data["video_info"],
        "phases_summary": data["phases_summary"],
        "frame_data": split_frames
    }
    with open(os.path.join(OUTPUT_DIR, f"{name}.json"), "w") as f:
        json.dump(split_data, f, indent=2)

save_split("train", train)
save_split("val", val)
save_split("test", test)

print(f"✅ Done! {len(train)} train, {len(val)} val, {len(test)} test frames saved to {OUTPUT_DIR}")
