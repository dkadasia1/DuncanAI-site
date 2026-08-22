export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    if (!process.env.RUNWAYML_API_SECRET) {
      return res.status(500).json({
        error: "Runway API is not configured yet."
      });
    }

    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({
        error: "Missing video task ID."
      });
    }

    const response = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.RUNWAYML_API_SECRET}`,
          "X-Runway-Version": "2024-11-06"
        }
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Runway status error:", responseText);

      return res.status(response.status).json({
        error: `Runway status error: ${responseText}`
      });
    }

    const data = JSON.parse(responseText);

    // Video is still being generated.
    if (
      data.status === "PENDING" ||
      data.status === "THROTTLED" ||
      data.status === "RUNNING"
    ) {
      return res.status(200).json({
        status: data.status,
        taskId: data.id
      });
    }

    // Video successfully generated.
    if (data.status === "SUCCEEDED") {
      const videoUrl = data.output?.[0];

      if (!videoUrl) {
        return res.status(500).json({
          error: "Video was completed but no video URL was returned."
        });
      }

      return res.status(200).json({
        status: "SUCCEEDED",
        taskId: data.id,
        videoUrl
      });
    }

    // Video failed.
    if (data.status === "FAILED") {
      return res.status(500).json({
        status: "FAILED",
        taskId: data.id,
        error: data.failure || "Runway video generation failed."
      });
    }

    // Other status.
    return res.status(200).json({
      status: data.status,
      taskId: data.id
    });

  } catch (error) {
    console.error("Video status server error:", error);

    return res.status(500).json({
      error: "Something went wrong while checking the video."
    });
  }
}
