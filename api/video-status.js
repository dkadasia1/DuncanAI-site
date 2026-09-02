export default async function handler(req, res) {

  // =========================================
  // ONLY GET REQUESTS
  // =========================================

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  // =========================================
  // PREVENT CACHING
  // =========================================

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  res.setHeader(
    "Pragma",
    "no-cache"
  );

  res.setHeader(
    "Expires",
    "0"
  );


  try {

    // =========================================
    // GET TASK ID
    // =========================================

    const taskId =
      req.query?.taskId;


    if (!taskId) {
      return res.status(400).json({
        error: "Missing video task ID."
      });
    }


    // =========================================
    // DUNCANAI FREE DEVELOPMENT MODE
    // =========================================
    //
    // We do NOT call Runway.
    //
    // We do NOT use an API key.
    //
    // We simply recognize the development
    // task created by /api/image-to-video.
    //
    // This allows us to test:
    //
    // Upload image
    // ↓
    // Generate
    // ↓
    // Task ID
    // ↓
    // Poll status
    // ↓
    // Video result
    // ↓
    // Save to My Creations
    // ↓
    // Open
    // ↓
    // Download
    // ↓
    // Delete
    //
    // completely free.
    // =========================================


    if (
      String(taskId).startsWith(
        "DUNCANAI_DEV_"
      )
    ) {

      console.log(
        "DuncanAI development video task:",
        taskId
      );


      // =========================================
      // DEVELOPMENT VIDEO
      // =========================================
      //
      // This is a temporary public sample video.
      //
      // It is NOT an AI-generated video.
      //
      // It is only being used so we can test
      // the complete DuncanAI video workflow
      // before connecting a paid video API.
      //
      // =========================================

      const videoUrl =
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";


      // =========================================
      // RETURN SUCCESS
      // =========================================

      return res.status(200).json({

        success: true,

        developmentMode: true,

        status:
          "SUCCEEDED",

        taskId,

        videoUrl

      });
    }


    // =========================================
    // UNKNOWN TASK
    // =========================================

    return res.status(404).json({
      error:
        "Development video task was not found."
    });


  } catch (error) {

    console.error(
      "DuncanAI development video status error:",
      error
    );


    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while checking the video."
    });
  }
}
