"use client"

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

interface VideoPlayerProps {
  videoUrl: string
  poseData: any[]
  isAnalysisComplete: boolean
  onTimeUpdate?: (currentTime: number) => void
  phaseAnalysis?: {
    phaseTimings?: {
      setupStart: number
      setupEnd: number
      launchStart: number
      launchEnd: number
      entryStart: number
      entryEnd: number
      totalDuration: number
    }
  }
}

export interface VideoPlayerRef {
  seekToTime: (time: number) => void
  startLooping: (startTime: number, endTime: number) => void
  stopLooping: () => void
  getCurrentTime: () => number
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ videoUrl, poseData, isAnalysisComplete, onTimeUpdate, phaseAnalysis }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPose, setShowPose] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [loopStart, setLoopStart] = useState<number | null>(null)
  const [loopEnd, setLoopEnd] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [videoUrl])

  useEffect(() => {
    if (!isAnalysisComplete) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !poseData.length) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawPoseOverlay = () => {
      if (!video || !canvas || !ctx) return

      // Get the parent container (aspect-video div) dimensions
      const container = canvas.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();

      // Get actual video dimensions
      const videoAspect = video.videoWidth / video.videoHeight;
      const containerAspect = containerRect.width / containerRect.height;
      
      // Calculate the actual displayed video size (accounting for object-contain)
      let displayWidth, displayHeight, offsetX, offsetY;
      
      if (containerAspect > videoAspect) {
        // Letterboxing on left/right
        displayHeight = containerRect.height;
        displayWidth = displayHeight * videoAspect;
        offsetX = (containerRect.width - displayWidth) / 2;
        offsetY = 0;
      } else {
        // Letterboxing on top/bottom
        displayWidth = containerRect.width;
        displayHeight = displayWidth / videoAspect;
        offsetX = 0;
        offsetY = (containerRect.height - displayHeight) / 2;
      }

      // Set canvas size to match container exactly
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      canvas.style.width = `${containerRect.width}px`;
      canvas.style.height = `${containerRect.height}px`;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!showPose) {
        animationRef.current = requestAnimationFrame(drawPoseOverlay);
        return;
      }

      const currentVideoTime = video.currentTime;
      const frameIndex = Math.min(
        Math.floor(currentVideoTime * 15), // match FPS used in detection
        poseData.length - 1,
      );

      if (frameIndex >= 0 && frameIndex < poseData.length) {
        const frame = poseData[frameIndex];
        
        // Debug: log the first frame to understand coordinate system
        if (frameIndex === 0 && frame.keypoints.nose) {
          console.log('=== POSE OVERLAY DEBUG ===');
          console.log('Frame data:', frame);
          console.log('Sample keypoint (nose):', frame.keypoints.nose);
          console.log('Frame canvas dimensions:', frame.canvasWidth, 'x', frame.canvasHeight);
          console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          console.log('Container dimensions:', containerRect.width, 'x', containerRect.height);
          console.log('Display dimensions:', displayWidth, 'x', displayHeight);
          console.log('Offsets:', 'X:', offsetX, 'Y:', offsetY);
          console.log('Nose should be at:', 
            'X:', offsetX + (frame.keypoints.nose.x * displayWidth),
            'Y:', offsetY + (frame.keypoints.nose.y * displayHeight)
          );
          console.log('========================');
        }
        
        // Coordinates are already normalized (0-1) in the PoseFrame data
        ctx.fillStyle = "#00FF00";
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3;

        // Only draw major joints
        const majorJoints = [
          "nose",
          "leftShoulder",
          "rightShoulder",
          "leftHip",
          "rightHip",
          "leftKnee",
          "rightKnee",
          "leftAnkle",
          "rightAnkle",
          "leftWrist",
          "rightWrist",
        ];
        Object.entries(frame.keypoints).forEach(([name, point]) => {
          if (!majorJoints.includes(name)) return;
          const kp = point as any;
          if (kp && kp.visibility && kp.visibility > 0.3) {
            // Coordinates are normalized 0-1, scale to display area and add offset
            const x = offsetX + (kp.x * displayWidth);
            const y = offsetY + (kp.y * displayHeight);
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2;
        const connections = [
          ["leftShoulder", "rightShoulder"],
          ["leftShoulder", "leftElbow"],
          ["leftElbow", "leftWrist"],
          ["rightShoulder", "rightElbow"],
          ["rightElbow", "rightWrist"],
          ["leftShoulder", "leftHip"],
          ["rightShoulder", "rightHip"],
          ["leftHip", "rightHip"],
          ["leftHip", "leftKnee"],
          ["leftKnee", "leftAnkle"],
          ["rightHip", "rightKnee"],
          ["rightKnee", "rightAnkle"],
          ["nose", "leftShoulder"],
          ["nose", "rightShoulder"],
        ];
        connections.forEach(([from, to]) => {
          const fromPoint = frame.keypoints[from] as any;
          const toPoint = frame.keypoints[to] as any;
          if (
            fromPoint &&
            toPoint &&
            fromPoint.visibility &&
            fromPoint.visibility > 0.5 &&
            toPoint.visibility &&
            toPoint.visibility > 0.5
          ) {
            const x1 = offsetX + (fromPoint.x * displayWidth);
            const y1 = offsetY + (fromPoint.y * displayHeight);
            const x2 = offsetX + (toPoint.x * displayWidth);
            const y2 = offsetY + (toPoint.y * displayHeight);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        });
      }

      animationRef.current = requestAnimationFrame(drawPoseOverlay)
    }

    drawPoseOverlay()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isAnalysisComplete, poseData, showPose])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }

    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return

    const time = video.currentTime
    setCurrentTime(time)
    
    // Call parent callback
    if (onTimeUpdate) {
      onTimeUpdate(time)
    }

    // Handle looping
    if (isLooping && loopStart !== null && loopEnd !== null) {
      if (time >= loopEnd) {
        video.currentTime = loopStart
      }
    }
  }

  const handleSliderChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  const skipForward = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.min(video.currentTime + 0.1, video.duration)
  }

  const skipBackward = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(video.currentTime - 0.1, 0)
  }

  // Create colored timeline segments based on phase analysis
  const getTimelineSegments = () => {
    if (!phaseAnalysis?.phaseTimings || !duration) {
      return [{ start: 0, end: 100, color: 'bg-blue-500', phase: 'full' }];
    }

    const timings = phaseAnalysis.phaseTimings;
    const segments = [];

    // Setup phase (green)
    segments.push({
      start: (timings.setupStart / duration) * 100,
      end: (timings.setupEnd / duration) * 100,
      color: 'bg-green-500',
      phase: 'setup'
    });

    // Launch phase (red)
    segments.push({
      start: (timings.launchStart / duration) * 100,
      end: (timings.launchEnd / duration) * 100,
      color: 'bg-red-500',
      phase: 'launch'
    });

    // Entry phase (blue)
    segments.push({
      start: (timings.entryStart / duration) * 100,
      end: (timings.entryEnd / duration) * 100,
      color: 'bg-blue-500',
      phase: 'entry'
    });

    return segments;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    const video = videoRef.current;
    if (video) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  // Phase navigation methods
  const seekToTime = (time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(time, video.duration))
    setCurrentTime(video.currentTime)
  }

  const startLooping = (startTime: number, endTime: number) => {
    setLoopStart(startTime)
    setLoopEnd(endTime)
    setIsLooping(true)
    seekToTime(startTime)
    
    // Auto-play when looping starts
    const video = videoRef.current
    if (video && !isPlaying) {
      video.play()
      setIsPlaying(true)
    }
  }

  const stopLooping = () => {
    setIsLooping(false)
    setLoopStart(null)
    setLoopEnd(null)
  }

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    seekToTime,
    startLooping,
    stopLooping,
    getCurrentTime: () => currentTime
  }))

  // Add fullscreen handler
  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-black w-screen h-screen max-w-none" : ""}`}
      style={isFullscreen ? { width: "100vw", height: "100vh", maxWidth: "none" } : {}}
    >
      {/* Video container - reasonable max width */}
      <div className={`relative w-full ${isFullscreen ? "h-full max-w-none" : "max-w-4xl mx-auto"} bg-black rounded-lg overflow-hidden`} style={isFullscreen ? { height: "100vh", maxWidth: "none" } : {}}>
        <div className="aspect-video w-full h-full relative">
          <video
            ref={videoRef}
            src={videoUrl}
            className={`w-full h-full object-contain ${isFullscreen ? "bg-black" : ""}`}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            style={isFullscreen ? { width: "100vw", height: "100vh", background: "black" } : {}}
          />
          {isAnalysisComplete && (
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={isFullscreen ? { width: "100vw", height: "100vh" } : {}} />
          )}
          {/* Fullscreen button in top-right corner of video */}
          <button
            type="button"
            onClick={handleFullscreen}
            className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded p-1 hover:bg-opacity-80 focus:outline-none"
            title="Fullscreen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        </div>
      </div>

      <div className={`p-4 space-y-4 w-full ${isFullscreen ? "text-white" : ""}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isFullscreen ? "text-white bg-black bg-opacity-50 px-2 py-1 rounded" : ""}`}>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-black bg-opacity-60 text-white shadow hover:bg-opacity-80 transition-colors duration-150 border-none"
              onClick={skipBackward}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-black bg-opacity-70 text-white shadow-lg hover:bg-opacity-90 transition-colors duration-150 border-none"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-black bg-opacity-60 text-white shadow hover:bg-opacity-80 transition-colors duration-150 border-none"
              onClick={skipForward}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          <span className={`text-sm font-medium ${isFullscreen ? "text-white bg-black bg-opacity-50 px-2 py-1 rounded" : ""}`}>{formatTime(duration)}</span>
        </div>

        {/* Custom colored timeline */}
        <div className="relative w-full">
          <div 
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleTimelineClick}
          >
            {/* Phase colored segments */}
            {getTimelineSegments().map((segment, index) => (
              <div
                key={index}
                className={`absolute h-full ${segment.color} transition-all duration-200`}
                style={{
                  left: `${segment.start}%`,
                  width: `${segment.end - segment.start}%`
                }}
              />
            ))}
            
            {/* Current time indicator */}
            <div 
              className="absolute top-0 w-1 h-full bg-white border border-gray-400 rounded-full shadow-md transition-all duration-100"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          
          {/* Phase labels (only show if we have phase data) */}
          {phaseAnalysis?.phaseTimings && (
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Setup</span>
              <span>Launch</span>
              <span>Entry</span>
            </div>
          )}
        </div>

        {isAnalysisComplete && (
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isFullscreen ? "text-white bg-black bg-opacity-50 px-2 py-1 rounded" : ""}`}>Pose Overlay</span>
            <Button
              variant={showPose ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPose(!showPose)}
              className={showPose ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {showPose ? "Hide Pose" : "Show Pose"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})

VideoPlayer.displayName = "VideoPlayer"

export default VideoPlayer
