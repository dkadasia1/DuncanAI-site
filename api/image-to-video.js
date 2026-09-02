export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // =========================================
    // PARSE REQUEST
    // =========================================

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      image,
      prompt,
      aspectRatio = "16:9",
      duration = 5
    } = body;


    // =========================================
    // VALIDATE IMAGE
    // =========================================

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Please upload an image."
      });
    }


    if (image.length > 5242880) {
      return res.status(400).json({
        error:
          "Image is too large. Please use an image smaller than 5 MB."
      });
    }


    // =========================================
    // VALIDATE PROMPT
    // =========================================

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error:
          "Please describe the movement you want in the video."
      });
    }


    const cleanPrompt =
      prompt.trim();


    if (cleanPrompt.length < 5) {
      return res.status(400).json({
        error:
          "Please describe the movement you want in the video."
      });
    }


    if (cleanPrompt.length > 1000) {
      return res.status(400).json({
        error:
          "Video prompt is too long. Please keep it under 1000 characters."
      });
    }


    // =========================================
    // VALIDATE ASPECT RATIO
    // =========================================

    const allowedRatios = [
      "16:9",
      "9:16",
      "1:1"
    ];


    if (!allowedRatios.includes(aspectRatio)) {
      return res.status(400).json({
        error: "Invalid aspect ratio."
      });
    }


    // =========================================
    // VALIDATE DURATION
    // =========================================

    const videoDuration =
      Number(duration);


    if (
      !Number.isInteger(videoDuration) ||
      videoDuration < 2 ||
      videoDuration > 10
    ) {
      return res.status(400).json({
        error:
          "Video duration must be between 2 and 10 seconds."
      });
    }


    // =========================================
    // DUNCANAI FREE DEVELOPMENT MODE
    // =========================================
    //
    // IMPORTANT:
    //
    // We are NOT calling Runway.
    // We are NOT calling OpenAI.
    // We are NOT using API credits.
    //
    // This endpoint simply creates a development
    // task ID so we can test the complete:
    //
    // Upload Image
    // ↓
    // Generate
    // ↓
    // Task ID
    // ↓
    // Video Status
    // ↓
    // Video Result
    // ↓
    // My Creations
    // ↓
    // Open
    // ↓
    // Download
    // ↓
    // Delete
    //
    // workflow for free.
    // =========================================


    const developmentTaskId =
      "DUNCANAI_DEV_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 10);


    console.log(
      "DuncanAI development image-to-video task:",
      developmentTaskId
    );


    // =========================================
    // RETURN DEVELOPMENT TASK
    // =========================================

    return res.status(200).json({

      success: true,

      developmentMode: true,

      taskId:
        developmentTaskId,

      prompt:
        cleanPrompt,

      aspectRatio,

      duration:
        videoDuration

    });


  } catch (error) {

    console.error(
      "DuncanAI development image-to-video error:",
      error
    );


    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while creating the development video."
    });
  }
}
