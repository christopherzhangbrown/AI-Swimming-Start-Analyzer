"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, RotateCcw, Download } from "lucide-react"

interface FeedbackDisplayProps {
  feedback: {
    overallScore: number
    summary: string
    strengths: string[]
    improvements: string[]
    technicalAnalysis: string
    metrics?: {
      reactionTime: number
      entryAngle: number
      streamlinePosition: number
      bodyAlignment: number
    }
    geminiFeedback?: string
  } | null
  onReset: () => void
}

export default function FeedbackDisplay({ feedback, onReset }: FeedbackDisplayProps) {
  if (!feedback) return null

  return (
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-sm font-medium">{feedback.overallScore}/10</span>
            </div>
            <Progress value={feedback.overallScore * 10} className="h-2" />
          </div>

          {/* Add metrics display if available */}
          {feedback.metrics && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{feedback.metrics.entryAngle.toFixed(1)}°</div>
                <div className="text-sm text-gray-600">Entry Angle</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {feedback.metrics.streamlinePosition.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Streamline Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{feedback.metrics.bodyAlignment.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Body Alignment</div>
              </div>
            </div>
          )}

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
  )
}
