"use strict";
(self["webpackChunkcamera_kit_demo"] = self["webpackChunkcamera_kit_demo"] || []).push([[179],{

/***/ 4616:
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {


// EXTERNAL MODULE: ./node_modules/@snap/camera-kit/dist/index.js + 182 modules
var dist = __webpack_require__(713);
;// CONCATENATED MODULE: ./src/settings.js
/**
 * Camera Kit Web Demo Settings
 * Centralized configuration for the application
 */

const Settings = {
  // Camera settings
  camera: {
    fps: 60,
    constraints: {
      front: {
        video: {
          facingMode: { exact: "user" },
        },
        audio: true,
      },
      back: {
        video: {
          facingMode: { exact: "environment" },
        },
        audio: true,
      },
      desktop: {
        video: {
          facingMode: "user",
        },
        audio: true,
      },
    },
  },

  // Recording settings
  recording: {
    mimeType: "video/mp4",
    fps: 60,
    outputFileName: "recording.mp4",
  },

  // FFmpeg settings
  ffmpeg: {
    baseURL: "/ffmpeg",
    coreURL: "ffmpeg-core.js",
    wasmURL: "ffmpeg-core.wasm",
    outputOptions: ["-movflags", "faststart", "-c", "copy"],
  },

  // UI settings
  ui: {
    recordButton: {
      startImage: "./assets/RecordButton.png",
      stopImage: "./assets/RecordStop.png",
    },
    assets: {
      poweredBySnap: "./assets/Powered_bysnap.png",
      recordOutline: "./assets/RecordOutline.png",
      shareButton: "./assets/ShareButton.png",
      downloadButton: "./assets/DownloadButton.png",
      backButton: "./assets/BackButton.png",
      loadingIcon: "./assets/LoadingIcon.png",
    },
  },
}

;// CONCATENATED MODULE: ./src/camera.js



class CameraManager {
  constructor() {
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    this.isBackFacing = false
    this.mediaStream = null
  }

  async initializeCamera() {
    if (!this.isMobile) {
      document.body.classList.add("desktop")
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia(this.getConstraints())
    return this.mediaStream
  }

  async updateCamera(session) {
    this.isBackFacing = !this.isBackFacing

    if (this.mediaStream) {
      session.pause()
      this.mediaStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.mediaStream = null
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(this.getConstraints())
      const source = (0,dist/* createMediaStreamSource */.$A)(this.mediaStream, {
        cameraType: this.isBackFacing ? "environment" : "user",
        disableSourceAudio: false,
      })

      await session.setSource(source)
      if (!this.isBackFacing) {
        source.setTransform(dist/* Transform2D.MirrorX */.A.MirrorX)
      }
      await session.play()
      return source
    } catch (error) {
      console.error("Failed to get media stream:", error)
      throw error
    }
  }

  getConstraints() {
    return this.isMobile ? (this.isBackFacing ? Settings.camera.constraints.back : Settings.camera.constraints.front) : Settings.camera.constraints.desktop
  }
}

;// CONCATENATED MODULE: ./src/recorder.js


class MediaRecorderManager {
  constructor(videoProcessor, uiManager) {
    this.mediaRecorder = null
    this.recordedChunks = []
    this.videoProcessor = videoProcessor
    this.uiManager = uiManager
    this.audioVideoStream = null
    this.canvasStream = null
  }

  async startRecording(liveRenderTarget, constraints) {
    try {
      this.audioVideoStream = await navigator.mediaDevices.getUserMedia(constraints)
      const audioTrack = this.audioVideoStream.getAudioTracks()[0]
      this.canvasStream = liveRenderTarget.captureStream(Settings.recording.fps)
      this.canvasStream.addTrack(audioTrack)

      this.mediaRecorder = new MediaRecorder(this.canvasStream, {
        mimeType: Settings.recording.mimeType,
      })
      this.recordedChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        console.log("start record")
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        console.log("stop record")
        this.uiManager.showLoading(true)
        const blob = new Blob(this.recordedChunks, { type: Settings.recording.mimeType })
        const fixedBlob = await this.videoProcessor.fixVideoDuration(blob)
        const url = URL.createObjectURL(fixedBlob)
        this.uiManager.showLoading(false)
        this.uiManager.displayPostRecordButtons(url, fixedBlob)
      }

      this.mediaRecorder.start()
      return true
    } catch (error) {
      console.error("Error accessing media devices:", error)
      return false
    }
  }

  resetRecordingVariables() {
    this.mediaRecorder = null
    this.recordedChunks = []
    // Stop all tracks in the audio/video stream
    if (this.audioVideoStream) {
      this.audioVideoStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.audioVideoStream = null
    }

    // Stop all tracks in the canvas stream
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.canvasStream = null
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    }
  }
}

;// CONCATENATED MODULE: ./src/ui.js


class UIManager {
  constructor() {
    this.recordButton = document.getElementById("record-button")
    this.recordOutline = document.getElementById("outline")
    this.actionButton = document.getElementById("action-buttons")
    this.switchButton = document.getElementById("switch-button")
    this.loadingIcon = document.getElementById("loading")
    this.backButtonContainer = document.getElementById("back-button-container")
    this.recordPressedCount = 0
  }

  toggleRecordButton(isVisible) {
    if (isVisible) {
      this.recordOutline.style.display = "block"
      this.recordButton.style.display = "block"
    } else {
      this.recordOutline.style.display = "none"
      this.recordButton.style.display = "none"
    }
  }

  updateRecordButtonState(isRecording) {
    this.recordButton.style.backgroundImage = isRecording ? `url('${Settings.ui.recordButton.stopImage}')` : `url('${Settings.ui.recordButton.startImage}')`
    this.recordPressedCount++
  }

  showLoading(show) {
    this.loadingIcon.style.display = show ? "block" : "none"
  }

  displayPostRecordButtons(url, fixedBlob) {
    this.actionButton.style.display = "block"
    this.backButtonContainer.style.display = "block"
    this.switchButton.style.display = "none"

    document.getElementById("download-button").onclick = () => {
      const a = document.createElement("a")
      a.href = url
      a.download = Settings.recording.outputFileName
      a.click()
      a.remove()
    }

    document.getElementById("share-button").onclick = async () => {
      try {
        const file = new File([fixedBlob], Settings.recording.outputFileName, {
          type: Settings.recording.mimeType,
        })

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Recorded Video",
            text: "Check out this recording!",
          })
          console.log("File shared successfully")
        } else {
          console.error("Sharing files is not supported on this device.")
        }
      } catch (error) {
        console.error("Error while sharing:", error)
      }
    }

    document.getElementById("back-button").onclick = async () => {
      this.actionButton.style.display = "none"
      this.backButtonContainer.style.display = "none"
      this.switchButton.style.display = "block"
      this.toggleRecordButton(true)
    }
  }

  updateRenderSize(source, liveRenderTarget) {
    const width = window.innerWidth
    const height = window.innerHeight

    liveRenderTarget.style.width = `${width}px`
    liveRenderTarget.style.height = `${height}px`
    source.setRenderSize(width, height)
  }
}

// EXTERNAL MODULE: ./node_modules/@ffmpeg/ffmpeg/dist/esm/index.js + 2 modules
var esm = __webpack_require__(4435);
// EXTERNAL MODULE: ./node_modules/@ffmpeg/util/dist/esm/index.js + 1 modules
var dist_esm = __webpack_require__(2994);
;// CONCATENATED MODULE: ./src/videoProcessor.js




class VideoProcessor {
  constructor() {
    this.ffmpeg = new esm/* FFmpeg */.C()
  }

  async fixVideoDuration(blob) {
    try {
      console.log("Loading FFmpeg...")
      const { baseURL, coreURL, wasmURL, outputOptions } = Settings.ffmpeg

      const fullCoreURL = `${baseURL}/${coreURL}`
      const fullWasmURL = `${baseURL}/${wasmURL}`

      console.log("Loading FFmpeg with URLs:", {
        coreURL: fullCoreURL,
        wasmURL: fullWasmURL,
      })

      await this.ffmpeg.load({
        coreURL: fullCoreURL,
        wasmURL: fullWasmURL,
      })

      console.log("FFmpeg loaded successfully")

      await this.ffmpeg.writeFile("input.mp4", await (0,dist_esm/* fetchFile */.dc)(blob))
      await this.ffmpeg.exec(["-i", "input.mp4", ...outputOptions, "output.mp4"])
      const fixedData = await this.ffmpeg.readFile("output.mp4")
      return new Blob([fixedData.buffer], { type: Settings.recording.mimeType })
    } catch (error) {
      console.error("Error in fixVideoDuration:", error)
      throw error
    }
  }
}

;// CONCATENATED MODULE: ./src/main.js
/**
 * Camera Kit Web Demo with Recording Feature
 * Created by gowaaa (https://www.gowaaa.com)
 * A creative technology studio specializing in AR experiences
 *
 * @copyright 2025 GOWAAA
 */







(async function () {
  // Get environment variables
  const apiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzQ0NTU2NjgxLCJzdWIiOiIxNjE2NjcxYS0yMjM3LTRmZjMtYWEwYy0zOWE5MGQyNGM0ZmJ-U1RBR0lOR345OWRiMjFmMC01YWRlLTQ4MzUtYTI0ZC0zZmZkZGRkNDNkYjYifQ.kUB84ZR_NTEI1wKgkegSLpTSgCCHRfiSNxOA2w56IPM"
  const lensID = "7c3094ae-724e-40e8-bd47-72365ea58907"
  const groupID = "9fd47832-2753-49e6-aebf-66dd0d475c68"

  if (!apiToken || !lensID || !groupID) {
    console.error("Missing required environment variables. Please check your environment settings.")
    return
  }

  // Initialize managers
  const uiManager = new UIManager()
  const cameraManager = new CameraManager()
  const videoProcessor = new VideoProcessor()
  const mediaRecorder = new MediaRecorderManager(videoProcessor, uiManager)

  // Initialize Camera Kit
  const cameraKit = await (0,dist/* bootstrapCameraKit */.FY)({
    apiToken: apiToken,
  })

  // Get canvas element for live render target
  const liveRenderTarget = document.getElementById("canvas")

  // Create camera kit session
  const session = await cameraKit.createSession({ liveRenderTarget })

  // Initialize camera and set up source
  const mediaStream = await cameraManager.initializeCamera()
  const source = (0,dist/* createMediaStreamSource */.$A)(mediaStream, {
    cameraType: "user",
    disableSourceAudio: false,
  })
  await session.setSource(source)
  source.setTransform(dist/* Transform2D.MirrorX */.A.MirrorX)
  await source.setRenderSize(window.innerWidth, window.innerHeight)
  await session.setFPSLimit(Settings.camera.fps)
  await session.play()

  // Load and apply lens
  const lens = await cameraKit.lensRepository.loadLens(lensID, groupID)
  await session.applyLens(lens)

  // Set up event listeners
  uiManager.recordButton.addEventListener("click", async () => {
    if (uiManager.recordPressedCount % 2 === 0) {
      const success = await mediaRecorder.startRecording(liveRenderTarget, cameraManager.getConstraints())
      if (success) {
        uiManager.updateRecordButtonState(true)
      }
    } else {
      uiManager.updateRecordButtonState(false)
      uiManager.toggleRecordButton(false)
      mediaRecorder.stopRecording()
    }
  })

  uiManager.switchButton.addEventListener("click", async () => {
    try {
      const source = await cameraManager.updateCamera(session)
      uiManager.updateRenderSize(source, liveRenderTarget)
    } catch (error) {
      console.error("Error switching camera:", error)
    }
  })

  // Add back button handler
  document.getElementById("back-button").addEventListener("click", async () => {
    try {
      mediaRecorder.resetRecordingVariables()
      uiManager.updateRenderSize(source, liveRenderTarget)
    } catch (error) {
      console.error("Error resetting camera:", error)
    }
  })

  // Add window resize listener
  window.addEventListener("resize", () => uiManager.updateRenderSize(source, liveRenderTarget))

  // Update initial render size
  uiManager.updateRenderSize(source, liveRenderTarget)
})()


/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, [216], () => (__webpack_exec__(4616)));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);