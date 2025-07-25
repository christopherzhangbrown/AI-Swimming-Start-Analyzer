"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PhaseTimings {
  setupStart: number;
  setupEnd: number;
  launchStart: number;
  launchEnd: number;
  entryStart: number;
  entryEnd: number;
  totalDuration: number;
}

interface PhaseData {
  score: number;
  feedback: string;
  keyPoints: string[];
  duration: number;
}

interface PhaseAnalysis {
  setupScore: number;
  launchScore: number;
  entryScore: number;
  overallScore: number;
  phaseTimings: PhaseTimings;
  phaseBreakdown: {
    setup: PhaseData;
    launch: PhaseData;
    entry: PhaseData;
  };
}

interface PhaseTimelineProps {
  phaseAnalysis: PhaseAnalysis;
  currentTime: number;
  onSeekToPhase: (time: number) => void;
  onLoopPhase: (startTime: number, endTime: number) => void;
}

export function PhaseTimeline({ phaseAnalysis, currentTime, onSeekToPhase, onLoopPhase }: PhaseTimelineProps) {
  const { phaseTimings, phaseBreakdown } = phaseAnalysis;

  // Calculate percentages for timeline segments
  const setupPercent = ((phaseTimings.setupEnd - phaseTimings.setupStart) / phaseTimings.totalDuration) * 100;
  const launchPercent = ((phaseTimings.launchEnd - phaseTimings.launchStart) / phaseTimings.totalDuration) * 100;
  const entryPercent = ((phaseTimings.entryEnd - phaseTimings.entryStart) / phaseTimings.totalDuration) * 100;

  // Determine current phase with debug logging
  const getCurrentPhase = () => {
    // Debug: Log the current time and phase timings
    console.log('Current time:', currentTime);
    console.log('Phase timings:', {
      setup: `${phaseTimings.setupStart} - ${phaseTimings.setupEnd}`,
      launch: `${phaseTimings.launchStart} - ${phaseTimings.launchEnd}`,
      entry: `${phaseTimings.entryStart} - ${phaseTimings.entryEnd}`
    });
    
    // Setup phase: from setupStart to setupEnd
    if (currentTime >= phaseTimings.setupStart && currentTime < phaseTimings.launchStart) {
      console.log('Detected phase: setup');
      return 'setup';
    }
    // Launch phase: from launchStart to entryStart
    if (currentTime >= phaseTimings.launchStart && currentTime < phaseTimings.entryStart) {
      console.log('Detected phase: launch');
      return 'launch';
    }
    // Entry phase: from entryStart to entryEnd
    if (currentTime >= phaseTimings.entryStart && currentTime <= phaseTimings.entryEnd) {
      console.log('Detected phase: entry');
      return 'entry';
    }
    
    // Fallback logic for edge cases
    if (currentTime <= phaseTimings.setupEnd) {
      console.log('Fallback: setup');
      return 'setup';
    }
    if (currentTime <= phaseTimings.launchEnd) {
      console.log('Fallback: launch');
      return 'launch';
    }
    console.log('Fallback: entry');
    return 'entry';
  };

  const currentPhase = getCurrentPhase();

  // Helper function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'bg-green-500';
    if (score >= 7.0) return 'bg-blue-500';
    if (score >= 5.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to get progress bar color (green/orange/red)
  const getProgressBarColor = (score: number) => {
    if (score >= 7.5) return 'bg-green-500';   // High score: green
    if (score >= 5.0) return 'bg-orange-500';  // Medium score: orange
    return 'bg-red-500';                       // Low score: red
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 8.5) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 7.0) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 5.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">{phaseAnalysis.overallScore.toFixed(1)}</div>
          <div className="text-sm opacity-90 mb-3">Overall Score out of 10</div>
          
          {/* Progress bar showing overall score */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(phaseAnalysis.overallScore / 10) * 100}%` }}
            ></div>
          </div>
          
          <div className="text-xs opacity-75">
            {phaseAnalysis.overallScore >= 8.5 ? "Excellent!" : 
             phaseAnalysis.overallScore >= 7.0 ? "Good!" :
             phaseAnalysis.overallScore >= 5.5 ? "Fair" : "Needs Improvement"}
          </div>
        </div>
      </div>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Setup Phase Card */}
        <Card 
          className={`transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-105 ${
            currentPhase === 'setup' ? 'ring-2 ring-green-500 shadow-lg' : ''
          }`}
          onClick={() => onSeekToPhase(phaseTimings.setupStart)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-green-700">Setup Phase</h3>
              <Badge className={getScoreColorClass(phaseBreakdown.setup.score)}>
                {phaseBreakdown.setup.score.toFixed(1)}/10
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              Duration: {phaseBreakdown.setup.duration.toFixed(1)}s
            </div>
            
            {/* Progress bar for setup score */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`${getProgressBarColor(phaseBreakdown.setup.score)} h-2 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${(phaseBreakdown.setup.score / 10) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-sm mb-3">
              {phaseBreakdown.setup.feedback}
            </div>
            
            <div className="space-y-1">
              {phaseBreakdown.setup.keyPoints.slice(0, 2).map((point, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-start">
                  <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  {point}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Launch Phase Card */}
        <Card 
          className={`transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-105 ${
            currentPhase === 'launch' ? 'ring-2 ring-red-500 shadow-lg' : ''
          }`}
          onClick={() => onSeekToPhase(phaseTimings.launchStart)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-red-700">Launch Phase</h3>
              <Badge className={getScoreColorClass(phaseBreakdown.launch.score)}>
                {phaseBreakdown.launch.score.toFixed(1)}/10
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              Duration: {phaseBreakdown.launch.duration.toFixed(1)}s
            </div>
            
            {/* Progress bar for launch score */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`${getProgressBarColor(phaseBreakdown.launch.score)} h-2 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${(phaseBreakdown.launch.score / 10) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-sm mb-3">
              {phaseBreakdown.launch.feedback}
            </div>
            
            <div className="space-y-1">
              {phaseBreakdown.launch.keyPoints.slice(0, 2).map((point, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-start">
                  <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  {point}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Entry Phase Card */}
        <Card 
          className={`transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-105 ${
            currentPhase === 'entry' ? 'ring-2 ring-blue-500 shadow-lg' : ''
          }`}
          onClick={() => onSeekToPhase(phaseTimings.entryStart)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-700">Entry Phase</h3>
              <Badge className={getScoreColorClass(phaseBreakdown.entry.score)}>
                {phaseBreakdown.entry.score.toFixed(1)}/10
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              Duration: {phaseBreakdown.entry.duration.toFixed(1)}s
            </div>
            
            {/* Progress bar for entry score */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`${getProgressBarColor(phaseBreakdown.entry.score)} h-2 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${(phaseBreakdown.entry.score / 10) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-sm mb-3">
              {phaseBreakdown.entry.feedback}
            </div>
            
            <div className="space-y-1">
              {phaseBreakdown.entry.keyPoints.slice(0, 2).map((point, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-start">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  {point}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
