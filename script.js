document.addEventListener("DOMContentLoaded", () => {
  const creator = document.getElementById("creator");
  const creatorTitle = document.getElementById("creator-title");
  const closeCreator = document.getElementById("close-creator");

  const promptInput = document.getElementById("prompt");
  const aspectInput = document.getElementById("aspect");
  const generateButton = document.getElementById("generate");
  const result = document.getElementById("result");

  // -----------------------------
  // OPEN CREATOR
  // -----------------------------

  const toolButtons = document.querySelectorAll(".tool-button");

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tool = button.dataset.tool;

      if (tool === "image") {
        creatorTitle.textContent = "Create Image";
        promptInput.placeholder =
          "Example: A cinematic sunrise over the African savanna, dramatic clouds, warm light, ultra detailed...";

        creator.classList.remove("hidden");
        creator.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        promptInput.focus();
      }

      if (tool === "image-video") {
        creatorTitle.textContent = "Image → Video";

        creator.classList.remove("hidden");
        creator.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      if (tool === "video") {
        creatorTitle.textContent = "Text → Video";

        creator.classList.remove("hidden");
        creator.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        result.innerHTML = `
          <div class="result-placeholder">
            🎬 Text → Video is coming next.
          </div>
        `;
      }

      if (tool === "edit") {
        creatorTitle.textContent = "Edit & Enhance";

        creator.classList.remove("hidden");
        creator.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        result.innerHTML = `
          <div class="result-placeholder">
            ✨ AI editing and enhancement is coming next.
          </div>
        `;
      }
    });
  });

  // -----------------------------
  // CLOSE CREATOR
  // -----------------------------

  if (closeCreator) {
    closeCreator.addEventListener("click", () => {
      creator.classList.add("hidden");
    });
  }

  // -----------------------------
  // GENERATE IMAGE
  // -----------------------------

  if (!generateButton) {
    console.error("DuncanAI: Generate button not found.");
    return;
  }

  generateButton.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();

    let aspectRatio = "16:9";

    if (aspectInput.value.startsWith("1:1")) {
      aspectRatio = "1:1";
    } else if (aspectInput.value.startsWith("9:16")) {
      aspectRatio = "9:16";
    }

    // Validate prompt
    if (!prompt || prompt.length < 5) {
      result.innerHTML = `
        <div class="result-placeholder">
          Please enter a description of at least 5 characters.
        </div>
      `;
      return;
    }

    // Loading state
    generateButton.disabled = true;
    generateButton.textContent = "Creating...";

    result.innerHTML = `
      <div class="result-placeholder">
        ✨ DuncanAI is creating your image...
      </div>
    `;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          aspectRatio
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Image generation failed."
        );
      }

      if (!data.imageUrl) {
        throw new Error("No image was returned.");
      }

      // Display image
      result.innerHTML = "";

      const image = document.createElement("img");

      image.src = data.imageUrl;
      image.alt = prompt;

      image.style.width = "100%";
      image.style.maxWidth = "100%";
      image.style.borderRadius = "16px";
      image.style.display = "block";

      result.appendChild(image);

      // Download button
      const downloadButton = document.createElement("button");

      downloadButton.textContent = "Download Image";
      downloadButton.className = "primary";
      downloadButton.style.marginTop = "16px";

      downloadButton.addEventListener("click", () => {
        const link = document.createElement("a");

        link.href = data.imageUrl;
        link.download = "duncanai-image.png";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      result.appendChild(downloadButton);

    } catch (error) {
      console.error("DuncanAI generation error:", error);

      result.innerHTML = `
        <div class="result-placeholder">
          ❌ ${error.message || "Something went wrong. Please try again."}
        </div>
      `;

    } finally {
      generateButton.disabled = false;
      generateButton.textContent = "Generate";
    }
  });
});
