// /api/generate.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { prompt, aspectRatio } =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;
if (typeof prompt !== "string") {
  return res.status(400).json({
    error: "Prompt must be text."
  });
}

if (prompt.length > 32000) {
  return res.status(400).json({
    error: "Prompt is too long. Maximum length is 32,000 characters."
  });
}
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return res.status(400).json({
        error: "Prompt must be at least 5 characters long."
      });
    }

    const allowedRatios = ["1:1", "16:9", "9:16"];

    if (!allowedRatios.includes(aspectRatio)) {
      return res.status(400).json({
        error: "Invalid aspect ratio. Choose 1:1, 16:9, or 9:16."
      });
    }

    const sizeMap = {
      "1:1": "1024x1024",
      "16:9": "1536x1024",
      "9:16": "1024x1536"
    };

    const size = sizeMap[aspectRatio];

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Image generation is not configured yet."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: prompt.trim(),
          size
        })
      }
    );

if (!response.ok) {
  const errorText = await response.text();

  console.error("OpenAI API error:", errorText);

  return res.status(response.status).json({
    error: `OpenAI API error: ${errorText}`
  });
}

    const data = await response.json();

    const imageBase64 = data.data?.[0]?.b64_json;

    if (!imageBase64) {
      return res.status(500).json({
        error: "No image was returned. Please try again."
      });
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;

    return res.status(200).json({
      imageUrl
    });

  } catch (error) {
    console.error("DuncanAI image generation error:", error);

    return res.status(500).json({
      error: "Something went wrong while generating the image."
    });
  }
}
