"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, RotateCcw, Download, Target, Zap, Waves } from "lucide-react"

import { PhaseTimeline } from "./phase-timeline"

interface FeedbackDisplayProps {
  feedback: {
    overallScore: number
    summary: string
    strengths: string[]
    improvements: string[]
    technicalAnalysis: string
    setupScore?: number
    launchScore?: number
    entryScore?: number
    phaseAnalysis?: {
      setupScore: number
      launchScore: number
      entryScore: number
      overallScore: number
      phaseTimings?: {
        setupStart: number
        setupEnd: number
        launchStart: number
        launchEnd: number
        entryStart: number
        entryEnd: number
        totalDuration: number
      }
      phaseBreakdown: {
        setup: {
          score: number
          feedback: string
          keyPoints: string[]
          duration?: number
        }
        launch: {
          score: number
          feedback: string
          keyPoints: string[]
          duration?: number
        }
        entry: {
          score: number
          feedback: string
          keyPoints: string[]
          duration?: number
        }
      }
    }
    metrics?: {
      reactionTime: number
      entryAngle: number
      streamlinePosition: number
      bodyAlignment: number
    }
    geminiFeedback?: string
  } | null
  currentTime?: number
  onSeekToPhase?: (time: number) => void
  onLoopPhase?: (startTime: number, endTime: number) => void
  onReset: () => void
}

// Helper functions for score styling
function getScoreColor(score: number): string {
  if (score >= 8.5) return "text-green-600";
  if (score >= 7.0) return "text-blue-600";
  if (score >= 5.5) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBarColor(score: number): string {
  if (score >= 8.5) return "bg-green-500";
  if (score >= 7.0) return "bg-blue-500";
  if (score >= 5.5) return "bg-yellow-500";
  return "bg-red-500";
}

export default function FeedbackDisplay({ feedback, currentTime = 0, onSeekToPhase, onLoopPhase, onReset }: FeedbackDisplayProps) {
  if (!feedback) return null

  return (
    <div className="space-y-6">
      {/* Phase Timeline - Show if we have phase analysis with timing data */}
      {feedback.phaseAnalysis && feedback.phaseAnalysis.phaseTimings && onSeekToPhase && onLoopPhase && (
        <PhaseTimeline
          phaseAnalysis={feedback.phaseAnalysis as any}
          currentTime={currentTime}
          onSeekToPhase={onSeekToPhase}
          onLoopPhase={onLoopPhase}
        />
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Swimming Start Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Save Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Display overall score prominently */}
          <div className="grid grid-cols-1 gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold">{(feedback.phaseAnalysis?.overallScore || feedback.overallScore).toFixed(1)}</div>
              <div className="text-sm opacity-90 mb-3">Overall Score out of 10</div>
              
              {/* Progress bar showing score */}
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((feedback.phaseAnalysis?.overallScore || feedback.overallScore) / 10) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-xs opacity-75">
                {(feedback.phaseAnalysis?.overallScore || feedback.overallScore) >= 8.5 ? "Excellent!" : 
                 (feedback.phaseAnalysis?.overallScore || feedback.overallScore) >= 7.0 ? "Good!" :
                 (feedback.phaseAnalysis?.overallScore || feedback.overallScore) >= 5.5 ? "Fair" : "Needs Improvement"}
              </div>
            </div>
          </div>

          {feedback.geminiFeedback && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">AI Coach Feedback</h3>
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-blue-800 font-medium">{feedback.geminiFeedback}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Summary</h3>
            <p className="text-gray-600">{feedback.summary}</p>
          </div>

          <Tabs defaultValue="strengths">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
              <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="strengths" className="pt-4">
              <ul className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="improvements" className="pt-4">
              <ul className="space-y-2">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="technical" className="pt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">{feedback.technicalAnalysis}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
