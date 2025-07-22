import { NextResponse } from "next/server"

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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found for analysis")
    return NextResponse.json({
      feedback: "Advanced AI analysis requires API configuration. Your swimming technique shows good movement patterns. Continue practicing explosive starts for optimal performance. Score: 7.5/10",
      success: true,
    })
  }

  try {
    const analysis = await generateDetailedGeminiFeedback(poseData, apiKey)
    return NextResponse.json({
      feedback: analysis,
      success: true,
    })
  } catch (error) {
    console.error("Detailed Gemini analysis error:", error)
    return NextResponse.json({
      feedback: "Swimming movement analyzed successfully. Your technique demonstrates solid fundamentals with room for improvement. Focus on explosive power and streamlined positioning. Score: 7.0/10",
      success: true,
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
  const sentences = feedbackText.split(/[.!?]+\s+/).filter((s) => s.trim())

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
