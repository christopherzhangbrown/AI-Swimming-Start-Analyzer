"use client"

import type { AnalysisResult } from "@/lib/analysis-engine"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, AlertCircle, TrendingUp, RotateCcw, Save, Download } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Line,
  LineChart,
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useState } from "react"
import VideoPlayer from "@/components/video-player"
import { convertToPoseFrame } from "@/lib/analysis-engine"

interface AnalysisResultsProps {
  result: AnalysisResult
  videoName?: string
  onReset: () => void
}

export function AnalysisResults({ result, videoName, onReset }: AnalysisResultsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const phaseChartData = [
    { phase: "Setup", score: result.phaseScores.setup },
    { phase: "Launch", score: result.phaseScores.launch },
    { phase: "Entry", score: result.phaseScores.entry },
  ]

  const angleComparisonData = result.phaseAnalyses.map((analysis) => ({
    phase: analysis.phase.charAt(0).toUpperCase() + analysis.phase.slice(1),
    hip: Math.round(analysis.angles.hip),
    knee: Math.round(analysis.angles.knee),
    shoulder: Math.round(analysis.angles.shoulder),
    elbow: Math.round(analysis.angles.elbow),
  }))

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return {
        label: "Excellent",
        variant: "default" as const,
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      }
    if (score >= 60)
      return {
        label: "Good",
        variant: "secondary" as const,
        className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      }
    return {
      label: "Needs Work",
      variant: "destructive" as const,
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    }
  }

  const handleSave = async () => {
    // TODO: Implement Supabase saving when authentication is set up
    setIsSaving(true)
    
    // For now, just save to local storage
    try {
      const savedAnalyses = JSON.parse(localStorage.getItem('swimAnalyses') || '[]')
      savedAnalyses.push({
        timestamp: Date.now(),
        videoName: videoName || "Untitled Video",
        result: result,
      })
      localStorage.setItem('swimAnalyses', JSON.stringify(savedAnalyses))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving analysis:", error)
      alert("Failed to save analysis. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    const dataStr = JSON.stringify(result, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `swimming-analysis-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const overallBadge = getScoreBadge(result.overallScore)

  return (
    <div className="space-y-6 mx-auto">
      {/* Video Playback with Pose Overlay */}
      {result.videoUrl && result.poseData && (
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-50">Video Analysis with Pose Overlay</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoPlayer
              videoUrl={result.videoUrl}
              poseData={result.poseData.map(fp => convertToPoseFrame([fp])[0])}
              isAnalysisComplete={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Header with Overall Score */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-slate-50">Analysis Complete</CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Your swimming start technique has been analyzed
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || saved}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Analysis"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onReset}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">Overall Score</span>
                <Badge className={overallBadge.className}>{overallBadge.label}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {Math.round(result.overallScore)}
                </span>
                <span className="text-2xl text-slate-500">/100</span>
              </div>
              <Progress value={result.overallScore} className="mt-4 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Scores */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { phase: "Setup", score: result.phaseScores.setup, icon: "🏊" },
          { phase: "Launch", score: result.phaseScores.launch, icon: "🚀" },
          { phase: "Entry", score: result.phaseScores.entry, icon: "💧" },
        ].map(({ phase, score }) => {
          const badge = getScoreBadge(score)
          return (
            <Card key={phase} className="border-slate-800 bg-slate-900/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-50">{phase} Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{Math.round(score)}</span>
                  <Badge className={badge.className}>{badge.label}</Badge>
                </div>
                <Progress value={score} className="h-2" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
            Overview
          </TabsTrigger>
          <TabsTrigger value="phases" className="data-[state=active]:bg-slate-800">
            Phase Breakdown
          </TabsTrigger>
          <TabsTrigger value="angles" className="data-[state=active]:bg-slate-800">
            Body Angles
          </TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-slate-800">
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-50">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  score: {
                    label: "Score",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="phase" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-50">Technical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">{result.technicalAnalysis}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          {result.phaseAnalyses.map((analysis) => (
            <Card key={analysis.phase} className="border-slate-800 bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-50 capitalize">{analysis.phase} Phase</CardTitle>
                  <Badge className={getScoreBadge(analysis.score).className}>{Math.round(analysis.score)}/100</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analysis.angles).map(([joint, angle]) => (
                    <div key={joint} className="space-y-1">
                      <p className="text-sm text-slate-400 capitalize">{joint} Angle</p>
                      <p className="text-2xl font-bold text-slate-50">{Math.round(angle)}°</p>
                      <p
                        className={`text-xs ${Math.abs(analysis.deviations[joint as keyof typeof analysis.deviations]) > 10 ? "text-yellow-400" : "text-emerald-400"}`}
                      >
                        {analysis.deviations[joint as keyof typeof analysis.deviations] > 0 ? "+" : ""}
                        {Math.round(analysis.deviations[joint as keyof typeof analysis.deviations])}° from optimal
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="angles" className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-50">Body Angle Comparison</CardTitle>
              <CardDescription className="text-slate-400">Your body angles across different phases</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  hip: { label: "Hip", color: "#3b82f6" },
                  knee: { label: "Knee", color: "#06b6d4" },
                  shoulder: { label: "Shoulder", color: "#8b5cf6" },
                  elbow: { label: "Elbow", color: "#ec4899" },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={angleComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="phase" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 180]} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                    <Legend />
                    <Line type="monotone" dataKey="hip" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="knee" stroke="#06b6d4" strokeWidth={2} />
                    <Line type="monotone" dataKey="shoulder" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="elbow" stroke="#ec4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">Keep working on your technique!</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-50">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.improvements.length > 0 ? (
                <ul className="space-y-2">
                  {result.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">Great technique! Keep it up!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
