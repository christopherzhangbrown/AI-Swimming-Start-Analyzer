import json
import tensorflow as tf
import numpy as np

# Map phase names to integer labels
PHASE_LABELS = {
    "Setup": 0,
    "Takeoff": 1,
    "Flight": 2,
    "Entry": 3
}

def flatten_keypoints(keypoints_dict):
    important_indices = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    flat = []
    for idx in important_indices:
        kp_key = f"kp_{idx}"
        if kp_key in keypoints_dict:
            kp = keypoints_dict[kp_key]
            flat.extend([kp['x'], kp['y'], kp['z'], kp['visibility']])
        else:
            # If missing, append dummy zeros so training doesn’t break
            flat.extend([0.0, 0.0, 0.0, 0.0])
    return flat

def create_tf_example(features, label):
    feature = {
        'keypoints': tf.train.Feature(float_list=tf.train.FloatList(value=features)),
        'label': tf.train.Feature(int64_list=tf.train.Int64List(value=[label]))
    }
    return tf.train.Example(features=tf.train.Features(feature=feature))

def main():
    with open('data/normalized_pose_phase.json') as f:
        data = json.load(f)

    frames = data['frame_data']
    phases = data['phases_summary']

    # Build a map from frame number to phase label
    frame_to_phase = {}
    for phase in phases:
        for frame_num in range(phase['start_frame'], phase['end_frame'] + 1):
            frame_to_phase[frame_num] = PHASE_LABELS[phase['phase']]

    # Write TFRecord file
    with tf.io.TFRecordWriter('data/train.tfrecord') as writer:
        for frame in frames:
            frame_num = frame['frame']
            if frame_num not in frame_to_phase:
                continue  # skip frames without phase labels
            
            keypoints_flat = flatten_keypoints(frame['keypoints'])
            label = frame_to_phase[frame_num]
            example = create_tf_example(keypoints_flat, label)
            writer.write(example.SerializeToString())

    print("TFRecord file created at data/train.tfrecord")

if __name__ == "__main__":
    main()
