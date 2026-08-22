document.addEventListener("DOMContentLoaded", () => {
  const promptInput = document.getElementById("prompt");
  const aspectInput = document.getElementById("aspect");
  const generateButton = document.getElementById("generate");
  const result = document.getElementById("result");

  if (!promptInput || !aspectInput || !generateButton || !result) {
    console.error("DuncanAI: Required creator elements were not found.");
    return;
  }

  generateButton.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();

    // Convert the dropdown text into the API aspect ratio
    let aspectRatio = "16:9";

    if (aspectInput.value.startsWith("1:1")) {
      aspectRatio = "1:1";
    } else if (aspectInput.value.startsWith("9:16")) {
      aspectRatio = "9:16";
    }

    if (!prompt || prompt.length < 5) {
      result.innerHTML = `
        <div class="result-placeholder">
          Please enter a description of at least 5 characters.
        </div>
      `;
      return;
    }

    // Show loading state
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

      // Display generated image
      result.innerHTML = "";

      const image = document.createElement("img");

      image.src = data.imageUrl;
      image.alt = prompt;
      image.style.maxWidth = "100%";
      image.style.borderRadius = "16px";
      image.style.display = "block";

      result.appendChild(image);

      // Create download button
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
