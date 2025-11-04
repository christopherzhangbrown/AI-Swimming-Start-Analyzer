"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Video, X, Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import { analyzePosesInVideo } from "@/lib/pose-detection"
import { analyzeSwimmingStart, type AnalysisResult, convertToFramePose } from "@/lib/analysis-engine"
import { Progress } from "@/components/ui/progress"

type CaptureMode = "upload" | "record" | null

interface VideoAnalysisProps {
  onAnalysisComplete?: (result: AnalysisResult) => void
}

export function VideoCapture({ onAnalysisComplete }: VideoAnalysisProps) {
  const [mode, setMode] = useState<CaptureMode>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setMode("upload")
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      })
      setStream(mediaStream)
      setMode("record")
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Error accessing webcam:", err)
      alert("Could not access webcam. Please check permissions.")
    }
  }

  const startRecording = () => {
    if (!stream) return

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm",
    })

    mediaRecorderRef.current = mediaRecorder
    const chunks: Blob[] = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setVideoFile(new File([blob], "recorded-video.webm", { type: "video/webm" }))

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }

    mediaRecorder.start()
    setIsRecording(true)
    setRecordedChunks(chunks)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    setMode(null)
    setVideoFile(null)
    setVideoUrl(null)
    setIsRecording(false)
    setRecordedChunks([])
    setStream(null)
    setIsAnalyzing(false)
    setAnalysisProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAnalyze = async () => {
    if (!videoFile || !videoRef.current) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Use your real pose detection
      const poseFrames = await analyzePosesInVideo(videoRef.current, (progress) => {
        setAnalysisProgress(progress * 100)
      })

      // Convert to FramePose format for analysis
      const framePoses = convertToFramePose(poseFrames)

      // Analyze with your backend + pro comparison
      const result = await analyzeSwimmingStart(framePoses)

      if (onAnalysisComplete) {
        // Include video URL and file for playback with pose overlay
        onAnalysisComplete({
          ...result,
          videoUrl: videoUrl || undefined,
          videoFile: videoFile || undefined
        })
      }
    } catch (error) {
      console.error("Error analyzing video:", error)
      alert("Error analyzing video. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (mode === null) {
    return (
      <Card className="max-w-4xl mx-auto border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardContent className="p-12">
          <h2 className="text-2xl font-bold text-slate-50 text-center mb-8">Get Started with Your Analysis</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Option */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-slate-800/50 transition-all">
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4 group-hover:text-blue-400 transition-colors" />
                <h3 className="text-lg font-semibold text-slate-50 mb-2">Upload Video</h3>
                <p className="text-sm text-slate-400 mb-4">Drag and drop or click to select</p>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent">
                  Choose File
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileInput} className="hidden" />
            </div>

            {/* Record Option */}
            <div className="relative group cursor-pointer" onClick={startWebcam}>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-cyan-500 hover:bg-slate-800/50 transition-all">
                <Video className="h-12 w-12 text-slate-400 mx-auto mb-4 group-hover:text-cyan-400 transition-colors" />
                <h3 className="text-lg font-semibold text-slate-50 mb-2">Record Video</h3>
                <p className="text-sm text-slate-400 mb-4">Use your webcam to record</p>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent">
                  Start Recording
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-50">{mode === "upload" ? "Uploaded Video" : "Recording"}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            className="text-slate-400 hover:text-slate-50 hover:bg-slate-800"
            disabled={isAnalyzing}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            src={videoUrl || undefined}
            autoPlay={mode === "record"}
            muted
            playsInline
            controls={mode === "upload" && videoUrl !== null}
            className="w-full aspect-video"
          />
        </div>

        {isAnalyzing && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Analyzing video...</span>
              <span className="text-blue-400 font-medium">{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {mode === "record" && !videoUrl && (
            <div className="flex gap-2 flex-1">
              {!isRecording ? (
                <Button onClick={startRecording} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>
          )}

          {videoUrl && (
            <>
              <Button
                variant="outline"
                onClick={reset}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
                disabled={isAnalyzing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleAnalyze}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Start Technique"
                )}
              </Button>
            </>
          )}
        </div>

        {videoFile && !isAnalyzing && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">
              <span className="font-medium text-slate-300">File:</span> {videoFile.name}
            </p>
            <p className="text-sm text-slate-400">
              <span className="font-medium text-slate-300">Size:</span> {(videoFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
