"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Camera, Loader2, RotateCcw } from "lucide-react"
import Link from "next/link"
import VideoUploader from "@/components/video-uploader"
import WebcamRecorder from "@/components/webcam-recorder"
import VideoPlayer, { VideoPlayerRef } from "@/components/video-player"
import FeedbackDisplay from "@/components/feedback-display"
import { detectPosesInVideo, analyzePoseData } from "@/utils/pose-analysis"

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [poseData, setPoseData] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const videoPlayerRef = useRef<VideoPlayerRef>(null)

  const handleVideoUpload = (file: File) => {
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setAnalysisComplete(false)
    setPoseData([])
    setFeedback(null)
  }

  const handleWebcamRecording = (blob: Blob) => {
    const file = new File([blob], "webcam-recording.webm", { type: "video/webm" })
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setAnalysisComplete(false)
    setPoseData([])
    setFeedback(null)
  }

  const analyzeVideo = async () => {
    if (!videoFile) return

    setIsAnalyzing(true)

    try {
      // Use the real pose detection - matching your Python implementation
      const poseFrames = await detectPosesInVideo(videoFile)
      setPoseData(poseFrames)

      if (poseFrames.length === 0) {
        throw new Error("No pose data detected - ensure swimmer is clearly visible")
      }

      // Convert to the format expected by your Python logic
      const poseSequence = poseFrames.map((frame) => frame.keypoints)

      // Call the API to get Gemini feedback
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ poseSequence }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze video")
      }

      const { feedback } = await response.json()

      // Analyze the pose data locally as well
      const localAnalysis = await analyzePoseData(poseFrames)

      // Combine Gemini feedback with local analysis
      const combinedFeedback = {
        ...localAnalysis,
        summary: feedback.summary || localAnalysis.summary,
        strengths: [...(feedback.strengths || []), ...(localAnalysis.strengths || [])],
        improvements: [...(feedback.improvements || []), ...(localAnalysis.improvements || [])],
        technicalAnalysis: feedback.technicalAnalysis || localAnalysis.technicalAnalysis,
        geminiFeedback: feedback.rawFeedback,
      }

      setFeedback(combinedFeedback)
      setAnalysisComplete(true)
    } catch (error) {
      console.error("Error analyzing video:", error)

      setFeedback({
        overallScore: 0,
        summary: "Unable to analyze video. Please try again with a clearer video.",
        strengths: [],
        improvements: [
          "Ensure the swimmer is clearly visible throughout the video",
          "Use good lighting conditions",
          "Keep the camera steady during recording",
          "Make sure the entire swimming start is captured in frame",
        ],
        technicalAnalysis: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try uploading a different video or check your internet connection.`,
      })
      setAnalysisComplete(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Phase navigation handlers
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handleSeekToPhase = (time: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekToTime(time)
    }
  }

  const handleLoopPhase = (startTime: number, endTime: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.startLooping(startTime, endTime)
    }
  }

  const generateMockPoseData = () => {
    // This would be replaced with actual pose detection data
    const frameCount = 60
    const data = []

    for (let i = 0; i < frameCount; i++) {
      data.push({
        frameId: i,
        timestamp: i / 30, // Assuming 30fps
        keypoints: {
          nose: { x: 320 + Math.sin(i / 10) * 5, y: 100 + i * 2 },
          leftShoulder: { x: 300 + Math.sin(i / 10) * 3, y: 130 + i * 2 },
          rightShoulder: { x: 340 + Math.sin(i / 10) * 3, y: 130 + i * 2 },
          leftElbow: { x: 290 + Math.sin(i / 8) * 10, y: 160 + i * 2 },
          rightElbow: { x: 350 + Math.sin(i / 8) * 10, y: 160 + i * 2 },
          leftWrist: { x: 285 + Math.sin(i / 6) * 15, y: 190 + i * 2 },
          rightWrist: { x: 355 + Math.sin(i / 6) * 15, y: 190 + i * 2 },
          leftHip: { x: 310 + Math.sin(i / 12) * 2, y: 200 + i * 2 },
          rightHip: { x: 330 + Math.sin(i / 12) * 2, y: 200 + i * 2 },
          leftKnee: { x: 305 + Math.sin(i / 5) * 8, y: 250 + i * 2 },
          rightKnee: { x: 335 + Math.sin(i / 5) * 8, y: 250 + i * 2 },
          leftAnkle: { x: 300 + Math.sin(i / 4) * 12, y: 300 + i * 2 },
          rightAnkle: { x: 340 + Math.sin(i / 4) * 12, y: 300 + i * 2 },
        },
      })
    }

    return data
  }

  const resetAnalysis = () => {
    setVideoFile(null)
    setVideoUrl(null)
    setAnalysisComplete(false)
    setPoseData([])
    setFeedback(null)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-blue-600">
              SwimStart
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/analyze" className="text-sm font-medium">
              Analyze
            </Link>
            <Link href="/about" className="text-sm font-medium">
              About
            </Link>
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-8">
        <h1 className="text-3xl font-bold mb-6">Analyze Your Swimming Start</h1>

        {!videoUrl ? (
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Video
                  </TabsTrigger>
                  <TabsTrigger value="record" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Record Video
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-0">
                  <VideoUploader onVideoUploaded={handleVideoUpload} />
                </TabsContent>
                <TabsContent value="record" className="mt-0">
                  <WebcamRecorder onRecordingComplete={handleWebcamRecording} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <VideoPlayer 
                  ref={videoPlayerRef}
                  videoUrl={videoUrl} 
                  poseData={poseData} 
                  isAnalysisComplete={analysisComplete}
                  onTimeUpdate={handleTimeUpdate}
                  phaseAnalysis={feedback?.phaseAnalysis}
                />
              </CardContent>
            </Card>

            <div className="w-full">
              {!analysisComplete ? (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-lg font-medium">Analyzing your swimming start...</p>
                        <p className="text-sm text-gray-500 text-center">
                          Our AI is detecting your body position and analyzing your technique. This may take a moment.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-4">
                          <Button onClick={analyzeVideo} className="bg-blue-600 hover:bg-blue-700">
                            Analyze Video
                          </Button>
                          <Button onClick={resetAnalysis} variant="outline">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 text-center max-w-md">
                          Click "Analyze Video" to process your swimming start and receive personalized feedback.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <FeedbackDisplay 
                  feedback={feedback} 
                  currentTime={currentTime}
                  onSeekToPhase={handleSeekToPhase}
                  onLoopPhase={handleLoopPhase}
                  onReset={resetAnalysis} 
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">© 2024 SwimStart. All rights reserved.</p>
          </div>
          <nav className="flex items-center justify-center gap-4 md:justify-end">
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Terms
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
