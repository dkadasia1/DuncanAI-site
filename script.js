document.addEventListener("DOMContentLoaded", () => {
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

  // -----------------------------------------
  // Open creator
  // -----------------------------------------

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentTool = button.dataset.tool;

      creator.classList.remove("hidden");

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

      if (currentTool === "image-video") {
        creatorTitle.textContent = "Image → Video";

        promptInput.placeholder =
          "Example: Slowly move the camera toward the woman while her hair moves gently in the ocean breeze...";

        showImageVideoInterface();
      }

      if (currentTool === "video") {
        creatorTitle.textContent = "Text → Video";

        result.innerHTML = `
          <div class="result-placeholder">
            Text → Video is coming next.
          </div>
        `;
      }

      if (currentTool === "edit") {
        creatorTitle.textContent = "Edit & Enhance";

        result.innerHTML = `
          <div class="result-placeholder">
            AI image editing is coming next.
          </div>
        `;
      }

      creator.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  // -----------------------------------------
  // Close creator
  // -----------------------------------------

  if (closeCreator) {
    closeCreator.addEventListener("click", () => {
      creator.classList.add("hidden");
    });
  }

  // -----------------------------------------
  // Image → Video upload interface
  // -----------------------------------------

  function showImageVideoInterface() {
    uploadedImage = null;

    result.innerHTML = `
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
          Upload the image you want DuncanAI to animate.
        </p>

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

  // -----------------------------------------
  // Read uploaded image
  // -----------------------------------------

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Keep image size reasonable
    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      uploadedImage = reader.result;

      const preview =
        document.getElementById("image-preview");

      if (preview) {
        preview.innerHTML = `
          <img
            src="${uploadedImage}"
            alt="Uploaded image"
            class="uploaded-preview"
          />
        `;
      }
    };

    reader.readAsDataURL(file);
  }

  // -----------------------------------------
  // Generate button
  // -----------------------------------------

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
              Text → Video is coming next.
            </div>
          `;
          return;
        }

        if (currentTool === "edit") {
          result.innerHTML = `
            <div class="result-placeholder">
              AI image editing is coming next.
            </div>
          `;
        }
      }
    );
  }

  // -----------------------------------------
  // Text → Image
  // -----------------------------------------

  async function generateImage() {
    const prompt = promptInput.value.trim();

    if (prompt.length < 5) {
      result.innerHTML = `
        <p class="error">
          Please enter a description of at least 5 characters.
        </p>
      `;
      return;
    }

    if (prompt.length > 32000) {
      result.innerHTML = `
        <p class="error">
          Your prompt is too long. Please keep it under
          32,000 characters.
        </p>
      `;
      return;
    }

    const aspectRatio = getAspectRatio();

    setLoading("Creating your image...");

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

      const data = await response.json();

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
            src="${data.imageUrl}"
            alt="${escapeHtml(
              prompt.substring(0, 100)
            )}"
          />

          <a
            href="${data.imageUrl}"
            download="duncanai-image.png"
            class="primary download-button"
          >
            Download Image
          </a>

        </div>
      `;

    } catch (error) {

      result.innerHTML = `
        <p class="error">
          ❌ ${escapeHtml(error.message)}
        </p>
      `;
    }
  }

  // -----------------------------------------
  // Image → Video
  // -----------------------------------------

  async function generateImageVideo() {

    if (!uploadedImage) {
      result.innerHTML = `
        <p class="error">
          Please upload an image first.
        </p>
      `;
      return;
    }

    const prompt = promptInput.value.trim();

    if (prompt.length < 5) {
      result.innerHTML = `
        <p class="error">
          Please describe the movement you want
          in the video.
        </p>
      `;
      return;
    }

    if (prompt.length > 1000) {
      result.innerHTML = `
        <p class="error">
          Video prompts must be under 1,000 characters.
        </p>
      `;
      return;
    }

    const aspectRatio = getAspectRatio();

    setLoading(
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

      const data = await response.json();

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
        <p class="error">
          ❌ ${escapeHtml(error.message)}
        </p>
      `;
    }
  }

  // -----------------------------------------
  // Poll Runway task
  // -----------------------------------------

  async function pollVideoStatus(taskId) {

    const maxAttempts = 60;

    for (
      let attempts = 1;
      attempts <= maxAttempts;
      attempts++
    ) {

      setLoading(
        `Creating your video... (${attempts}/${maxAttempts})`
      );

      await wait(5000);

      try {

        const response = await fetch(
          `/api/video-status?taskId=${encodeURIComponent(
            taskId
          )}`
        );

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(
            data.error ||
            "Unable to check video status."
          );
        }

        console.log(
          "Video status:",
          data.status
        );

        if (
          data.status === "SUCCEEDED"
        ) {

          if (!data.videoUrl) {
            throw new Error(
              "Runway finished the video but did not return a video URL."
            );
          }

          showGeneratedVideo(
            data.videoUrl
          );

          return;
        }

        if (
          data.status === "FAILED"
        ) {

          throw new Error(
            data.error ||
            "Runway video generation failed."
          );
        }

      } catch (error) {

        result.innerHTML = `
          <p class="error">
            ❌ ${escapeHtml(
              error.message
            )}
          </p>
        `;

        return;
      }
    }

    result.innerHTML = `
      <p class="error">
        ❌ Video generation is taking longer
        than expected. Please try again.
      </p>
    `;
  }

  // -----------------------------------------
  // Display generated video
  // -----------------------------------------

  function showGeneratedVideo(videoUrl) {

    result.innerHTML = `
      <div class="generated-result">

        <video
          controls
          autoplay
          playsinline
          preload="metadata"
          class="generated-video"
        >
          <source
            src="${videoUrl}"
            type="video/mp4"
          >

          Your browser does not support
          video playback.
        </video>

        <div class="video-actions">

          <a
            href="${videoUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="primary download-button"
          >
            Open Video
          </a>

          <a
            href="${videoUrl}"
            download="duncanai-video.mp4"
            class="secondary download-button"
          >
            Download Video
          </a>

        </div>

      </div>
    `;

    const video =
      result.querySelector("video");

    if (video) {
      video.addEventListener(
        "error",
        () => {
          console.error(
            "Browser could not play video:",
            video.error
          );
        }
      );
    }
  }

  // -----------------------------------------
  // Aspect ratio
  // -----------------------------------------

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

  // -----------------------------------------
  // Loading
  // -----------------------------------------

  function setLoading(message) {

    result.innerHTML = `
      <div
        class="result-placeholder loading"
      >
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

  // -----------------------------------------
  // Utility
  // -----------------------------------------

  function wait(milliseconds) {

    return new Promise(
      (resolve) => {
        setTimeout(
          resolve,
          milliseconds
        );
      }
    );
  }

  function escapeHtml(value) {

    return String(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }
});
