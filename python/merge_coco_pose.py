import json
import sys

def load_coco_labels(coco_path):
    """Load COCO annotations and create a dictionary mapping frame -> phase"""
    with open(coco_path, 'r') as f:
        coco = json.load(f)

    # Map category_id to label name
    categories = {c['id']: c['name'] for c in coco['categories']}

    # Map image_id to file_name (or frame index)
    images = {img['id']: img['file_name'] for img in coco['images']}

    # Build phase dictionary: frame_name -> phase_name
    phases_per_frame = {}
    for ann in coco['annotations']:
        image_id = ann['image_id']
        category_id = ann['category_id']
        phase_name = categories.get(category_id, "Unknown")

        frame_name = images.get(image_id)
        if frame_name:
            # Strip extension like ".jpg" or ".png"
            frame_base = frame_name.split('.')[0]
            phases_per_frame[frame_base] = phase_name

    return phases_per_frame

def load_pose_data(pose_path):
    """Load MediaPipe keypoints per frame"""
    with open(pose_path, 'r') as f:
        return json.load(f)

def merge_data(coco_labels, pose_data):
    """Merge phase labels with pose keypoints by frame"""
    merged = {}
    for frame_key, pose in pose_data.items():
        phase = coco_labels.get(frame_key, "Unknown")
        merged[frame_key] = {
            "phase": phase,
            "pose": pose
        }
    return merged

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python merge_coco_pose.py <coco_json> <pose_json> <output_json>")
        sys.exit(1)

    coco_json_path = sys.argv[1]
    pose_json_path = sys.argv[2]
    output_json_path = sys.argv[3]

    coco_labels = load_coco_labels(coco_json_path)
    pose_data = load_pose_data(pose_json_path)
    merged = merge_data(coco_labels, pose_data)

    with open(output_json_path, 'w') as out_f:
        json.dump(merged, out_f, indent=2)

    print(f"✅ Merged data saved to {output_json_path}")
