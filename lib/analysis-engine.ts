import { type PoseFrame, analyzePoseData } from "./pose-detection"
import proSwimmerData from "./pro-swimmer-data.json"

// New app's expected interfaces
export interface Keypoint {
  x: number
  y: number
  score: number
  name: string
}

export interface Pose {
  keypoints: Keypoint[]
  score: number
}

export interface FramePose {
  frameNumber: number
  timestamp: number
  pose: Pose
}

export interface PhaseAnalysis {
  phase: "setup" | "launch" | "entry"
  score: number
  angles: {
    hip: number
    knee: number
    shoulder: number
    elbow: number
  }
  deviations: {
    hip: number
    knee: number
    shoulder: number
    elbow: number
  }
}

export interface AnalysisResult {
  overallScore: number
  phaseScores: {
    setup: number
    launch: number
    entry: number
  }
  phaseAnalyses: PhaseAnalysis[]
  strengths: string[]
  improvements: string[]
  technicalAnalysis: string
  poseData: FramePose[]
  videoUrl?: string
  videoFile?: File
}

// Helper function to calculate angle between three points
function calculateAngle(p1: Keypoint, p2: Keypoint, p3: Keypoint): number {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x)
  let angle = Math.abs((radians * 180.0) / Math.PI)

  if (angle > 180.0) {
    angle = 360 - angle
  }

  return angle
}

// Convert your PoseFrame format to the new app's FramePose format
export function convertToFramePose(poseFrames: PoseFrame[]): FramePose[] {
  return poseFrames.map((frame) => ({
    frameNumber: frame.frameId,
    timestamp: frame.timestamp,
    pose: {
      keypoints: Object.entries(frame.keypoints).map(([name, kp]) => ({
        x: kp.x * frame.canvasWidth, // Convert from normalized to pixels
        y: kp.y * frame.canvasHeight,
        score: kp.visibility || 1,
        name: name,
        // Store original canvas dimensions for later recovery
        _canvasWidth: frame.canvasWidth,
        _canvasHeight: frame.canvasHeight
      })),
      score: 0.85, // Average confidence score
      _canvasWidth: frame.canvasWidth, // Store at pose level too
      _canvasHeight: frame.canvasHeight
    }
  }))
}

// Convert FramePose back to your PoseFrame format
export function convertToPoseFrame(framePoses: FramePose[]): PoseFrame[] {
  if (framePoses.length === 0) return []
  
  return framePoses.map((fp, index) => {
    const keypoints: { [key: string]: { x: number; y: number; visibility?: number } } = {}
    
    // Try to get the original canvas dimensions from the stored metadata
    const canvasWidth = (fp.pose as any)._canvasWidth || 
                       (fp.pose.keypoints[0] as any)?._canvasWidth || 
                       512
    const canvasHeight = (fp.pose as any)._canvasHeight || 
                        (fp.pose.keypoints[0] as any)?._canvasHeight || 
                        512
    
    fp.pose.keypoints.forEach(kp => {
      keypoints[kp.name] = {
        x: kp.x / canvasWidth, // Normalize back to 0-1
        y: kp.y / canvasHeight,
        visibility: kp.score
      }
    })
    
    return {
      frameId: fp.frameNumber,
      timestamp: fp.timestamp,
      keypoints,
      canvasWidth,
      canvasHeight
    }
  })
}

function getKeypointByName(pose: Pose, name: string): Keypoint | undefined {
  return pose.keypoints.find((kp) => kp.name === name)
}

function calculateBodyAngles(pose: Pose) {
  const leftShoulder = getKeypointByName(pose, "leftShoulder")
  const rightShoulder = getKeypointByName(pose, "rightShoulder")
  const leftHip = getKeypointByName(pose, "leftHip")
  const rightHip = getKeypointByName(pose, "rightHip")
  const leftKnee = getKeypointByName(pose, "leftKnee")
  const rightKnee = getKeypointByName(pose, "rightKnee")
  const leftAnkle = getKeypointByName(pose, "leftAnkle")
  const rightAnkle = getKeypointByName(pose, "rightAnkle")
  const leftElbow = getKeypointByName(pose, "leftElbow")
  const rightElbow = getKeypointByName(pose, "rightElbow")
  const leftWrist = getKeypointByName(pose, "leftWrist")
  const rightWrist = getKeypointByName(pose, "rightWrist")

  const angles = {
    hip: 0,
    knee: 0,
    shoulder: 0,
    elbow: 0,
  }

  if (leftShoulder && leftHip && leftKnee) {
    angles.hip = calculateAngle(leftShoulder, leftHip, leftKnee)
  } else if (rightShoulder && rightHip && rightKnee) {
    angles.hip = calculateAngle(rightShoulder, rightHip, rightKnee)
  }

  if (leftHip && leftKnee && leftAnkle) {
    angles.knee = calculateAngle(leftHip, leftKnee, leftAnkle)
  } else if (rightHip && rightKnee && rightAnkle) {
    angles.knee = calculateAngle(rightHip, rightKnee, rightAnkle)
  }

  if (leftElbow && leftShoulder && leftHip) {
    angles.shoulder = calculateAngle(leftElbow, leftShoulder, leftHip)
  } else if (rightElbow && rightShoulder && rightHip) {
    angles.shoulder = calculateAngle(rightElbow, rightShoulder, rightHip)
  }

  if (leftShoulder && leftElbow && leftWrist) {
    angles.elbow = calculateAngle(leftShoulder, leftElbow, leftWrist)
  } else if (rightShoulder && rightElbow && rightWrist) {
    angles.elbow = calculateAngle(rightShoulder, rightElbow, rightWrist)
  }

  return angles
}

function identifyPhase(frameNumber: number, totalFrames: number): "setup" | "launch" | "entry" {
  const progress = frameNumber / totalFrames

  if (progress < 0.3) return "setup"
  if (progress < 0.7) return "launch"
  return "entry"
}

function scoreAngle(actual: number, optimal: number, range: { min: number; max: number }): number {
  if (actual >= range.min && actual <= range.max) {
    const deviation = Math.abs(actual - optimal)
    const maxDeviation = Math.max(optimal - range.min, range.max - optimal)
    return Math.max(0, 100 - (deviation / maxDeviation) * 100)
  }
  // If outside range, give partial credit based on how close to range
  const distanceFromRange = Math.min(Math.abs(actual - range.min), Math.abs(actual - range.max))
  return Math.max(0, 50 - distanceFromRange * 2)
}

// Main analysis function that bridges your backend with the new frontend
export async function analyzeSwimmingStart(framePoses: FramePose[]): Promise<AnalysisResult> {
  // Convert to your PoseFrame format for your backend analysis
  const poseFrames = convertToPoseFrame(framePoses)
  
  // Use your existing Gemini AI analysis
  const yourAnalysis = await analyzePoseData(poseFrames)
  
  // Generate phase analyses with angle comparisons to pros
  const phaseAnalyses: PhaseAnalysis[] = []
  const totalFrames = framePoses.length

  const setupFrames = framePoses.filter((fp) => identifyPhase(fp.frameNumber, totalFrames) === "setup")
  const launchFrames = framePoses.filter((fp) => identifyPhase(fp.frameNumber, totalFrames) === "launch")
  const entryFrames = framePoses.filter((fp) => identifyPhase(fp.frameNumber, totalFrames) === "entry")

  const analyzePhase = (frames: FramePose[], phase: "setup" | "launch" | "entry"): PhaseAnalysis => {
    const avgAngles = { hip: 0, knee: 0, shoulder: 0, elbow: 0 }

    frames.forEach((frame) => {
      const angles = calculateBodyAngles(frame.pose)
      avgAngles.hip += angles.hip
      avgAngles.knee += angles.knee
      avgAngles.shoulder += angles.shoulder
      avgAngles.elbow += angles.elbow
    })

    if (frames.length > 0) {
      avgAngles.hip /= frames.length
      avgAngles.knee /= frames.length
      avgAngles.shoulder /= frames.length
      avgAngles.elbow /= frames.length
    }

    const proData = proSwimmerData.phases[phase].keyAngles
    const optimalRanges = proSwimmerData.optimalRanges

    const scores = {
      hip: scoreAngle(avgAngles.hip, proData.hipAngle, optimalRanges.hipAngle),
      knee: scoreAngle(avgAngles.knee, proData.kneeAngle, optimalRanges.kneeAngle),
      shoulder: scoreAngle(avgAngles.shoulder, proData.shoulderAngle, optimalRanges.shoulderAngle),
      elbow: scoreAngle(avgAngles.elbow, proData.elbowAngle, optimalRanges.elbowAngle),
    }

    const phaseScore = (scores.hip + scores.knee + scores.shoulder + scores.elbow) / 4

    return {
      phase,
      score: phaseScore,
      angles: avgAngles,
      deviations: {
        hip: avgAngles.hip - proData.hipAngle,
        knee: avgAngles.knee - proData.kneeAngle,
        shoulder: avgAngles.shoulder - proData.shoulderAngle,
        elbow: avgAngles.elbow - proData.elbowAngle,
      },
    }
  }

  const setupAnalysis = analyzePhase(setupFrames, "setup")
  const launchAnalysis = analyzePhase(launchFrames, "launch")
  const entryAnalysis = analyzePhase(entryFrames, "entry")

  phaseAnalyses.push(setupAnalysis, launchAnalysis, entryAnalysis)

  // Use phase scores or fall back to your analysis scores
  const phaseScores = {
    setup: yourAnalysis.phaseAnalysis?.setupScore || setupAnalysis.score,
    launch: yourAnalysis.phaseAnalysis?.launchScore || launchAnalysis.score,
    entry: yourAnalysis.phaseAnalysis?.entryScore || entryAnalysis.score,
  }

  // Calculate overall score (weighted average)
  const overallScore = (phaseScores.setup * 0.25 + phaseScores.launch * 0.5 + phaseScores.entry * 0.25)

  // Combine strengths and improvements from your analysis and pro comparison
  const strengths: string[] = [...yourAnalysis.strengths]
  const improvements: string[] = [...yourAnalysis.improvements]

  // Add pro comparison insights
  if (setupAnalysis.score >= 80) strengths.push("Setup position matches pro swimmers")
  else if (setupAnalysis.score < 60) improvements.push("Work on setup - your angles differ significantly from pros")

  if (launchAnalysis.score >= 80) strengths.push("Launch power comparable to professional swimmers")
  else if (launchAnalysis.score < 60) improvements.push("Improve launch explosiveness - compare to pro technique")

  if (entryAnalysis.score >= 80) strengths.push("Entry streamline matches professional standards")
  else if (entryAnalysis.score < 60) improvements.push("Refine entry - study pro swimmer streamline position")

  // Enhanced technical analysis
  let technicalAnalysis = yourAnalysis.technicalAnalysis + "\n\n"
  technicalAnalysis += `Pro Comparison: `
  
  if (Math.abs(setupAnalysis.deviations.hip) > 10) {
    technicalAnalysis += `Your setup hip angle (${Math.round(setupAnalysis.angles.hip)}°) is ${Math.abs(Math.round(setupAnalysis.deviations.hip))}° ${setupAnalysis.deviations.hip > 0 ? "more open" : "more closed"} than pros (${proSwimmerData.phases.setup.keyAngles.hipAngle}°). `
  }

  if (Math.abs(launchAnalysis.deviations.knee) > 10) {
    technicalAnalysis += `Your launch knee extension (${Math.round(launchAnalysis.angles.knee)}°) differs by ${Math.abs(Math.round(launchAnalysis.deviations.knee))}° from pros (${proSwimmerData.phases.launch.keyAngles.kneeAngle}°). `
  }

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    phaseScores: {
      setup: Math.round(phaseScores.setup * 10) / 10,
      launch: Math.round(phaseScores.launch * 10) / 10,
      entry: Math.round(phaseScores.entry * 10) / 10,
    },
    phaseAnalyses,
    strengths: [...new Set(strengths)], // Remove duplicates
    improvements: [...new Set(improvements)],
    technicalAnalysis,
    poseData: framePoses,
  }
}
