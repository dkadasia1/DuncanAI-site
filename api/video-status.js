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

    const taskId = req.query.taskId;

    if (!taskId) {
      return res.status(400).json({
        error: "Missing video task ID."
      });
    }

    // =========================================
    // CHECK RUNWAY API KEY
    // =========================================

    const apiKey = process.env.RUNWAY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Runway API is not configured yet."
      });
    }

    // =========================================
    // REQUEST CURRENT RUNWAY TASK STATUS
    // =========================================

    const response = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(
        taskId
      )}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Runway-Version": "2024-11-06",
          "Cache-Control": "no-cache"
        }
      }
    );

    const responseText = await response.text();

    console.log(
      "Runway task response:",
      response.status,
      responseText
    );

    // =========================================
    // HANDLE RUNWAY ERROR
    // =========================================

    if (!response.ok) {
      console.error(
        "Runway task error:",
        response.status,
        responseText
      );

      let message = responseText;

      try {
        const parsed = JSON.parse(responseText);

        if (typeof parsed?.error === "string") {
          message = parsed.error;
        } else if (parsed?.error?.message) {
          message = parsed.error.message;
        } else if (parsed?.message) {
          message = parsed.message;
        }
      } catch {
        // Keep original response
      }

      return res.status(response.status).json({
        error: `Runway task error: ${message}`
      });
    }

    // =========================================
    // PARSE RUNWAY RESPONSE
    // =========================================

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        error:
          "Runway returned an invalid task response."
      });
    }

    // =========================================
    // CURRENT TASK STATUS
    // =========================================

    const status = data.status || "UNKNOWN";

    console.log(
      "DuncanAI task status:",
      taskId,
      status
    );

    // =========================================
    // TASK STILL PROCESSING
    // =========================================

    if (
      status === "PENDING" ||
      status === "RUNNING" ||
      status === "THROTTLED"
    ) {
      return res.status(200).json({
        success: true,
        status,
        taskId: data.id || taskId
      });
    }

    // =========================================
    // TASK FAILED
    // =========================================

    if (status === "FAILED") {
      return res.status(200).json({
        success: false,
        status: "FAILED",
        taskId: data.id || taskId,
        error:
          data.failure ||
          data.failureCode ||
          data.error ||
          "Runway video generation failed."
      });
    }

    // =========================================
    // TASK SUCCEEDED
    // =========================================

    if (status === "SUCCEEDED") {
      const videoUrl =
        data.output?.[0] ||
        data.output?.video ||
        data.videoUrl ||
        null;

      if (!videoUrl) {
        console.error(
          "Runway succeeded but returned no video URL:",
          data
        );

        return res.status(500).json({
          error:
            "Runway completed the video but returned no video URL."
        });
      }

      return res.status(200).json({
        success: true,
        status: "SUCCEEDED",
        taskId: data.id || taskId,
        videoUrl
      });
    }

    // =========================================
    // UNKNOWN STATUS
    // =========================================

    return res.status(200).json({
      success: true,
      status,
      taskId: data.id || taskId
    });

  } catch (error) {
    console.error(
      "Video status server error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while checking the video."
    });
  }
}
