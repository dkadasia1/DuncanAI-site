export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      prompt,
      aspectRatio
    } = body;

    // =========================================
    // VALIDATE PROMPT
    // =========================================

    if (typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt must be text."
      });
    }

    const cleanPrompt = prompt.trim();

    if (cleanPrompt.length < 5) {
      return res.status(400).json({
        error:
          "Prompt must be at least 5 characters long."
      });
    }

    if (cleanPrompt.length > 4000) {
      return res.status(400).json({
        error:
          "Prompt is too long. Maximum length is 4,000 characters."
      });
    }


    // =========================================
    // VALIDATE ASPECT RATIO
    // =========================================

    const allowedRatios = [
      "1:1",
      "16:9",
      "9:16"
    ];

    if (!allowedRatios.includes(aspectRatio)) {
      return res.status(400).json({
        error: "Invalid aspect ratio."
      });
    }


    // =========================================
    // DUNCANAI FREE DEVELOPMENT MODE
    // =========================================
    //
    // No OpenAI API call.
    //
    // This creates a deterministic test image
    // based on the user's prompt.
    //
    // This lets us test:
    //
    // Studio
    // Generate
    // Result
    // Save
    // My Creations
    // Open
    // Download
    // Delete
    //
    // without API costs.
    // =========================================


    // =========================================
    // CREATE SIMPLE HASH FROM PROMPT
    // =========================================

    function hashString(text) {
      let hash = 0;

      for (let i = 0; i < text.length; i++) {
        hash =
          ((hash << 5) - hash) +
          text.charCodeAt(i);

        hash |= 0;
      }

      return Math.abs(hash);
    }


    const hash =
      hashString(cleanPrompt);


    // =========================================
    // COLOR PALETTE
    // =========================================

    const palettes = [
      [
        "#0f172a",
        "#312e81",
        "#7c3aed"
      ],

      [
        "#082f49",
        "#0369a1",
        "#06b6d4"
      ],

      [
        "#172554",
        "#4338ca",
        "#8b5cf6"
      ],

      [
        "#1c1917",
        "#9a3412",
        "#f97316"
      ],

      [
        "#052e16",
        "#15803d",
        "#22c55e"
      ],

      [
        "#3b0764",
        "#a21caf",
        "#ec4899"
      ],

      [
        "#111827",
        "#374151",
        "#6366f1"
      ]
    ];


    const palette =
      palettes[
        hash % palettes.length
      ];


    // =========================================
    // DIMENSIONS
    // =========================================

    let width = 1024;
    let height = 1024;

    if (aspectRatio === "16:9") {
      width = 1280;
      height = 720;
    }

    if (aspectRatio === "9:16") {
      width = 720;
      height = 1280;
    }


    // =========================================
    // PROMPT DISPLAY
    // =========================================

    const promptLabel =
      cleanPrompt.length > 70
        ? cleanPrompt.substring(0, 70) + "..."
        : cleanPrompt;


    // Escape text for SVG
    function escapeSvg(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    }


    const safePrompt =
      escapeSvg(promptLabel);


    // =========================================
    // CREATE VISUAL VARIATION
    // =========================================

    const circleX =
      150 + (hash % 700);

    const circleY =
      150 + ((hash >> 3) % 700);

    const circleRadius =
      120 + (hash % 180);

    const secondX =
      100 + ((hash >> 5) % 800);

    const secondY =
      100 + ((hash >> 7) % 800);

    const rotation =
      hash % 360;


    // =========================================
    // SVG IMAGE
    // =========================================

    const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
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
        stop-color="${palette[0]}"
      />

      <stop
        offset="50%"
        stop-color="${palette[1]}"
      />

      <stop
        offset="100%"
        stop-color="${palette[2]}"
      />

    </linearGradient>


    <radialGradient
      id="glow"
      cx="50%"
      cy="50%"
      r="50%"
    >

      <stop
        offset="0%"
        stop-color="#ffffff"
        stop-opacity="0.28"
      />

      <stop
        offset="100%"
        stop-color="#ffffff"
        stop-opacity="0"
      />

    </radialGradient>


    <filter
      id="blur"
    >

      <feGaussianBlur
        stdDeviation="35"
      />

    </filter>

  </defs>


  <!-- Background -->

  <rect
    width="100%"
    height="100%"
    fill="url(#background)"
  />


  <!-- Atmospheric glow -->

  <circle
    cx="${circleX}"
    cy="${circleY}"
    r="${circleRadius}"
    fill="#ffffff"
    opacity="0.12"
    filter="url(#blur)"
  />


  <circle
    cx="${secondX}"
    cy="${secondY}"
    r="230"
    fill="url(#glow)"
    opacity="0.35"
  />


  <!-- Decorative shapes -->

  <g
    transform="rotate(${rotation} ${width / 2} ${height / 2})"
    opacity="0.14"
  >

    <circle
      cx="${width / 2}"
      cy="${height / 2}"
      r="${Math.min(width, height) * 0.28}"
      fill="none"
      stroke="#ffffff"
      stroke-width="3"
    />

    <circle
      cx="${width / 2}"
      cy="${height / 2}"
      r="${Math.min(width, height) * 0.20}"
      fill="none"
      stroke="#ffffff"
      stroke-width="2"
    />

  </g>


  <!-- DuncanAI mark -->

  <text
    x="${width / 2}"
    y="${height * 0.40}"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial, sans-serif"
    font-size="${Math.min(width, height) * 0.075}"
    font-weight="700"
  >
    DuncanAI
  </text>


  <text
    x="${width / 2}"
    y="${height * 0.48}"
    text-anchor="middle"
    fill="#ffffff"
    opacity="0.88"
    font-family="Arial, sans-serif"
    font-size="${Math.min(width, height) * 0.035}"
    font-weight="600"
  >
    Development Preview
  </text>


  <!-- Prompt -->

  <text
    x="${width / 2}"
    y="${height * 0.58}"
    text-anchor="middle"
    fill="#ffffff"
    opacity="0.78"
    font-family="Arial, sans-serif"
    font-size="${Math.min(width, height) * 0.022}"
  >
    ${safePrompt}
  </text>


  <!-- Status -->

  <text
    x="${width / 2}"
    y="${height * 0.66}"
    text-anchor="middle"
    fill="#ffffff"
    opacity="0.58"
    font-family="Arial, sans-serif"
    font-size="${Math.min(width, height) * 0.018}"
  >
    Free Development Mode • ${aspectRatio}
  </text>


  <!-- Footer -->

  <text
    x="${width / 2}"
    y="${height * 0.92}"
    text-anchor="middle"
    fill="#ffffff"
    opacity="0.45"
    font-family="Arial, sans-serif"
    font-size="${Math.min(width, height) * 0.016}"
  >
    DuncanAI Studio
  </text>

</svg>
`;


    // =========================================
    // CONVERT SVG TO DATA URL
    // =========================================

    const imageUrl =
      "data:image/svg+xml;base64," +
      Buffer.from(svg).toString("base64");


    // =========================================
    // RETURN RESULT
    // =========================================

    return res.status(200).json({
      imageUrl,

      developmentMode:
        true,

      prompt:
        cleanPrompt,

      aspectRatio
    });


  } catch (error) {

    console.error(
      "DuncanAI development image error:",
      error
    );

    return res.status(500).json({
      error:
        "Something went wrong while generating the test image."
    });
  }
}
