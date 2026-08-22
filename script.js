document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // DuncanAI elements
  // =========================================

  const toolButtons = document.querySelectorAll(".tool-button");

  const creator = document.getElementById("creator");
  const creatorTitle = document.getElementById("creator-title");
  const closeCreator = document.getElementById("close-creator");

  const promptInput = document.getElementById("prompt");
  const aspectSelect = document.getElementById("aspect");
  const generateButton = document.getElementById("generate");
  const result = document.getElementById("result");

  let currentTool = "image";
  let uploadedImage = null;

  // =========================================
  // Open creator
  // =========================================

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentTool = button.dataset.tool;

      creator.classList.remove("hidden");

      // -----------------------------
      // Create Image
      // -----------------------------

      if (currentTool === "image") {
        creatorTitle.textContent = "Create Image";

        promptInput.placeholder =
          "Example: A cinematic sunrise over the African savanna, dramatic clouds, warm light...";

        result.innerHTML = `
          <div class="result-placeholder">
            Your generated image will appear here.
          </div>
        `;
      }

      // -----------------------------
      // Image → Video
      // -----------------------------

      if (currentTool === "image-video") {
        creatorTitle.textContent = "Image → Video";

        promptInput.placeholder =
          "Describe the movement you want: slowly move the camera toward the subject, gentle wind moving hair, natural waves...";

        showImageVideoInterface();
      }

      // -----------------------------
      // Text → Video
      // -----------------------------

      if (currentTool === "video") {
        creatorTitle.textContent = "Text → Video";

        result.innerHTML = `
          <div class="result-placeholder">
            <strong>🎬 Text → Video</strong>
            <p style="margin-top:8px;">
              Text → Video is coming next.
            </p>
          </div>
        `;
      }

      // -----------------------------
      // Edit & Enhance
      // -----------------------------

      if (currentTool === "edit") {
        creatorTitle.textContent = "Edit & Enhance";

        result.innerHTML = `
          <div class="result-placeholder">
            <strong>✨ Edit & Enhance</strong>
            <p style="margin-top:8px;">
              AI image editing is coming next.
            </p>
          </div>
        `;
      }

      creator.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  // =========================================
  // Close creator
  // =========================================

  if (closeCreator) {
    closeCreator.addEventListener("click", () => {
      creator.classList.add("hidden");
      uploadedImage = null;
    });
  }

  // =========================================
  // Image → Video interface
  // =========================================

  function showImageVideoInterface() {
    uploadedImage = null;

    result.innerHTML = `
      <div class="video-workspace">

        <div class="upload-box">

          <input
            type="file"
            id="video-image-upload"
            accept="image/png,image/jpeg,image/webp"
          />

          <label
            for="video-image-upload"
            class="upload-label"
          >
            🖼️ Choose an image
          </label>

          <div id="image-preview"></div>

          <p class="upload-help">
            Upload an image you want DuncanAI to animate.
            JPG, PNG, or WebP.
          </p>

        </div>

      </div>
    `;

    const uploadInput =
      document.getElementById("video-image-upload");

    if (uploadInput) {
      uploadInput.addEventListener(
        "change",
        handleImageUpload
      );
    }
  }

  // =========================================
  // Handle uploaded image
  // =========================================

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate image type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    // Keep upload under 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Please choose an image smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      uploadedImage = reader.result;

      const preview =
        document.getElementById("image-preview");

      if (!preview) {
        return;
      }

      preview.innerHTML = `
        <div class="video-source-card">

          <div class="video-source-title">
            🖼️ Source Image
          </div>

          <img
            src="${escapeHtml(uploadedImage)}"
            alt="Uploaded source image"
            class="video-source-image"
          />

        </div>
      `;
    };

    reader.onerror = () => {
      uploadedImage = null;

      result.innerHTML = `
        <div class="error">
          Unable to read that image. Please try another image.
        </div>
      `;
    };

    reader.readAsDataURL(file);
  }

  // =========================================
  // Generate button
  // =========================================

  if (generateButton) {
    generateButton.addEventListener(
      "click",
      async () => {

        if (currentTool === "image") {
          await generateImage();
          return;
        }

        if (currentTool === "image-video") {
          await generateImageVideo();
          return;
        }

        if (currentTool === "video") {
          result.innerHTML = `
            <div class="result-placeholder">
              <strong>🎬 Text → Video</strong>
              <p style="margin-top:8px;">
                Text → Video is coming next.
              </p>
            </div>
          `;
          return;
        }

        if (currentTool === "edit") {
          result.innerHTML = `
            <div class="result-placeholder">
              <strong>✨ Edit & Enhance</strong>
              <p style="margin-top:8px;">
                AI image editing is coming next.
              </p>
            </div>
          `;
        }
      }
    );
  }

  // =========================================
  // Text → Image
  // =========================================

  async function generateImage() {
    const prompt = promptInput.value.trim();

    // Validate
    if (prompt.length < 5) {
      result.innerHTML = `
        <div class="error">
          Please enter a description of at least 5 characters.
        </div>
      `;
      return;
    }

    if (prompt.length > 32000) {
      result.innerHTML = `
        <div class="error">
          Your prompt is too long.
          Please keep it under 32,000 characters.
        </div>
      `;
      return;
    }

    const aspectRatio = getAspectRatio();

    setStandardLoading(
      "Creating your image..."
    );

    try {
      const response = await fetch(
        "/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt,
            aspectRatio
          })
        }
      );

      const data = await readJsonResponse(
        response
      );

      if (!response.ok || data.error) {
        throw new Error(
          data.error ||
          "Image generation failed."
        );
      }

      if (!data.imageUrl) {
        throw new Error(
          "No image was returned."
        );
      }

      result.innerHTML = `
        <div class="generated-result">

          <img
            src="${escapeHtml(data.imageUrl)}"
            alt="${escapeHtml(
              prompt.substring(0, 100)
            )}"
          />

          <a
            href="${escapeHtml(data.imageUrl)}"
            download="duncanai-image.png"
            class="primary download-button"
          >
            ⬇ Download Image
          </a>

        </div>
      `;

    } catch (error) {

      result.innerHTML = `
        <div class="error">
          ❌ ${escapeHtml(
            error.message ||
            "Something went wrong."
          )}
        </div>
      `;
    }
  }

  // =========================================
  // Image → Video
  // =========================================

  async function generateImageVideo() {

    if (!uploadedImage) {
      result.innerHTML = `
        <div class="error">
          Please upload an image first.
        </div>
      `;
      return;
    }

    const prompt = promptInput.value.trim();

    if (prompt.length < 5) {
      result.innerHTML = `
        <div class="error">
          Please describe the movement you want
          in the video.
        </div>
      `;
      return;
    }

    if (prompt.length > 1000) {
      result.innerHTML = `
        <div class="error">
          Video prompts must be under 1,000 characters.
        </div>
      `;
      return;
    }

    const aspectRatio = getAspectRatio();

    // Disable button while creating
    generateButton.disabled = true;
    generateButton.textContent =
      "Creating...";

    setVideoLoading(
      "Sending your image to DuncanAI..."
    );

    try {

      const response = await fetch(
        "/api/image-to-video",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: uploadedImage,
            prompt,
            aspectRatio,
            duration: 5
          })
        }
      );

      const data = await readJsonResponse(
        response
      );

      if (!response.ok || data.error) {
        throw new Error(
          data.error ||
          "Unable to start video generation."
        );
      }

      if (!data.taskId) {
        throw new Error(
          "Runway did not return a video task ID."
        );
      }

      await pollVideoStatus(
        data.taskId
      );

    } catch (error) {

      result.innerHTML = `
        <div class="error">
          ❌ ${escapeHtml(
            error.message ||
            "Something went wrong while creating the video."
          )}
        </div>
      `;

    } finally {

      generateButton.disabled = false;
      generateButton.textContent =
        "Generate";
    }
  }

  // =========================================
  // Poll Runway task
  // =========================================

  async function pollVideoStatus(taskId) {

    const maxAttempts = 60;

    for (
      let attempts = 1;
      attempts <= maxAttempts;
      attempts++
    ) {

      let message =
        "Preparing your video...";

      if (attempts <= 2) {
        message =
          "Preparing your image for animation...";
      } else if (attempts <= 8) {
        message =
          "Animating your image...";
      } else {
        message =
          "Finalizing your video...";
      }

      setVideoLoading(
        `${message} (${attempts}/${maxAttempts})`
      );

      // Wait before polling
      await wait(5000);

      try {

        const response = await fetch(
          `/api/video-status?taskId=${encodeURIComponent(
            taskId
          )}`
        );

        const data = await readJsonResponse(
          response
        );

        if (!response.ok || data.error) {
          throw new Error(
            data.error ||
            "Unable to check video status."
          );
        }

        console.log(
          "DuncanAI video status:",
          data.status
        );

        // -----------------------------
        // Success
        // -----------------------------

        if (
          data.status === "SUCCEEDED"
        ) {

          if (!data.videoUrl) {
            throw new Error(
              "Runway completed the video but did not return a video URL."
            );
          }

          showGeneratedVideo(
            data.videoUrl
          );

          return;
        }

        // -----------------------------
        // Failure
        // -----------------------------

        if (
          data.status === "FAILED"
        ) {
          throw new Error(
            data.error ||
            "Runway video generation failed."
          );
        }

        // -----------------------------
        // Still processing
        // -----------------------------

        if (
          data.status === "PENDING" ||
          data.status === "QUEUED" ||
          data.status === "RUNNING" ||
          data.status === "PROCESSING" ||
          data.status === "THROTTLED"
        ) {
          continue;
        }

      } catch (error) {

        result.innerHTML = `
          <div class="error">
            ❌ ${escapeHtml(
              error.message ||
              "Unable to check video status."
            )}
          </div>
        `;

        return;
      }
    }

    result.innerHTML = `
      <div class="error">
        ❌ Video generation is taking longer
        than expected. Please try again.
      </div>
    `;
  }

  // =========================================
  // Show generated video
  // =========================================

  function showGeneratedVideo(videoUrl) {

    result.innerHTML = `
      <div class="video-workspace">

        <div class="video-result-card">

          <div class="video-result-title">
            🎬 Your DuncanAI video is ready
          </div>

          <video
            controls
            playsinline
            preload="metadata"
            class="video-result-player"
          >
            <source
              src="${escapeHtml(videoUrl)}"
              type="video/mp4"
            />

            Your browser does not support
            video playback.
          </video>

          <div class="video-success">
            ✓ Video generated successfully
          </div>

          <div class="video-result-actions">

            <a
              href="${escapeHtml(videoUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              class="video-open"
            >
              ↗ Open Video
            </a>

            <a
              href="${escapeHtml(videoUrl)}"
              download="duncanai-video.mp4"
              class="video-download"
            >
              ⬇ Download Video
            </a>

            <button
              type="button"
              id="create-another-video"
              class="video-new"
            >
              ✨ Create Another
            </button>

          </div>

        </div>

      </div>
    `;

    // Create another video
    const newVideoButton =
      document.getElementById(
        "create-another-video"
      );

    if (newVideoButton) {
      newVideoButton.addEventListener(
        "click",
        () => {

          uploadedImage = null;

          promptInput.value = "";

          showImageVideoInterface();

          promptInput.focus();
        }
      );
    }

    // Video error detection
    const video =
      result.querySelector(
        ".video-result-player"
      );

    if (video) {

      video.addEventListener(
        "error",
        () => {

          result.innerHTML = `
            <div class="error">
              ❌ The video was generated, but
              your browser could not play it.
              Try "Open Video".
            </div>
          `;
        }
      );
    }
  }

  // =========================================
  // Aspect ratio
  // =========================================

  function getAspectRatio() {

    const value =
      aspectSelect?.value || "";

    if (value.includes("1:1")) {
      return "1:1";
    }

    if (value.includes("9:16")) {
      return "9:16";
    }

    return "16:9";
  }

  // =========================================
  // Standard loading
  // =========================================

  function setStandardLoading(message) {

    result.innerHTML = `
      <div class="result-placeholder loading">

        <div class="spinner"></div>

        <p>
          ${escapeHtml(message)}
        </p>

        <small>
          Please wait...
        </small>

      </div>
    `;
  }

  // =========================================
  // Video loading
  // =========================================

  function setVideoLoading(message) {

    result.innerHTML = `
      <div class="video-generation-panel">

        <div class="spinner"></div>

        <h3>
          🎬 Creating your video
        </h3>

        <p>
          DuncanAI is animating your image with AI.
        </p>

        <div class="video-status">
          ${escapeHtml(message)}
        </div>

        <div class="video-progress">
          <span></span>
        </div>

        <p style="margin-top:16px;font-size:13px;">
          Please keep this page open while your
          video is being created.
        </p>

      </div>
    `;
  }

  // =========================================
  // Read JSON safely
  // =========================================

  async function readJsonResponse(response) {

    const text =
      await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        error:
          text ||
          `Server returned HTTP ${response.status}`
      };
    }
  }

  // =========================================
  // Wait helper
  // =========================================

  function wait(milliseconds) {
    return new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          milliseconds
        )
    );
  }

  // =========================================
  // Escape HTML
  // =========================================

  function escapeHtml(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
