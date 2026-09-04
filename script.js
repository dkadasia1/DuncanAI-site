  // =========================================
  // EDIT & ENHANCE INTERFACE
  // =========================================

  function showEditEnhanceInterface() {

    uploadedImage = null;

    promptInput.value = "";

    result.innerHTML = `
      <div class="video-workspace">

        <div class="video-generation-panel">

          <h3>
            ✨ Edit & Enhance Your Image
          </h3>

          <p>
            Upload an image, then describe the changes
            you want DuncanAI to make.
          </p>


          <!-- IMAGE UPLOAD -->

          <div
            class="upload-box"
            style="margin-top:20px;"
          >

            <input
              type="file"
              id="edit-image-upload"
              accept="image/png,image/jpeg,image/webp"
            />

            <label
              for="edit-image-upload"
              class="upload-label"
            >
              🖼️ Choose an image
            </label>

            <div
              id="edit-image-preview"
            ></div>

            <p class="upload-help">
              JPG, PNG, or WebP. Maximum 5 MB.
            </p>

          </div>


          <!-- QUICK EDIT PRESETS -->

          <div
            class="video-source-card"
            style="margin-top:20px;"
          >

            <div class="video-source-title">
              ✨ Quick Edit Presets
            </div>

            <p
              style="
                text-align:left;
                margin:8px 0 14px;
              "
            >
              Choose an editing style or describe
              your own changes above.
            </p>


            <div
              style="
                display:grid;
                grid-template-columns:
                  repeat(
                    auto-fit,
                    minmax(140px, 1fr)
                  );
                gap:10px;
              "
            >

              <button
                type="button"
                class="edit-preset-button"
                data-edit-prompt="Enhance the overall image quality, improve sharpness, clarity, detail, and make the image look clean and professional."
              >
                ✨ Enhance Quality
              </button>


              <button
                type="button"
                class="edit-preset-button"
                data-edit-prompt="Improve the lighting, balance the exposure, brighten the subject, and create a natural professional look."
              >
                💡 Improve Lighting
              </button>


              <button
                type="button"
                class="edit-preset-button"
                data-edit-prompt="Enhance the colors, improve contrast, increase richness and vibrancy while keeping the image natural and realistic."
              >
                🎨 Enhance Colors
              </button>


              <button
                type="button"
                class="edit-preset-button"
                data-edit-prompt="Remove distracting elements from the background and make the background cleaner while keeping the main subject natural."
              >
                🧹 Clean Background
              </button>


              <button
                type="button"
                class="edit-preset-button"
                data-edit-prompt="Improve this portrait with natural skin tones, better lighting, sharper details, and a polished professional appearance."
              >
                👤 Improve Portrait
              </button>


              <button
                type="button"
                class="edit-preset-button"
                data-edit-prompt="Restore and enhance this image by improving clarity, reducing imperfections, sharpening details, and making it look cleaner and more natural."
              >
                🖼️ Restore Image
              </button>

            </div>

          </div>

        </div>

      </div>
    `;


    // =========================================
    // EDIT IMAGE UPLOAD
    // =========================================

    const uploadInput =
      document.getElementById(
        "edit-image-upload"
      );


    if (uploadInput) {

      uploadInput.addEventListener(
        "change",
        handleEditImageUpload
      );

    }


    // =========================================
    // EDIT PRESET BUTTONS
    // =========================================

    const presetButtons =
      document.querySelectorAll(
        ".edit-preset-button"
      );


    presetButtons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const editPrompt =
              button.dataset.editPrompt;


            if (!editPrompt) {
              return;
            }


            promptInput.value =
              editPrompt;


            promptInput.focus();


            // Highlight selected preset

            presetButtons.forEach(
              (item) => {

                item.classList.remove(
                  "selected"
                );

              }
            );


            button.classList.add(
              "selected"
            );

          }
        );

      }
    );

  }
