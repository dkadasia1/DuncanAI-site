export default async function handler(req, res) {

  // =========================================
  // ONLY POST REQUESTS
  // =========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  try {

    // =========================================
    // PARSE REQUEST BODY
    // =========================================

    let body = req.body;

    if (typeof body === "string") {

      try {

        body = JSON.parse(body);

      } catch {

        return res.status(400).json({
          error: "Invalid JSON request body."
        });

      }
    }


    const {
      prompt,
      aspectRatio = "16:9",
      duration = 5
    } = body || {};


    // =========================================
    // VALIDATE PROMPT
    // =========================================

    if (
      !prompt ||
      typeof prompt !== "string"
    ) {

      return res.status(400).json({
        error:
          "Please describe the video you want to create."
      });
    }


    const cleanPrompt =
      prompt.trim();


    if (
      cleanPrompt.length < 5
    ) {

      return res.status(400).json({
        error:
          "Please enter at least 5 characters."
      });
    }


    if (
      cleanPrompt.length > 1000
    ) {

      return res.status(400).json({
        error:
          "Video prompts must be under 1,000 characters."
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
    // VALIDATE ASPECT RATIO
    // =========================================

    const allowedRatios = [
      "16:9",
      "9:16"
    ];


    if (
      !allowedRatios.includes(
        aspectRatio
      )
    ) {

      return res.status(400).json({
        error:
          "Choose either 16:9 or 9:16."
      });
    }


    // =========================================
    // DUNCANAI FREE DEVELOPMENT MODE
    // =========================================
    //
    // No Runway API call.
    //
    // No API key required.
    //
    // We create a development task ID.
    //
    // video-status.js recognizes this ID
    // and returns our temporary test video.
    //
    // This lets us test:
    //
    // Text
    // ↓
    // Generate
    // ↓
    // Task ID
    // ↓
    // Status
    // ↓
    // Video
    // ↓
    // My Creations
    // ↓
    // Open
    // ↓
    // Download
    // ↓
    // Delete
    //
    // without spending Runway credits.
    // =========================================


    const taskId =
      "DUNCANAI_DEV_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 10);


    console.log(
      "DuncanAI development text-to-video task:",
      taskId
    );


    // =========================================
    // RETURN DEVELOPMENT TASK
    // =========================================

    return res.status(200).json({

      success: true,

      developmentMode:
        true,

      taskId,

      prompt:
        cleanPrompt,

      aspectRatio,

      duration:
        videoDuration,

      estimatedCost:
        0

    });


  } catch (error) {

    console.error(
      "DuncanAI development text-to-video error:",
      error
    );


    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while creating the development video."
    });
  }
}
