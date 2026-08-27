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

    // Validate prompt
    if (typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt must be text."
      });
    }

    const cleanPrompt = prompt.trim();

    if (cleanPrompt.length < 5) {
      return res.status(400).json({
        error: "Prompt must be at least 5 characters long."
      });
    }

    if (cleanPrompt.length > 4000) {
      return res.status(400).json({
        error: "Prompt is too long. Maximum length is 4,000 characters."
      });
    }

    // Validate aspect ratio
    const allowedRatios = ["1:1", "16:9", "9:16"];

    if (!allowedRatios.includes(aspectRatio)) {
      return res.status(400).json({
        error: "Invalid aspect ratio."
      });
    }

    /*
     * =========================================
     * DUNCANAI DEVELOPMENT MODE
     * =========================================
     *
     * This temporarily avoids calling OpenAI.
     *
     * It allows us to test the complete
     * DuncanAI Studio → Result → My Creations
     * workflow without API costs.
     */

    const svg = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1024"
        height="1024"
        viewBox="0 0 1024 1024"
      >

        <defs>
          <linearGradient
            id="background"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stop-color="#111827"
            />

            <stop
              offset="50%"
              stop-color="#312e81"
            />

            <stop
              offset="100%"
              stop-color="#7c3aed"
            />
          </linearGradient>
        </defs>

        <rect
          width="1024"
          height="1024"
          fill="url(#background)"
        />

        <circle
          cx="512"
          cy="390"
          r="180"
          fill="#ffffff"
          opacity="0.12"
        />

        <text
          x="512"
          y="470"
          text-anchor="middle"
          fill="white"
          font-family="Arial, sans-serif"
          font-size="64"
          font-weight="700"
        >
          DuncanAI
        </text>

        <text
          x="512"
          y="540"
          text-anchor="middle"
          fill="white"
          opacity="0.85"
          font-family="Arial, sans-serif"
          font-size="30"
        >
          Development Mode
        </text>

        <text
          x="512"
          y="610"
          text-anchor="middle"
          fill="white"
          opacity="0.7"
          font-family="Arial, sans-serif"
          font-size="22"
        >
          Image generation is being tested
        </text>

      </svg>
    `;

    const imageUrl =
      "data:image/svg+xml;base64," +
      Buffer.from(svg).toString("base64");

    return res.status(200).json({
      imageUrl,
      developmentMode: true,
      prompt: cleanPrompt,
      aspectRatio
    });

  } catch (error) {
    console.error(
      "DuncanAI development image error:",
      error
    );

    return res.status(500).json({
      error: "Something went wrong while generating the test image."
    });
  }
}
