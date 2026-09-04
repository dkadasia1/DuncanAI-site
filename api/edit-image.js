// DuncanAI Studio
// Edit & Enhance — Free Development Mode

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const {
      image,
      prompt,
      aspectRatio = "1:1",
    } = body;

    // Validate image
    if (!image || typeof image !== "string") {
      return res.status(400).json({
        success: false,
        error: "Please upload an image.",
      });
    }

    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        error: "Invalid image format.",
      });
    }

    // Limit uploaded image size to approximately 5 MB
    if (image.length > 7_000_000) {
      return res.status(400).json({
        success: false,
        error: "Image is too large. Please use an image under 5 MB.",
      });
    }

    // Validate prompt
    if (typeof prompt !== "string") {
      return res.status(400).json({
        success: false,
        error: "Please describe what you want to change.",
      });
    }

    const cleanPrompt = prompt.trim();

    if (cleanPrompt.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Please enter an editing instruction.",
      });
    }

    if (cleanPrompt.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Editing instruction is too long.",
      });
    }

    // Validate aspect ratio
    const allowedRatios = ["1:1", "16:9", "9:16"];

    if (!allowedRatios.includes(aspectRatio)) {
      return res.status(400).json({
        success: false,
        error: "Invalid aspect ratio.",
      });
    }

    /*
      FREE DEVELOPMENT MODE

      No OpenAI API call.
      No paid image-generation API.
      The uploaded image is returned as a development preview.

      This allows us to build and test the complete Edit & Enhance
      workflow before connecting a paid AI image-editing service.
    */

    return res.status(200).json({
      success: true,
      developmentMode: true,
      imageUrl: image,
      prompt: cleanPrompt,
      aspectRatio,
      message:
        "Development preview created successfully. AI editing will be connected at launch.",
    });
  } catch (error) {
    console.error("Edit image error:", error);

    return res.status(500).json({
      success: false,
      error: "Something went wrong while processing the image.",
    });
  }
}
