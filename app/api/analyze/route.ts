import { NextResponse } from "next/server"

interface PhaseAnalysis {
  setupScore: number;
  launchScore: number;
  entryScore: number;
  overallScore: number;
  phaseTimings: {
    setupStart: number;
    setupEnd: number;
    launchStart: number;
    launchEnd: number;
    entryStart: number;
    entryEnd: number;
    totalDuration: number;
  };
  phaseBreakdown: {
    setup: {
      score: number;
      feedback: string;
      keyPoints: string[];
      duration: number;
    };
    launch: {
      score: number;
      feedback: string;
      keyPoints: string[];
      duration: number;
    };
    entry: {
      score: number;
      feedback: string;
      keyPoints: string[];
      duration: number;
    };
  };
}

function analyzeSwimmingPhases(poseData: any[]): PhaseAnalysis {
  const totalFrames = poseData.length;
  
  if (totalFrames < 3) {
    // Not enough frames for proper analysis
    return getDefaultPhaseAnalysis();
  }
  
  // Detect actual phase boundaries based on movement patterns
  const phaseBreakpoints = detectMovementPhases(poseData);
  
  const setupFrames = poseData.slice(0, phaseBreakpoints.launchStart);
  const launchFrames = poseData.slice(phaseBreakpoints.launchStart, phaseBreakpoints.entryStart);
  const entryFrames = poseData.slice(phaseBreakpoints.entryStart);
  
  // Calculate timing information (assuming 15 FPS)
  const frameRate = 15;
  const setupDuration = setupFrames.length / frameRate;
  const launchDuration = launchFrames.length / frameRate;
  const entryDuration = entryFrames.length / frameRate;
  const totalDuration = totalFrames / frameRate;
  
  // Analyze each phase
  const setupAnalysis = analyzeSetupPhase(setupFrames);
  const launchAnalysis = analyzeLaunchPhase(launchFrames);
  const entryAnalysis = analyzeEntryPhase(entryFrames);
  
  // Calculate weighted overall score
  const overallScore = (
    setupAnalysis.score * 0.25 +    // 25% weight
    launchAnalysis.score * 0.5 +     // 50% weight (most important)
    entryAnalysis.score * 0.25       // 25% weight
  );
  
  return {
    setupScore: setupAnalysis.score,
    launchScore: launchAnalysis.score,
    entryScore: entryAnalysis.score,
    overallScore: Math.round(overallScore * 10) / 10,
    phaseTimings: {
      setupStart: 0,
      setupEnd: phaseBreakpoints.launchStart / frameRate,
      launchStart: phaseBreakpoints.launchStart / frameRate,
      launchEnd: phaseBreakpoints.entryStart / frameRate,
      entryStart: phaseBreakpoints.entryStart / frameRate,
      entryEnd: totalDuration,
      totalDuration: totalDuration
    },
    phaseBreakdown: {
      setup: {
        ...setupAnalysis,
        duration: setupDuration
      },
      launch: {
        ...launchAnalysis,
        duration: launchDuration
      },
      entry: {
        ...entryAnalysis,
        duration: entryDuration
      }
    }
  };
}

function getDefaultPhaseAnalysis(): PhaseAnalysis {
  return {
    setupScore: 6.0,
    launchScore: 6.0,
    entryScore: 6.0,
    overallScore: 6.0,
    phaseTimings: {
      setupStart: 0,
      setupEnd: 1.0,
      launchStart: 1.0,
      launchEnd: 2.0,
      entryStart: 2.0,
      entryEnd: 3.0,
      totalDuration: 3.0
    },
    phaseBreakdown: {
      setup: {
        score: 6.0,
        feedback: "Not enough data for setup analysis",
        keyPoints: ["Try recording a longer video"],
        duration: 1.0
      },
      launch: {
        score: 6.0,
        feedback: "Not enough data for launch analysis",
        keyPoints: ["Ensure explosive movement is captured"],
        duration: 1.0
      },
      entry: {
        score: 6.0,
        feedback: "Not enough data for entry analysis",
        keyPoints: ["Include water entry in video"],
        duration: 1.0
      }
    }
  };
}

function detectMovementPhases(poseData: any[]): { launchStart: number; entryStart: number } {
  const movements = calculateHorizontalMovements(poseData);
  const waterEntryFrame = detectWaterEntry(poseData);
  
  // Find the first significant horizontal movement (launch start)
  const launchStart = findLaunchStart(movements);
  
  // Entry starts when hands enter water, or if not detected, use significant forward movement decline
  const entryStart = waterEntryFrame !== -1 ? waterEntryFrame : findEntryStart(movements, launchStart);
  
  return {
    launchStart: Math.max(1, launchStart), // Ensure at least 1 frame for setup
    entryStart: Math.min(poseData.length - 1, entryStart) // Ensure at least 1 frame for entry
  };
}

function calculateHorizontalMovements(poseData: any[]): number[] {
  const movements: number[] = [0]; // First frame has no movement
  
  for (let i = 1; i < poseData.length; i++) {
    const prevFrame = poseData[i - 1];
    const currFrame = poseData[i];
    
    let horizontalMovement = 0;
    let validJoints = 0;
    
    // Calculate horizontal movement for key body points
    const keyJoints = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];
    
    keyJoints.forEach(joint => {
      // Access the joint data from the keypoints property
      if (prevFrame.keypoints && currFrame.keypoints && 
          prevFrame.keypoints[joint] && currFrame.keypoints[joint]) {
        const dx = currFrame.keypoints[joint].x - prevFrame.keypoints[joint].x;
        horizontalMovement += Math.abs(dx);
        validJoints++;
      }
    });
    
    const avgHorizontalMovement = validJoints > 0 ? horizontalMovement / validJoints : 0;
    movements.push(avgHorizontalMovement);
  }
  
  return movements;
}

function findLaunchStart(movements: number[]): number {
  // More aggressive thresholds for better accuracy
  const baseThreshold = 0.04; // Higher base threshold
  const spikeThreshold = 0.06; // Much higher spike threshold  
  const consecutiveFrames = 4; // More frames needed
  const smoothingWindow = 3; // Smooth out noise
  
  // Smooth the movement data to reduce noise
  const smoothedMovements: number[] = [];
  for (let i = 0; i < movements.length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - smoothingWindow); j <= Math.min(movements.length - 1, i + smoothingWindow); j++) {
      sum += movements[j];
      count++;
    }
    
    smoothedMovements.push(sum / count);
  }
  
  // Look for significant movement spikes first (explosive launch)
  for (let i = 1; i < smoothedMovements.length; i++) {
    if (smoothedMovements[i] > spikeThreshold) {
      // Verify this is a true spike by checking it's much higher than previous frames
      const recentAvg = smoothedMovements.slice(Math.max(0, i - 3), i)
        .reduce((sum, val) => sum + val, 0) / Math.min(3, i);
      
      if (smoothedMovements[i] > recentAvg * 2.5) {
        console.log(`Found explosive launch at frame ${i}, movement: ${smoothedMovements[i].toFixed(4)}, avg before: ${recentAvg.toFixed(4)}`);
        return Math.max(1, i);
      }
    }
  }
  
  // Fallback: look for sustained movement pattern
  for (let i = 1; i < smoothedMovements.length - consecutiveFrames; i++) {
    let sustainedMovement = 0;
    let totalMovement = 0;
    
    for (let j = 0; j < consecutiveFrames; j++) {
      if (smoothedMovements[i + j] > baseThreshold) {
        sustainedMovement++;
        totalMovement += smoothedMovements[i + j];
      }
    }
    
    const avgMovement = totalMovement / consecutiveFrames;
    if (sustainedMovement >= consecutiveFrames && avgMovement > baseThreshold * 1.8) {
      console.log(`Found sustained launch at frame ${i}, avg movement: ${avgMovement.toFixed(4)}`);
      return Math.max(1, i);
    }
  }
  
  // Final fallback: use maximum movement but ensure it's significant
  const maxMovement = Math.max(...smoothedMovements);
  if (maxMovement > baseThreshold) {
    const maxIndex = smoothedMovements.indexOf(maxMovement);
    console.log(`Using max movement at frame ${maxIndex}, movement: ${maxMovement.toFixed(4)}`);
    return Math.max(1, maxIndex);
  }
  
  // If no significant movement detected, return 1/3 through the video
  console.log('No significant movement detected, using fallback timing');
  return Math.max(1, Math.floor(movements.length * 0.33));
}

function detectWaterEntry(poseData: any[]): number {
  // Look for water entry indicators:
  // 1. Hands (wrists) suddenly disappear or move to bottom of frame
  // 2. Head (nose) moves to bottom portion of frame
  // 3. Sudden change in body visibility
  
  for (let i = 1; i < poseData.length; i++) {
    const frame = poseData[i];
    const prevFrame = poseData[i - 1];
    
    // Check if hands entered water (wrists suddenly at bottom or disappeared)
    const handsEnteredWater = checkHandsWaterEntry(prevFrame, frame);
    
    // Check if head is moving toward water
    const headMovingDown = checkHeadWaterEntry(prevFrame, frame);
    
    // Check for sudden visibility change (entering water)
    const visibilityChange = checkVisibilityChange(prevFrame, frame);
    
    if (handsEnteredWater || (headMovingDown && visibilityChange)) {
      return i;
    }
  }
  
  return -1; // No water entry detected
}

function findEntryStart(movements: number[], launchStart: number): number {
  // Look for the point where movement starts to decrease after peak (body becoming streamlined)
  const postLaunchMovements = movements.slice(launchStart);
  
  if (postLaunchMovements.length < 3) {
    return Math.min(movements.length - 1, launchStart + 1);
  }
  
  // Find the peak movement after launch
  const maxMovementIndex = postLaunchMovements.indexOf(Math.max(...postLaunchMovements));
  const peakFrame = launchStart + maxMovementIndex;
  
  // Look for significant decrease in movement after peak (streamlining phase)
  for (let i = maxMovementIndex + 1; i < postLaunchMovements.length - 2; i++) {
    const currentMovement = postLaunchMovements[i];
    const peakMovement = postLaunchMovements[maxMovementIndex];
    
    // Entry phase starts when movement drops to 40% of peak movement
    if (currentMovement < peakMovement * 0.4) {
      console.log(`Found entry start at frame ${launchStart + i}, movement dropped to ${currentMovement.toFixed(4)} from peak ${peakMovement.toFixed(4)}`);
      return launchStart + i;
    }
  }
  
  // Fallback: entry starts at 70% through the post-launch phase
  const entryStartRelative = Math.floor(postLaunchMovements.length * 0.7);
  const entryFrame = Math.min(movements.length - 1, launchStart + entryStartRelative);
  
  console.log(`Using fallback entry timing at frame ${entryFrame}`);
  return entryFrame;
}

function checkHandsWaterEntry(prevFrame: any, currFrame: any): boolean {
  const hands = ['left_wrist', 'right_wrist'];
  
  for (const hand of hands) {
    if (prevFrame.keypoints && currFrame.keypoints &&
        prevFrame.keypoints[hand] && currFrame.keypoints[hand]) {
      // Check if hand moved significantly downward (toward water)
      const verticalMovement = currFrame.keypoints[hand].y - prevFrame.keypoints[hand].y;
      
      // Check if hand is now in bottom 20% of frame (likely in water)
      const isInWaterRegion = currFrame.keypoints[hand].y > 0.8;
      
      if (verticalMovement > 0.15 || isInWaterRegion) {
        return true;
      }
    } else if (prevFrame.keypoints && prevFrame.keypoints[hand] && 
               (!currFrame.keypoints || !currFrame.keypoints[hand])) {
      // Hand disappeared (entered water and pose detection lost it)
      return true;
    }
  }
  
  return false;
}

function checkHeadWaterEntry(prevFrame: any, currFrame: any): boolean {
  if (prevFrame.keypoints && currFrame.keypoints &&
      prevFrame.keypoints.nose && currFrame.keypoints.nose) {
    const verticalMovement = currFrame.keypoints.nose.y - prevFrame.keypoints.nose.y;
    const isInLowerHalf = currFrame.keypoints.nose.y > 0.6;
    
    // Head moving down significantly and in lower portion of frame
    return verticalMovement > 0.1 && isInLowerHalf;
  }
  
  return false;
}

function checkVisibilityChange(prevFrame: any, currFrame: any): boolean {
  const prevVisibility = prevFrame.hasFullBody ? 1 : 0;
  const currVisibility = currFrame.hasFullBody ? 1 : 0;
  
  // Sudden loss of visibility could indicate water entry
  return prevVisibility > currVisibility;
}

function analyzeSetupPhase(frames: any[]): { score: number; feedback: string; keyPoints: string[] } {
  if (frames.length === 0) {
    return {
      score: 6.0,
      feedback: "Setup phase too short to analyze properly",
      keyPoints: ["Try holding starting position longer"]
    };
  }
  
  let score = 6.0; // Base score
  const keyPoints: string[] = [];
  
  // Analyze starting position stability
  const positions = frames.map(frame => ({
    shoulderWidth: frame.hasFullBody && frame.posture ? 0.15 : 0.1,
    headPosition: frame.posture === 'upright' ? 0.8 : 0.6
  }));
  
  // Check for good ready position
  if (frames.some(f => f.posture === 'upright')) {
    score += 1.5;
    keyPoints.push("Good ready position detected");
  } else {
    keyPoints.push("Work on achieving optimal starting position");
  }
  
  // Check for stability
  if (frames.length > 3) {
    score += 1.0;
    keyPoints.push("Good stability in setup phase");
  } else {
    keyPoints.push("Hold starting position longer for better stability");
  }
  
  // Bonus for full body visibility
  if (frames.some(f => f.hasFullBody)) {
    score += 0.5;
    keyPoints.push("Excellent body positioning visibility");
  }
  
  return {
    score: Math.min(score, 10.0),
    feedback: generateSetupFeedback(score),
    keyPoints
  };
}

function analyzeLaunchPhase(frames: any[]): { score: number; feedback: string; keyPoints: string[] } {
  if (frames.length === 0) {
    return {
      score: 6.0,
      feedback: "Launch phase not detected",
      keyPoints: ["Ensure explosive movement is captured in video"]
    };
  }
  
  let score = 6.0; // Base score
  const keyPoints: string[] = [];
  
  // Analyze movement progression
  const movements = frames.map(f => f.movement || 0);
  const maxMovement = Math.max(...movements);
  const avgMovement = movements.reduce((sum, m) => sum + m, 0) / movements.length;
  
  // Score explosive power
  if (maxMovement > 0.02) {
    score += 2.0;
    keyPoints.push("Excellent explosive power detected");
  } else if (maxMovement > 0.015) {
    score += 1.5;
    keyPoints.push("Good explosive drive from blocks");
  } else if (maxMovement > 0.01) {
    score += 1.0;
    keyPoints.push("Moderate power in launch");
  } else {
    keyPoints.push("Focus on more explosive push-off from blocks");
  }
  
  // Check for transitioning posture (shows movement)
  if (frames.some(f => f.posture === 'transitioning')) {
    score += 1.0;
    keyPoints.push("Good transition from setup to launch");
  }
  
  // Bonus for consistent movement progression
  if (avgMovement > 0.005) {
    score += 0.5;
    keyPoints.push("Consistent movement throughout launch");
  }
  
  return {
    score: Math.min(score, 10.0),
    feedback: generateLaunchFeedback(score),
    keyPoints
  };
}

function analyzeEntryPhase(frames: any[]): { score: number; feedback: string; keyPoints: string[] } {
  if (frames.length === 0) {
    return {
      score: 6.0,
      feedback: "Entry phase not captured",
      keyPoints: ["Extend video to include water entry"]
    };
  }
  
  let score = 6.0; // Base score
  const keyPoints: string[] = [];
  
  // Analyze streamline position
  if (frames.some(f => f.posture === 'streamlined')) {
    score += 2.0;
    keyPoints.push("Excellent streamlined position achieved");
  } else if (frames.some(f => f.posture === 'transitioning')) {
    score += 1.0;
    keyPoints.push("Good transition toward streamlined position");
  } else {
    keyPoints.push("Focus on achieving tight streamlined position");
  }
  
  // Check for body visibility during entry
  if (frames.some(f => f.hasFullBody)) {
    score += 1.0;
    keyPoints.push("Good body control visible during entry");
  }
  
  // Bonus for movement consistency
  const movements = frames.map(f => f.movement || 0);
  const avgMovement = movements.reduce((sum, m) => sum + m, 0) / movements.length;
  if (avgMovement > 0.003 && avgMovement < 0.015) {
    score += 0.5;
    keyPoints.push("Controlled entry with good speed");
  }
  
  return {
    score: Math.min(score, 10.0),
    feedback: generateEntryFeedback(score),
    keyPoints
  };
}

function generateSetupFeedback(score: number): string {
  if (score >= 8.5) return "Excellent starting position and stability!";
  if (score >= 7.0) return "Good setup with room for minor improvements.";
  if (score >= 5.5) return "Decent setup - focus on stability and positioning.";
  return "Work on improving starting position and stability.";
}

function generateLaunchFeedback(score: number): string {
  if (score >= 8.5) return "Outstanding explosive launch with excellent power!";
  if (score >= 7.0) return "Strong launch with good power and coordination.";
  if (score >= 5.5) return "Moderate launch - work on explosive power.";
  return "Focus on developing more explosive push-off power.";
}

function generateEntryFeedback(score: number): string {
  if (score >= 8.5) return "Perfect streamlined entry with optimal form!";
  if (score >= 7.0) return "Good entry form with minor areas for improvement.";
  if (score >= 5.5) return "Decent entry - work on streamline and control.";
  return "Focus on achieving better streamlined position.";
}

export async function POST(request: Request) {
  try {
    const { poseSequence, poseData, requestType } = await request.json()

    // Handle new Gemini analysis request type
    if (requestType === 'gemini-analysis' && poseData) {
      return await handleGeminiAnalysis(poseData)
    }

    // Original pose sequence analysis
    if (!poseSequence || poseSequence.length === 0) {
      return NextResponse.json({ error: "No pose sequence provided" }, { status: 400 })
    }

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found, using fallback feedback")
      return NextResponse.json({
        feedback: generateFallbackFeedback(poseSequence),
        success: true,
      })
    }

    try {
      // Try to generate feedback using Gemini
      const feedback = await generateGeminiFeedback(poseSequence, apiKey)
      return NextResponse.json({
        feedback,
        success: true,
      })
    } catch (error) {
      console.error("Gemini API error:", error)
      // Fall back to local analysis if Gemini fails
      return NextResponse.json({
        feedback: generateFallbackFeedback(poseSequence),
        success: true,
      })
    }
  } catch (error) {
    console.error("Error in analyze route:", error)
    return NextResponse.json({ error: "Failed to analyze pose data" }, { status: 500 })
  }
}

async function handleGeminiAnalysis(poseData: any[]) {
  // Perform phase-based analysis first
  const phaseAnalysis = analyzeSwimmingPhases(poseData);
  
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found for analysis")
    return NextResponse.json({
      feedback: `Swimming technique analyzed across 3 phases. Setup: ${phaseAnalysis.setupScore.toFixed(1)}/10, Launch: ${phaseAnalysis.launchScore.toFixed(1)}/10, Entry: ${phaseAnalysis.entryScore.toFixed(1)}/10. Overall Score: ${phaseAnalysis.overallScore.toFixed(1)}/10. Your technique shows good movement patterns with specific areas for improvement identified in each phase.`,
      success: true,
      phaseAnalysis: phaseAnalysis,
    })
  }

  try {
    const analysis = await generateDetailedGeminiFeedback(poseData, apiKey)
    return NextResponse.json({
      feedback: analysis,
      success: true,
      phaseAnalysis: phaseAnalysis,
    })
  } catch (error) {
    console.error("Detailed Gemini analysis error:", error)
    return NextResponse.json({
      feedback: `Swimming movement analyzed successfully across 3 phases. Setup: ${phaseAnalysis.setupScore.toFixed(1)}/10, Launch: ${phaseAnalysis.launchScore.toFixed(1)}/10, Entry: ${phaseAnalysis.entryScore.toFixed(1)}/10. Overall Score: ${phaseAnalysis.overallScore.toFixed(1)}/10. Your technique demonstrates solid fundamentals with room for improvement. Focus on explosive power and streamlined positioning.`,
      success: true,
      phaseAnalysis: phaseAnalysis,
    })
  }
}

async function generateDetailedGeminiFeedback(poseData: any[], apiKey: string): Promise<string> {
  // Analyze movement progression
  const movementData = poseData.map((frame, i) => {
    return `Frame ${i + 1}: ${frame.hasFullBody ? 'Full body visible' : 'Partial visibility'}, Movement: ${(frame.movement * 1000).toFixed(1)} units, Posture: ${frame.posture}`
  }).join('\n')

  const prompt = `You are an expert swimming coach analyzing a competitive swimming start. Based on this pose tracking data from a swimmer's start sequence:

${movementData}

Analyze the swimming start and provide:
1. A numeric score from 1-10 (clearly state "Score: X.X/10")
2. Brief feedback on technique
3. Focus on: explosive power, body positioning, timing, and overall start quality

Requirements:
- Must include "Score: X.X/10" in your response
- Be encouraging but honest
- Focus on competitive swimming starts from blocks
- Keep response under 100 words
- Emphasize what's good and what can improve`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

  if (!feedbackText) {
    throw new Error("No feedback received from Gemini")
  }

  return feedbackText
}

async function generateGeminiFeedback(poseSequence: any[], apiKey: string): Promise<any> {
  // Convert pose sequence to text format
  const poseText = poseSequence
    .slice(0, 10)
    .map((pose, i) => {
      const joints = Object.entries(pose)
        .filter(([_, point]: [string, any]) => point && point.visibility > 0.5)
        .map(([name, point]: [string, any]) => `${name}(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`)
        .join(", ")
      return `Frame ${i + 1}: ${joints}`
    })
    .join("\n")

  const prompt = `You are a competitive swimming coach. Analyze this sequence of joint positions from a swimmer's racing start from the starting blocks.

- Each line contains normalized (x, y) joint coordinates from a swimmer preparing for and executing a competitive swimming start.
- Focus on: starting stance, crouch position, explosive leg drive, arm use, and entry angle into the pool.
- Key swimming start elements: block positioning, knee bend depth, forward lean, arm preparation, and water entry.

Sequence:
${poseText}

Give specific, actionable feedback for improving the competitive swimming racing start technique. Focus on swimming pool starts, not platform diving. Respond with exactly 2 sentences only, Max of 30 words each.
Don't mention what frames you see things at.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Gemini API response:", errorText)
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

  if (!feedbackText) {
    throw new Error("No feedback text received from Gemini API")
  }

  // Process the response to ensure exactly 2 sentences
  const sentences = feedbackText.split(/[.!?]+\s+/).filter((s: string) => s.trim())

  let processedSentences = sentences.slice(0, 2)
  if (processedSentences.length === 1 && processedSentences[0].length > 100) {
    const words = processedSentences[0].split()
    const mid = Math.floor(words.length / 2)
    processedSentences = [words.slice(0, mid).join(" ") + ".", words.slice(mid).join(" ")]
  }

  const finalFeedback = processedSentences.join(". ")
  const completeFeedback = finalFeedback.endsWith(".") ? finalFeedback : finalFeedback + "."

  return {
    summary: "AI analysis of your swimming start technique completed",
    strengths: [processedSentences[0] || "Start motion detected successfully"],
    improvements: [processedSentences[1] || "Continue practicing for consistency"],
    technicalAnalysis: completeFeedback,
    rawFeedback: completeFeedback,
  }
}

function generateFallbackFeedback(poseSequence: any[]): any {
  // Analyze the pose sequence locally
  const hasMovement = poseSequence.length > 5
  const hasGoodPosture = poseSequence.some(
    (pose) => pose.leftShoulder && pose.rightShoulder && pose.leftHip && pose.rightHip,
  )

  return {
    summary: "Swimming start analyzed using local pose detection",
    strengths: [
      hasMovement ? "Clear movement sequence detected" : "Pose data captured successfully",
      hasGoodPosture ? "Good body positioning visible" : "Essential joints tracked",
    ],
    improvements: [
      "Focus on explosive push-off from starting blocks",
      "Maintain streamlined body position during entry",
    ],
    technicalAnalysis: `Local analysis of ${poseSequence.length} pose frames shows ${hasMovement ? "dynamic movement" : "static positioning"}. ${hasGoodPosture ? "Key body landmarks were successfully tracked." : "Some pose data may be incomplete."} Continue practicing starts for optimal competitive performance.`,
    rawFeedback: "Focus on explosive push-off from starting blocks. Maintain streamlined body position during entry.",
  }
}
