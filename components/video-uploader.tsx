"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileVideo } from "lucide-react"

interface VideoUploaderProps {
  onVideoUploaded: (file: File) => void
}

export default function VideoUploader({ onVideoUploaded }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("video/")) {
        onVideoUploaded(file)
      } else {
        alert("Please upload a video file.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onVideoUploaded(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <FileVideo className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mb-2">Upload your swimming start video</h3>
      <p className="text-sm text-gray-500 text-center mb-6">Drag and drop your video file here, or click to browse</p>
      <Button onClick={handleButtonClick} className="bg-blue-600 hover:bg-blue-700">
        <Upload className="mr-2 h-4 w-4" />
        Select Video
      </Button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
      <p className="text-xs text-gray-500 mt-4">Supported formats: MP4, MOV, WEBM (Max size: 100MB)</p>
    </div>
  )
}
