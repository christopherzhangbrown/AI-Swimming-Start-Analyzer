// Improved browser-compatible pose detection
declare global {
  interface Window {
    tf: any
    poseDetection: any
  }
}

export interface Keypoint {
  x: number
  y: number
  z?: number
  visibility?: number
}

export interface PoseFrame {
  frameId: number
  timestamp: number
  keypoints: {
    [key: string]: Keypoint
  }
  canvasWidth: number
  canvasHeight: number
}

let poseDetector: any = null
let isInitialized = false

async function initializePoseDetector(): Promise<any> {
  if (poseDetector && isInitialized) {
    return poseDetector
  }

  if (typeof window === "undefined") {
    throw new Error("Pose detection only works in browser environment")
  }

  try {
    console.log("Loading TensorFlow.js...")
    // Load TensorFlow.js first
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js")
    await waitForGlobal("tf")

    // Initialize TensorFlow.js backend
    await window.tf.ready()
    console.log("TensorFlow.js ready")

    // Set backend explicitly
    try {
      await window.tf.setBackend("webgl")
      console.log("Using WebGL backend")
    } catch (e) {
      console.warn("WebGL backend failed, falling back to CPU:", e)
      await window.tf.setBackend("cpu")
      console.log("Using CPU backend")
    }

    console.log("Loading pose detection library...")
    // Load pose detection library
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.min.js")
    await waitForGlobal("poseDetection")

    console.log("Creating pose detector...")
    // Use MoveNet for better reliability
    const model = window.poseDetection.SupportedModels.MoveNet
    poseDetector = await window.poseDetection.createDetector(model, {
      modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    })

    isInitialized = true
    console.log("MoveNet detector initialized successfully")
    return poseDetector
  } catch (error) {
    console.error("Failed to initialize pose detector:", error)
    throw new Error(`Pose detection initialization failed: ${error}`)
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = src
    script.onload = () => {
      console.log(`Loaded script: ${src}`)
      resolve()
    }
    script.onerror = (error) => {
      console.error(`Failed to load script: ${src}`, error)
      reject(new Error(`Failed to load ${src}`))
    }
    document.head.appendChild(script)
  })
}

function waitForGlobal(globalName: string, timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkGlobal = () => {
      if ((window as any)[globalName]) {
        console.log(`Global ${globalName} is ready`)
        resolve()
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${globalName}`))
      } else {
        setTimeout(checkGlobal, 100)
      }
    }
    checkGlobal()
  })
}

function convertLandmarksToKeypoints(landmarks: any[]): { [key: string]: Keypoint } {
  const keypoints: { [key: string]: Keypoint } = {}

  // MoveNet landmark indices (17 keypoints)
  const keypointMapping = {
    nose: 0,
    leftEye: 1,
    rightEye: 2,
    leftEar: 3,
    rightEar: 4,
    leftShoulder: 5,
    rightShoulder: 6,
    leftElbow: 7,
    rightElbow: 8,
    leftWrist: 9,
    rightWrist: 10,
    leftHip: 11,
    rightHip: 12,
    leftKnee: 13,
    rightKnee: 14,
    leftAnkle: 15,
    rightAnkle: 16,
  }

  Object.entries(keypointMapping).forEach(([name, index]) => {
    if (landmarks[index]) {
      const landmark = landmarks[index]
      keypoints[name] = {
        x: landmark.x,
        y: landmark.y,
        visibility: landmark.score || landmark.visibility || 1,
      }
    }
  })

  console.log(`Converted ${Object.keys(keypoints).length} keypoints from ${landmarks.length} landmarks`)
  return keypoints
}

function checkFullBodyVisible(keypoints: { [key: string]: Keypoint }): boolean {
  const essentialJoints = [
    ["leftShoulder", "rightShoulder"],
    ["leftHip", "rightHip"],
    ["leftKnee", "rightKnee"],
    ["leftAnkle", "rightAnkle"],
  ]

  for (const jointPair of essentialJoints) {
    const hasVisibleJoint = jointPair.some((joint) => {
      const keypoint = keypoints[joint]
      return keypoint && keypoint.visibility && keypoint.visibility >= 0.5
    })

    if (!hasVisibleJoint) {
      return false
    }
  }

  return true
}

export async function detectPosesInVideo(videoFile: File): Promise<PoseFrame[]> {
  try {
    console.log("Starting pose detection...")
    const detector = await initializePoseDetector()

    const video = document.createElement("video")
    video.src = URL.createObjectURL(videoFile)
    video.crossOrigin = "anonymous"
    video.muted = true

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = async () => {
        try {
          console.log(`Video loaded: ${video.duration}s, ${video.videoWidth}x${video.videoHeight}`)

          const poseFrames: PoseFrame[] = []
          const fps = 15 // Increased FPS for better accuracy
          const duration = Math.min(video.duration, 6) // Limit to 6 seconds
          const frameInterval = 1 / fps
          let currentTime = 0
          let frameId = 0

          const processFrame = async () => {
            if (currentTime >= duration) {
              URL.revokeObjectURL(video.src)
              console.log(`Pose detection complete: ${poseFrames.length} frames processed`)
              resolve(poseFrames)
              return
            }

            video.currentTime = currentTime

            video.onseeked = async () => {
              try {
                // Create canvas with reasonable size
                const canvas = document.createElement("canvas")
                const targetSize = 512 // Fixed size for consistency

                canvas.width = targetSize
                canvas.height = Math.round((targetSize * video.videoHeight) / video.videoWidth)

                const ctx = canvas.getContext("2d")!
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                console.log(`Processing frame ${frameId} at time ${currentTime.toFixed(2)}s`)

                // Detect poses with relaxed settings
                const poses = await detector.estimatePoses(canvas, {
                  maxPoses: 1,
                  flipHorizontal: false,
                  scoreThreshold: 0.2, // Lower threshold
                })

                console.log(`Frame ${frameId}: Found ${poses.length} poses`)

                if (poses && poses.length > 0 && poses[0].keypoints) {
                  console.log(`Frame ${frameId}: Processing ${poses[0].keypoints.length} keypoints`)

                  const keypoints = convertLandmarksToKeypoints(poses[0].keypoints)

                  // Normalize coordinates to 0-1 range
                  Object.keys(keypoints).forEach((key) => {
                    keypoints[key].x = keypoints[key].x / canvas.width
                    keypoints[key].y = keypoints[key].y / canvas.height
                  })

                  console.log(`Frame ${frameId}: Converted to ${Object.keys(keypoints).length} keypoints`)

                  // Add frame if we have any reasonable keypoints
                  if (Object.keys(keypoints).length > 5) {
                    poseFrames.push({
                      frameId,
                      timestamp: currentTime,
                      keypoints,
                      canvasWidth: canvas.width,
                      canvasHeight: canvas.height,
                    })
                    console.log(`Frame ${frameId}: Added to pose frames`)
                  }
                } else {
                  console.log(`Frame ${frameId}: No poses detected`)
                }

                frameId++
                currentTime += frameInterval

                // Add delay between frames for stability
                setTimeout(processFrame, 200)
              } catch (error) {
                console.error(`Error processing frame ${frameId}:`, error)
                currentTime += frameInterval
                frameId++
                setTimeout(processFrame, 200)
              }
            }

            video.onerror = (error) => {
              console.error("Video seek error:", error)
              currentTime += frameInterval
              frameId++
              setTimeout(processFrame, 200)
            }
          }

          processFrame()
        } catch (error) {
          console.error("Error in video processing:", error)
          reject(error)
        }
      }

      video.onerror = (error) => {
        console.error("Video load error:", error)
        reject(new Error("Failed to load video"))
      }

      // Set a longer timeout for video loading
      setTimeout(() => {
        if (video.readyState === 0) {
          reject(new Error("Video loading timeout"))
        }
      }, 20000)
    })
  } catch (error) {
    console.error("Error in pose detection:", error)
    throw error
  }
}

// Implement your Python angle calculation logic
function calculateAngle(p1: [number, number], p2: [number, number], p3: [number, number]): number {
  const v1 = [p1[0] - p2[0], p1[1] - p2[1]]
  const v2 = [p3[0] - p2[0], p3[1] - p2[1]]

  const dotProduct = v1[0] * v2[0] + v1[1] * v2[1]
  const norm1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1])
  const norm2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1])

  if (norm1 === 0 || norm2 === 0) return 0

  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (norm1 * norm2)))
  return Math.acos(cosAngle) * (180 / Math.PI)
}

// Implement your Python stillness detection logic
function checkInitialStillness(poseSeq: any[], stillnessThreshold = 0.001): boolean {
  if (poseSeq.length < 3) return false

  const keyJoints = ["leftHip", "rightHip", "leftShoulder", "rightShoulder"]
  let maxVariance = 0

  for (const joint of keyJoints) {
    const validPoses = poseSeq.filter((pose) => pose[joint])
    if (validPoses.length < 3) continue

    const xPositions = validPoses.map((pose) => pose[joint].x)
    const yPositions = validPoses.map((pose) => pose[joint].y)

    const xMean = xPositions.reduce((a, b) => a + b) / xPositions.length
    const yMean = yPositions.reduce((a, b) => a + b) / yPositions.length

    const xVar = xPositions.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / xPositions.length
    const yVar = yPositions.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / yPositions.length

    const jointVariance = xVar + yVar
    maxVariance = Math.max(maxVariance, jointVariance)
  }

  let totalMovement = 0
  let movementCount = 0

  for (let i = 1; i < poseSeq.length; i++) {
    let frameMovement = 0
    let jointCount = 0

    for (const joint of keyJoints) {
      if (poseSeq[i][joint] && poseSeq[i - 1][joint]) {
        const dx = poseSeq[i][joint].x - poseSeq[i - 1][joint].x
        const dy = poseSeq[i][joint].y - poseSeq[i - 1][joint].y
        const movement = Math.sqrt(dx * dx + dy * dy)
        frameMovement += movement
        jointCount++
      }
    }

    if (jointCount > 0) {
      const avgFrameMovement = frameMovement / jointCount
      totalMovement += avgFrameMovement
      movementCount++
    }
  }

  const avgMovement = movementCount > 0 ? totalMovement / movementCount : 0
  const isStill = maxVariance < stillnessThreshold && avgMovement < 0.005

  return isStill
}

// Implement your Python start motion detection logic
function isStartMotion(poseSeq: any[], returnConfidence = false): any {
  if (poseSeq.length < 8) {
    if (returnConfidence) {
      return { isStart: false, confidence: 0.0, details: { error: "Sequence too short" } }
    }
    return false
  }

  const stillnessFrames = Math.min(3, Math.floor(poseSeq.length / 3))
  const initialStillness = checkInitialStillness(poseSeq.slice(0, stillnessFrames))

  if (!initialStillness) {
    if (returnConfidence) {
      return {
        isStart: false,
        confidence: 0.0,
        details: { error: "No initial stillness detected" },
      }
    }
    return false
  }

  const horizontalVelocities = []
  const keyJoints = ["leftHip", "rightHip", "leftShoulder", "rightShoulder"]

  for (let i = 1; i < poseSeq.length; i++) {
    let frameHorizontalVelocity = 0
    let jointCount = 0

    for (const joint of keyJoints) {
      if (poseSeq[i][joint] && poseSeq[i - 1][joint]) {
        const dx = poseSeq[i][joint].x - poseSeq[i - 1][joint].x
        const horizontalVelocity = Math.abs(dx)
        frameHorizontalVelocity += horizontalVelocity
        jointCount++
      }
    }

    if (jointCount > 0) {
      const avgHorizontalVelocity = frameHorizontalVelocity / jointCount
      horizontalVelocities.push(avgHorizontalVelocity)
    }
  }

  if (horizontalVelocities.length < 3) {
    if (returnConfidence) {
      return { isStart: false, confidence: 0.0, details: { error: "Not enough velocity data" } }
    }
    return false
  }

  const maxVelocity = Math.max(...horizontalVelocities)
  const maxVelocityFrame = horizontalVelocities.indexOf(maxVelocity)

  const baselineStart = stillnessFrames
  const baselineEnd = Math.min(baselineStart + 2, horizontalVelocities.length)
  const baselineVelocity =
    horizontalVelocities.slice(baselineStart, baselineEnd).reduce((a, b) => a + b, 0) / (baselineEnd - baselineStart)

  const velocityJump = maxVelocity - baselineVelocity
  const velocityJumpPassed = velocityJump > 0.008 // Lower threshold for web

  const velocitySpikeFrame = maxVelocityFrame + stillnessFrames + 1
  const spikeTimingPassed = velocitySpikeFrame < poseSeq.length * 0.8

  const isStart = velocityJumpPassed && spikeTimingPassed
  const confidence = isStart ? 1.0 : 0.0

  const details = {
    initialStillness: { passed: true },
    velocityJump: {
      score: velocityJump,
      maxVelocity,
      baselineVelocity,
      passed: velocityJumpPassed,
      threshold: 0.008,
    },
    spikeTiming: {
      spikeFrame: velocitySpikeFrame,
      totalFrames: poseSeq.length,
      passed: spikeTimingPassed,
    },
    summary: {
      requirementsMet: (velocityJumpPassed ? 1 : 0) + (spikeTimingPassed ? 1 : 0),
      totalRequirements: 2,
      isStart,
    },
  }

  if (returnConfidence) {
    return { isStart, confidence, details }
  }
  return isStart
}

export async function analyzePoseData(poseFrames: PoseFrame[]): Promise<any> {
  if (poseFrames.length === 0) {
    return {
      overallScore: 0,
      summary: "No pose data detected. Please ensure the swimmer is clearly visible.",
      strengths: [],
      improvements: ["Ensure good lighting and clear visibility of the swimmer"],
      technicalAnalysis: "No valid pose data detected in the video.",
    }
  }

  const poseSequence = poseFrames.map((frame) => frame.keypoints)
  const { isStart, confidence, details } = isStartMotion(poseSequence, true)

  if (!isStart) {
    return {
      overallScore: 2,
      summary: "No swimming start detected. Ensure you perform a complete start motion.",
      strengths: ["Video successfully processed with pose detection"],
      improvements: [
        "Hold still for 0.2 seconds before starting",
        "Perform an explosive forward movement",
        "Ensure the entire start sequence is captured",
      ],
      technicalAnalysis: `Analysis of ${poseFrames.length} frames shows: ${details.error || "Start motion requirements not met"}`,
      metrics: {
        reactionTime: 0,
        entryAngle: 0,
        streamlinePosition: 0,
        bodyAlignment: 0,
      },
    }
  }

  const metrics = calculateSwimmingMetrics(poseFrames)

  return {
    overallScore: Math.min(10, confidence * 8 + 2),
    summary: "Swimming start detected and analyzed successfully",
    strengths: ["Successful start motion detected", "Good explosive movement pattern", "Proper sequence timing"],
    improvements: ["Continue practicing for consistency", "Focus on reaction time improvement"],
    technicalAnalysis: `Start detected with ${(confidence * 100).toFixed(0)}% confidence from ${poseFrames.length} frames of data. Velocity jump: ${details.velocityJump?.score.toFixed(4)}, Spike timing: frame ${details.spikeTiming?.spikeFrame}/${details.spikeTiming?.totalFrames}`,
    metrics: metrics || {
      reactionTime: details.velocityJump?.score || 0,
      entryAngle: 0,
      streamlinePosition: 0,
      bodyAlignment: 0,
    },
  }
}

function calculateSwimmingMetrics(poseFrames: PoseFrame[]): any {
  const metrics = {
    reactionTime: 0,
    entryAngle: 0,
    streamlinePosition: 0,
    bodyAlignment: 0,
  }

  if (poseFrames.length === 0) return metrics

  let firstMovementFrame = 0
  for (let i = 1; i < Math.min(poseFrames.length, 15); i++) {
    const current = poseFrames[i].keypoints
    const previous = poseFrames[i - 1].keypoints

    if (current.nose && previous.nose) {
      const movement = Math.sqrt(
        Math.pow(current.nose.x - previous.nose.x, 2) + Math.pow(current.nose.y - previous.nose.y, 2),
      )

      if (movement > 0.01) {
        firstMovementFrame = i
        break
      }
    }
  }

  metrics.reactionTime = firstMovementFrame / 10

  const midFrame = Math.floor(poseFrames.length / 2)
  if (poseFrames[midFrame]?.keypoints.nose && poseFrames[midFrame]?.keypoints.leftAnkle) {
    const nose = poseFrames[midFrame].keypoints.nose
    const ankle = poseFrames[midFrame].keypoints.leftAnkle

    const deltaY = ankle.y - nose.y
    const deltaX = ankle.x - nose.x
    metrics.entryAngle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI))
  }

  let streamlineScore = 0
  let validFrames = 0

  for (const frame of poseFrames) {
    if (frame.keypoints.leftWrist && frame.keypoints.rightWrist && frame.keypoints.nose) {
      const leftWrist = frame.keypoints.leftWrist
      const rightWrist = frame.keypoints.rightWrist
      const nose = frame.keypoints.nose

      const armsAboveHead = leftWrist.y < nose.y && rightWrist.y < nose.y
      const armDistance = Math.sqrt(Math.pow(leftWrist.x - rightWrist.x, 2) + Math.pow(leftWrist.y - rightWrist.y, 2))

      if (armsAboveHead && armDistance < 0.15) {
        streamlineScore += 1
      }
      validFrames += 1
    }
  }

  metrics.streamlinePosition = validFrames > 0 ? (streamlineScore / validFrames) * 100 : 0

  return metrics
}
