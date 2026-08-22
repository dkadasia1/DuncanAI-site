document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("generate-form");
  const promptInput = document.getElementById("prompt");
  const aspectRatioInput = document.getElementById("aspect-ratio");
  const output = document.getElementById("output");
  const loading = document.getElementById("loading");
  const downloadBtn = document.getElementById("download");

  // Make sure the page has the required elements
  if (!form) {
    console.error("DuncanAI: generate-form was not found.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const prompt = promptInput?.value?.trim();
    const aspectRatio = aspectRatioInput?.value || "1:1";

    if (!prompt || prompt.length < 5) {
      if (output) {
        output.innerHTML =
          '<p class="error">Please enter a prompt with at least 5 characters.</p>';
      }
      return;
    }

    // Show loading state
    if (loading) {
      loading.style.display = "block";
      loading.textContent = "Creating your image...";
    }

    if (output) {
      output.innerHTML = "";
    }

    if (downloadBtn) {
      downloadBtn.style.display = "none";
    }

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

      // Create image
      const img = document.createElement("img");

      img.src = data.imageUrl;
      img.alt = prompt;
      img.loading = "lazy";

      if (output) {
        output.appendChild(img);
      }

      // Show download button
      if (downloadBtn) {
        downloadBtn.style.display = "inline-block";

        downloadBtn.onclick = () => {
          const link = document.createElement("a");

          link.href = data.imageUrl;
          link.download = "duncanai-generated-image.png";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
      }

    } catch (error) {
      console.error("DuncanAI error:", error);

      if (output) {
        output.innerHTML = `
          <p class="error">
            ${error.message || "Something went wrong. Please try again."}
          </p>
        `;
      }

    } finally {
      if (loading) {
        loading.style.display = "none";
      }
    }
  });
});
