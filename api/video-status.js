export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const taskId = req.query.taskId;

    // -----------------------------------------
    // Validate task ID
    // -----------------------------------------

    if (!taskId) {
      return res.status(400).json({
        error: "Missing video task ID."
      });
    }

    // -----------------------------------------
    // Check Runway API key
    // -----------------------------------------

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({
        error: "Runway API is not configured yet."
      });
    }

    // -----------------------------------------
    // Ask Runway for task status
    // -----------------------------------------

    const response = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
          "X-Runway-Version": "2024-11-06"
        }
      }
    );

    const responseText = await response.text();

    console.log("Runway task response:", responseText);

    // -----------------------------------------
    // Handle Runway errors
    // -----------------------------------------

    if (!response.ok) {
      console.error(
        "Runway task error:",
        response.status,
        responseText
      );

      return res.status(response.status).json({
        error: `Runway task error: ${responseText}`
      });
    }

    // -----------------------------------------
    // Parse response
    // -----------------------------------------

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        error: "Runway returned an invalid task response."
      });
    }

    // -----------------------------------------
    // Task still processing
    // -----------------------------------------

    if (
      data.status === "PENDING" ||
      data.status === "RUNNING" ||
      data.status === "THROTTLED"
    ) {
      return res.status(200).json({
        success: true,
        status: data.status,
        taskId: data.id
      });
    }

    // -----------------------------------------
    // Task failed
    // -----------------------------------------

    if (data.status === "FAILED") {
      return res.status(200).json({
        success: false,
        status: "FAILED",
        taskId: data.id,
        error:
          data.failure ||
          data.failureCode ||
          "Runway video generation failed."
      });
    }

    // -----------------------------------------
    // Task succeeded
    // -----------------------------------------

    if (data.status === "SUCCEEDED") {
      const videoUrl =
        data.output?.[0] ||
        data.output?.video ||
        data.videoUrl ||
        null;

      if (!videoUrl) {
        console.error(
          "Runway succeeded but no video URL was returned:",
          data
        );

        return res.status(500).json({
          error: "Runway completed the video but returned no video URL."
        });
      }

      return res.status(200).json({
        success: true,
        status: "SUCCEEDED",
        taskId: data.id,
        videoUrl
      });
    }

    // -----------------------------------------
    // Unknown status
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      status: data.status || "UNKNOWN",
      taskId: data.id
    });

  } catch (error) {
    console.error(
      "Video status server error:",
      error
    );

    return res.status(500).json({
      error: "Something went wrong while checking the video."
    });
  }
}
