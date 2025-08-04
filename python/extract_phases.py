import xml.etree.ElementTree as ET
import json

def extract_phases_from_cvat_tags(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    frame_tags = []
    
    # Extract all frame tags
    for image in root.findall('.//image'):
        frame_id = int(image.get('id'))
        
        # Get tags for this frame
        for tag in image.findall('.//tag'):
            label = tag.get('label')
            if label:  # Only if tag has a label
                frame_tags.append({
                    'frame': frame_id,
                    'phase': label
                })
    
    # Sort by frame number
    frame_tags.sort(key=lambda x: x['frame'])
    
    if not frame_tags:
        return []
    
    # Group consecutive frames into phase ranges
    phases = []
    current_phase = frame_tags[0]['phase']
    start_frame = frame_tags[0]['frame']
    last_frame = start_frame
    
    for i in range(1, len(frame_tags)):
        frame_data = frame_tags[i]
        
        # Check if phase changed or frames are not consecutive
        if (frame_data['phase'] != current_phase or 
            frame_data['frame'] != last_frame + 1):
            
            # Save the previous phase
            phases.append({
                'phase': current_phase,
                'start_frame': start_frame,
                'end_frame': last_frame,
                'duration_frames': last_frame - start_frame + 1
            })
            
            # Start new phase
            current_phase = frame_data['phase']
            start_frame = frame_data['frame']
        
        last_frame = frame_data['frame']
    
    # Add the final phase
    phases.append({
        'phase': current_phase,
        'start_frame': start_frame,
        'end_frame': last_frame,
        'duration_frames': last_frame - start_frame + 1
    })
    
    return phases

def convert_to_timestamps(phases, fps=30):
    """Convert frame numbers to timestamps (assuming 30fps)"""
    for phase in phases:
        phase['start_time'] = phase['start_frame'] / fps
        phase['end_time'] = phase['end_frame'] / fps
        phase['duration_seconds'] = phase['duration_frames'] / fps
    return phases

# Usage
if __name__ == "__main__":
    # Extract phases - update path to your annotations folder
    phases = extract_phases_from_cvat_tags('../annotations/annotations.xml')
    
    # Add timestamps (adjust fps if needed)
    phases_with_time = convert_to_timestamps(phases, fps=30)
    
    # Output as JSON
    output = {
        'video_info': {
            'total_frames': max([p['end_frame'] for p in phases]) if phases else 0,
            'fps': 30  # Adjust this to your video's actual FPS
        },
        'phases': phases_with_time
    }
    
    # Save to file
    with open('dive_phases.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    # Print results
    print("Extracted Dive Phases:")
    print("=" * 50)
    for phase in phases_with_time:
        print(f"Phase: {phase['phase']}")
        print(f"  Frames: {phase['start_frame']} - {phase['end_frame']} ({phase['duration_frames']} frames)")
        print(f"  Time: {phase['start_time']:.2f}s - {phase['end_time']:.2f}s ({phase['duration_seconds']:.2f}s)")
        print()