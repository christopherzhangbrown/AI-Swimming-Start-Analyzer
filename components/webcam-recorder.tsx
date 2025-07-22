"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, StopCircle, RotateCcw } from "lucide-react"

interface WebcamRecorderProps {
  onRecordingComplete: (blob: Blob) => void
}

export default function WebcamRecorder({ onRecordingComplete }: WebcamRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [stream, previewUrl])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      })
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Unable to access camera. Please make sure you've granted permission.")
    }
  }

  const startCountdown = () => {
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval)
          startRecording()
          return null
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
  }

  const startRecording = () => {
    if (!stream) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      onRecordingComplete(blob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
    setRecordingTime(0)

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
    }
  }

  const resetRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setRecordingTime(0)
    startCamera()
  }

  useEffect(() => {
    startCamera()
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
        {previewUrl ? (
          <video src={previewUrl} controls className="w-full h-full object-contain" />
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
        )}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <span className="text-6xl font-bold text-white">{countdown}</span>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span>{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {!previewUrl ? (
          isRecording ? (
            <Button onClick={stopRecording} variant="destructive">
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          ) : (
            <Button onClick={startCountdown} className="bg-blue-600 hover:bg-blue-700">
              <Camera className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )
        ) : (
          <Button onClick={resetRecording} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Record Again
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Position yourself so your entire swimming start is visible in the frame
      </p>
    </div>
  )
}
