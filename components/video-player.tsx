"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

interface VideoPlayerProps {
  videoUrl: string
  poseData: any[]
  isAnalysisComplete: boolean
}

export default function VideoPlayer({ videoUrl, poseData, isAnalysisComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPose, setShowPose] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

      // Get the actual displayed size and offset of the video element
      const videoRect = video.getBoundingClientRect();
      const containerRect = canvas.parentElement?.getBoundingClientRect() || videoRect;
      // Calculate the displayed width/height (object-contain may add letterboxing)
      const videoAspect = video.videoWidth / video.videoHeight;
      const containerAspect = videoRect.width / videoRect.height;
      let drawWidth = videoRect.width;
      let drawHeight = videoRect.height;
      let offsetX = 0;
      let offsetY = 0;
      if (containerAspect > videoAspect) {
        // Letterbox left/right
        drawHeight = videoRect.height;
        drawWidth = drawHeight * videoAspect;
        offsetX = (videoRect.width - drawWidth) / 2;
      } else {
        // Letterbox top/bottom
        drawWidth = videoRect.width;
        drawHeight = drawWidth / videoAspect;
        offsetY = (videoRect.height - drawHeight) / 2;
      }
      canvas.width = drawWidth;
      canvas.height = drawHeight;
      canvas.style.position = "absolute";
      canvas.style.left = `${offsetX}px`;
      canvas.style.top = `${offsetY}px`;
      canvas.style.width = `${drawWidth}px`;
      canvas.style.height = `${drawHeight}px`;

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
        const normWidth = frame.canvasWidth || video.videoWidth;
        const normHeight = frame.canvasHeight || video.videoHeight;
        const scaleX = drawWidth / normWidth;
        const scaleY = drawHeight / normHeight;

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
            const x = kp.x * normWidth * scaleX;
            const y = kp.y * normHeight * scaleY;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
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
            const x1 = fromPoint.x * normWidth * scaleX;
            const y1 = fromPoint.y * normHeight * scaleY;
            const x2 = toPoint.x * normWidth * scaleX;
            const y2 = toPoint.y * normHeight * scaleY;
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

    setCurrentTime(video.currentTime)
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

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
      {/* Smaller video container */}
      <div className={`relative w-full ${isFullscreen ? "h-full max-w-none" : "max-w-2xl mx-auto"} bg-black rounded-lg overflow-hidden`} style={isFullscreen ? { height: "100vh", maxWidth: "none" } : {}}>
        <div className="aspect-video w-full h-full">
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

      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{formatTime(currentTime)}</span>
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
          <span className="text-sm font-medium">{formatTime(duration)}</span>
        </div>

        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.01}
          onValueChange={handleSliderChange}
          className={`w-full ${isFullscreen ? "fullscreen-slider" : ""}`}
          style={isFullscreen ? { background: "linear-gradient(90deg, #fff 0%, #f3f4f6 100%)", borderRadius: "4px" } : {}}
        />

        {isAnalysisComplete && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pose Overlay</span>
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
}
