import json

def combine_phases_with_poses(phases_file, poses_file, output_file):
    """
    Combine dive phases with pose keypoints data
    """
    
    # Load the data
    with open(phases_file, 'r') as f:
        phases_data = json.load(f)
    
    with open(poses_file, 'r') as f:
        poses_data = json.load(f)
    
    # Create frame-to-phase mapping
    frame_to_phase = {}
    for phase in phases_data['phases']:
        for frame_num in range(phase['start_frame'], phase['end_frame'] + 1):
            frame_to_phase[frame_num] = {
                'phase': phase['phase'],
                'phase_progress': (frame_num - phase['start_frame']) / phase['duration_frames'],
                'time_in_phase': (frame_num - phase['start_frame']) / phases_data['video_info']['fps']
            }
    
    # Process poses and add phase information
    combined_data = {
        'video_info': phases_data['video_info'],
        'phases_summary': phases_data['phases'],
        'frame_data': []
    }
    
    # Handle your specific pose format: {"frame_0": {...}, "frame_1": {...}}
    for frame_key, keypoints in poses_data.items():
        if frame_key.startswith('frame_'):
            # Extract frame number from "frame_X"
            frame_num = int(frame_key.split('_')[1])
            
            frame_info = {
                'frame': frame_num,
                'timestamp': frame_num / phases_data['video_info']['fps'],
                'keypoints': keypoints,  # Your kp_0, kp_1, etc. data
                'phase_info': frame_to_phase.get(frame_num, {
                    'phase': 'untagged', 
                    'phase_progress': 0, 
                    'time_in_phase': 0
                })
            }
            combined_data['frame_data'].append(frame_info)
    
    # Sort frame data by frame number
    combined_data['frame_data'].sort(key=lambda x: x['frame'])
    
    # Save combined data
    with open(output_file, 'w') as f:
        json.dump(combined_data, f, indent=2)
    
    return combined_data

def analyze_poses_by_phase(combined_data):
    """
    Generate summary statistics of poses by phase
    """
    phase_stats = {}
    
    for frame in combined_data['frame_data']:
        phase = frame['phase_info']['phase']
        if phase not in phase_stats:
            phase_stats[phase] = {
                'frame_count': 0,
                'pose_count': 0,
                'frames': []
            }
        
        phase_stats[phase]['frame_count'] += 1
        phase_stats[phase]['pose_count'] += len(frame.get('keypoints', {}))
        phase_stats[phase]['frames'].append(frame['frame'])
    
    return phase_stats

def extract_phase_specific_poses(combined_data, target_phase):
    """
    Extract poses for a specific phase
    """
    phase_poses = []
    
    for frame in combined_data['frame_data']:
        if frame['phase_info']['phase'] == target_phase:
            phase_poses.append({
                'frame': frame['frame'],
                'timestamp': frame['timestamp'],
                'phase_progress': frame['phase_info']['phase_progress'],
                'poses': frame['keypoints']
            })
    
    return phase_poses

# Usage example
if __name__ == "__main__":
    # Combine the data
    combined = combine_phases_with_poses(
        '../annotations/dive_phases.json',     # Your phase data
        '../outputs/pose_keypoints.json',      # Your pose data (update filename)
        'merged_analysis_combined.json'          # Output file
    )   
    
    # Analyze poses by phase
    stats = analyze_poses_by_phase(combined)
    
    print("Pose Analysis by Phase:")
    print("=" * 40)
    for phase, data in stats.items():
        print(f"{phase}:")
        print(f"  Frames: {data['frame_count']}")
        print(f"  Poses detected: {data['pose_count']}")
        print(f"  Frame range: {min(data['frames'])} - {max(data['frames'])}")
        print()
    
    # Example: Extract poses for takeoff phase
    takeoff_poses = extract_phase_specific_poses(combined, 'Takeoff')
    print(f"Extracted {len(takeoff_poses)} frames of Takeoff phase poses")
    
    # Save phase-specific data
    with open('takeoff_poses.json', 'w') as f:
        json.dump(takeoff_poses, f, indent=2)