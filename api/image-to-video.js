export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      image,
      prompt,
      aspectRatio = "16:9",
      duration = 5
    } = JSON.parse(req.body);

    // -----------------------------------------
    // Check Runway API key
    // -----------------------------------------

    if (!process.env.RUNWAY_API_KEY) {
      return res.status(500).json({
        error: "Runway API is not configured yet."
      });
    }

    // -----------------------------------------
    // Validate image
    // -----------------------------------------

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Please upload an image."
      });
    }

    // Runway data URI limit is 5 MB.
    if (image.length > 5242880) {
      return res.status(400).json({
        error: "Image is too large. Please use an image smaller than 5 MB."
      });
    }

    // -----------------------------------------
    // Validate prompt
    // -----------------------------------------

    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({
        error: "Please describe the movement you want in the video."
      });
    }

    if (prompt.trim().length > 1000) {
      return res.status(400).json({
        error: "Video prompt is too long. Please keep it under 1000 characters."
      });
    }

    // -----------------------------------------
    // Validate duration
    // -----------------------------------------

    const videoDuration = Number(duration);

    if (
      !Number.isInteger(videoDuration) ||
      videoDuration < 2 ||
      videoDuration > 10
    ) {
      return res.status(400).json({
        error: "Video duration must be between 2 and 10 seconds."
      });
    }

    // -----------------------------------------
    // Map DuncanAI ratios to Runway
    // -----------------------------------------

    const ratioMap = {
      "16:9": "1280:720",
      "9:16": "720:1280",
      "1:1": "960:960"
    };

    const ratio = ratioMap[aspectRatio];

    if (!ratio) {
      return res.status(400).json({
        error: "Invalid aspect ratio."
      });
    }

    // -----------------------------------------
    // Create Runway Image → Video task
    // -----------------------------------------

    const response = await fetch(
      "https://api.dev.runwayml.com/v1/image_to_video",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06"
        },

        body: JSON.stringify({
          model: "gen4_turbo",

          promptImage: image,

          promptText: prompt.trim(),

          position: "first",

          ratio: ratio,

          duration: videoDuration
        })
      }
    );

    const responseText = await response.text();

    console.log("Runway response:", response.status, responseText);

    // -----------------------------------------
    // Handle Runway errors
    // -----------------------------------------

    if (!response.ok) {
      let runwayError = responseText;

      try {
        const parsed = JSON.parse(responseText);

        runwayError =
          parsed?.error?.message ||
          parsed?.message ||
          responseText;
      } catch {
        // Keep original response
      }

      return res.status(response.status).json({
        error: `Runway API error: ${runwayError}`
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
        error: "Runway returned an invalid response."
      });
    }

    if (!data.id) {
      return res.status(500).json({
        error: "Runway did not return a video task ID."
      });
    }

    // -----------------------------------------
    // Return task information
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      taskId: data.id,
      estimatedCost: data.estimatedCost || null
    });

  } catch (error) {
    console.error("Image-to-video server error:", error);

    return res.status(500).json({
      error: error.message ||
        "Something went wrong while creating the video."
    });
  }
}
