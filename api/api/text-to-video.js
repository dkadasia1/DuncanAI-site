export default async function handler(req, res) {
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
    // CHECK RUNWAY API KEY
    // =========================================

    const apiKey = process.env.RUNWAY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Runway API is not configured yet."
      });
    }

    // =========================================
    // VALIDATE PROMPT
    // =========================================

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Please describe the video you want to create."
      });
    }

    const cleanPrompt = prompt.trim();

    if (cleanPrompt.length < 5) {
      return res.status(400).json({
        error: "Please enter at least 5 characters."
      });
    }

    if (cleanPrompt.length > 1000) {
      return res.status(400).json({
        error: "Video prompts must be under 1,000 characters."
      });
    }

    // =========================================
    // VALIDATE DURATION
    // =========================================

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

    // =========================================
    // MAP ASPECT RATIO
    // =========================================

    const ratioMap = {
      "16:9": "1280:720",
      "9:16": "720:1280"
    };

    const ratio = ratioMap[aspectRatio];

    if (!ratio) {
      return res.status(400).json({
        error: "Choose either 16:9 or 9:16."
      });
    }

    // =========================================
    // CREATE RUNWAY TEXT-TO-VIDEO TASK
    // =========================================

    const response = await fetch(
      "https://api.dev.runwayml.com/v1/text_to_video",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06"
        },

        body: JSON.stringify({
          model: "gen4.5",
          promptText: cleanPrompt,
          ratio,
          duration: videoDuration
        })
      }
    );

    // =========================================
    // READ RUNWAY RESPONSE
    // =========================================

    const responseText = await response.text();

    console.log(
      "Runway text-to-video response:",
      response.status,
      responseText
    );

    // =========================================
    // HANDLE RUNWAY ERROR
    // =========================================

    if (!response.ok) {
      let runwayError = responseText;

      try {
        const parsed = JSON.parse(responseText);

        if (typeof parsed?.error === "string") {
          runwayError = parsed.error;
        } else if (parsed?.error?.message) {
          runwayError = parsed.error.message;
        } else if (parsed?.message) {
          runwayError = parsed.message;
        }
      } catch {
        // Keep original response
      }

      return res.status(response.status).json({
        error: `Runway API error: ${runwayError}`
      });
    }

    // =========================================
    // PARSE SUCCESS RESPONSE
    // =========================================

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        error: "Runway returned an invalid response."
      });
    }

    // =========================================
    // VALIDATE TASK ID
    // =========================================

    if (!data || !data.id) {
      return res.status(500).json({
        error: "Runway did not return a video task ID."
      });
    }

    // =========================================
    // RETURN TASK ID
    // =========================================

    return res.status(200).json({
      success: true,
      taskId: data.id,
      estimatedCost: data.estimatedCost || null
    });

  } catch (error) {
    console.error(
      "Text-to-video server error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while creating the video."
    });
  }
}
