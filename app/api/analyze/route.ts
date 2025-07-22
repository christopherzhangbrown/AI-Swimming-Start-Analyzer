import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { poseSequence } = await request.json()

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
