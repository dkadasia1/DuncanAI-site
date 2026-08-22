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

    // Check API key
    if (!process.env.RUNWAYML_API_SECRET) {
      return res.status(500).json({
        error: "Runway API is not configured yet."
      });
    }

    // Validate image
    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Please upload an image."
      });
    }

    // Validate prompt
    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({
        error: "Please describe the movement you want in the video."
      });
    }

    // Validate duration
    const videoDuration = Number(duration);

    if (
      !Number.isInteger(videoDuration) ||
      videoDuration < 3 ||
      videoDuration > 10
    ) {
      return res.status(400).json({
        error: "Video duration must be between 3 and 10 seconds."
      });
    }

    // Map DuncanAI aspect ratios to Runway ratios
    const ratioMap = {
      "16:9": "1280:720",
      "9:16": "720:1280"
    };

    const ratio = ratioMap[aspectRatio];

    if (!ratio) {
      return res.status(400).json({
        error: "Invalid aspect ratio. Choose 16:9 or 9:16."
      });
    }

    // Runway Image → Video request
    const response = await fetch(
      "https://api.dev.runwayml.com/v1/image_to_video",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RUNWAYML_API_SECRET}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06"
        },
        body: JSON.stringify({
          model: "gen4_turbo",

          promptImage: image,

          promptText: prompt.trim(),

          position: "first",

          ratio,

          duration: videoDuration
        })
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Runway API error:", responseText);

      return res.status(response.status).json({
        error: `Runway API error: ${responseText}`
      });
    }

    const data = JSON.parse(responseText);

    // Runway returns a task ID.
    return res.status(200).json({
      success: true,
      taskId: data.id,
      estimatedCost: data.estimatedCost || null
    });

  } catch (error) {
    console.error("Image-to-video server error:", error);

    return res.status(500).json({
      error: "Something went wrong while creating the video."
    });
  }
}
