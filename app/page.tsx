"use client"
import { VideoCapture } from "@/components/video-capture"
import { AnalysisResults } from "@/components/analysis-results"
import { Activity, Target, TrendingUp } from "lucide-react"
import { useState } from "react"
import type { AnalysisResult } from "@/lib/analysis-engine"

export default function HomePage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [videoName, setVideoName] = useState<string>("")

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result)
  }

  const handleReset = () => {
    setAnalysisResult(null)
    setVideoName("")
  }

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 py-12 px-4">
        <AnalysisResults result={analysisResult} videoName={videoName} onReset={handleReset} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            <Activity className="h-4 w-4" />
            AI-Powered Performance Analysis
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-50 leading-tight">
            Perfect Your Swimming Start with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              AI Analysis
            </span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Upload or record your swimming start and get instant feedback powered by advanced pose detection technology.
            Compare your technique to professional swimmers and improve your performance.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-6 space-y-3">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-50">Real-Time Pose Detection</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Advanced AI tracks 17 body keypoints frame-by-frame to analyze your technique with precision.
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-6 space-y-3">
            <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-50">Pro Comparison</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Compare your movements to professional swimmers and identify areas for improvement.
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-6 space-y-3">
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-50">Detailed Feedback</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Get actionable insights on setup, launch, and entry phases with personalized recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Video Capture Section */}
      <section className="container mx-auto px-4 py-12">
        <VideoCapture onAnalysisComplete={handleAnalysisComplete} />
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-slate-800">
        <div className="text-center text-slate-500 text-sm">
          <p>© 2025 AI Swim Start. Powered by TensorFlow.js MoveNet & ChatGPT.</p>
        </div>
      </footer>
    </div>
  )
}
