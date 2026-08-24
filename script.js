document.addEventListener("DOMContentLoaded", () => {

  // =========================================
  // DUNCANAI ELEMENTS
  // =========================================

  const toolButtons =
    document.querySelectorAll(".tool-button");

  const creator =
    document.getElementById("creator");

  const creatorTitle =
    document.getElementById("creator-title");

  const closeCreator =
    document.getElementById("close-creator");

  const promptInput =
    document.getElementById("prompt");

  const aspectSelect =
    document.getElementById("aspect");

  const generateButton =
    document.getElementById("generate");

  const result =
    document.getElementById("result");


  // =========================================
  // MY CREATIONS ELEMENTS
  // =========================================

  const creationsGrid =
    document.getElementById("creations-grid");

  const clearCreationsButton =
    document.getElementById("clear-creations");

  const creationFilterButtons =
    document.querySelectorAll(
      ".creation-filter-button"
    );


  // =========================================
  // STORAGE
  // =========================================

  const LOCAL_CREATIONS_KEY =
    "duncanai_creations_v1";

  const MIGRATION_KEY_PREFIX =
    "duncanai_cloud_migrated_";


  // =========================================
  // STATE
  // =========================================

  let currentTool = "image";
  let uploadedImage = null;
  let currentFilter = "all";
  let currentUser = null;
  let cloudCreations = [];
  let cloudMode = false;


  // =========================================
  // SUPABASE
  // =========================================

  const supabase =
    window.supabaseClient || null;


  // =========================================
  // SAFE LOCAL STORAGE
  // =========================================

  function getLocalCreations() {

    try {

      const saved =
        window.localStorage.getItem(
          LOCAL_CREATIONS_KEY
        );

      if (!saved) {
        return [];
      }

      const parsed =
        JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch (error) {

      console.error(
        "DuncanAI local storage read error:",
        error
      );

      return [];
    }
  }


  function saveLocalCreations(
    creations
  ) {

    try {

      window.localStorage.setItem(
        LOCAL_CREATIONS_KEY,
        JSON.stringify(creations)
      );

      return true;

    } catch (error) {

      console.error(
        "DuncanAI local storage write error:",
        error
      );

      return false;
    }
  }


  // =========================================
  // NOTIFICATIONS
  // =========================================

  function showSaveMessage(
    message
  ) {

    const existing =
      document.getElementById(
        "duncanai-save-message"
      );

    if (existing) {
      existing.remove();
    }


    const messageBox =
      document.createElement("div");


    messageBox.id =
      "duncanai-save-message";


    messageBox.textContent =
      message;


    messageBox.style.cssText = `
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 9999;
      max-width: 360px;
      padding: 14px 18px;
      border-radius: 12px;
      background: rgba(16,24,39,.97);
      color: #f8fafc;
      border: 1px solid rgba(255,255,255,.12);
      box-shadow: 0 20px 50px rgba(0,0,0,.35);
      font-size: 14px;
      font-weight: 700;
      line-height: 1.5;
    `;


    document.body.appendChild(
      messageBox
    );


    setTimeout(() => {

      if (messageBox) {
        messageBox.remove();
      }

    }, 3500);
  }


  // =========================================
  // AUTH USER
  // =========================================

  async function getCurrentUser() {

    if (!supabase) {
      return null;
    }

    try {

      const {
        data,
        error
      } =
        await supabase.auth.getUser();


      if (error) {
        throw error;
      }


      return data?.user || null;

    } catch (error) {

      console.error(
        "DuncanAI user lookup error:",
        error
      );

      return null;
    }
  }


  // =========================================
  // LOAD CLOUD CREATIONS
  // =========================================

  async function loadCloudCreations() {

    if (!supabase || !currentUser) {
      return [];
    }


    try {

      const {
        data,
        error
      } =
        await supabase
          .from("creations")
          .select(
            "id,user_id,type,url,prompt,aspect_ratio,created_at"
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (error) {
        throw error;
      }


      cloudCreations =
        Array.isArray(data)
          ? data
          : [];


      cloudMode = true;


      return cloudCreations;

    } catch (error) {

      console.error(
        "DuncanAI cloud creations load error:",
        error
      );


      cloudMode = false;


      showSaveMessage(
        "Cloud library could not be loaded. Using local creations."
      );


      return [];
    }
  }


  // =========================================
  // SAVE LOCAL CREATION
  // =========================================

  function saveLocalCreation({
    type,
    url,
    prompt,
    aspectRatio
  }) {

    const creation = {

      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`,

      type,

      url,

      prompt:
        prompt ||
        "DuncanAI creation",

      aspectRatio:
        aspectRatio ||
        "16:9",

      createdAt:
        new Date().toISOString()
    };


    const existing =
      getLocalCreations();


    const updated = [
      creation,
      ...existing
    ].slice(
      0,
      50
    );


    const saved =
      saveLocalCreations(
        updated
      );


    if (saved) {
      renderCreations();
    }


    return saved;
  }


  // =========================================
  // SAVE CLOUD CREATION
  // =========================================

  async function saveCloudCreation({
    type,
    url,
    prompt,
    aspectRatio
  }) {

    if (
      !supabase ||
      !currentUser
    ) {
      return false;
    }


    try {

      const {
        data,
        error
      } =
        await supabase
          .from("creations")
          .insert({
            user_id:
              currentUser.id,

            type,

            url,

            prompt:
              prompt ||
              "DuncanAI creation",

            aspect_ratio:
              aspectRatio ||
              "16:9"
          })
          .select()
          .single();


      if (error) {
        throw error;
      }


      if (data) {

        cloudCreations = [
          data,
          ...cloudCreations
        ];

      }


      cloudMode = true;


      renderCreations();


      showSaveMessage(
        type === "image"
          ? "✓ Image saved to your cloud library"
          : "✓ Video saved to your cloud library"
      );


      return true;

    } catch (error) {

      console.error(
        "DuncanAI cloud creation save error:",
        error
      );


      return false;
    }
  }


  // =========================================
  // SAVE CREATION
  // =========================================

  async function saveCreation({
    type,
    url,
    prompt,
    aspectRatio
  }) {

    if (!type || !url) {

      console.error(
        "DuncanAI: invalid creation data."
      );

      return false;
    }


    // Always keep a local backup.
    saveLocalCreation({
      type,
      url,
      prompt,
      aspectRatio
    });


    // Signed-in users go to Supabase.
    if (
      currentUser &&
      supabase
    ) {

      const cloudSaved =
        await saveCloudCreation({
          type,
          url,
          prompt,
          aspectRatio
        });


      if (cloudSaved) {
        return true;
      }


      showSaveMessage(
        "✓ Creation saved locally. Cloud save failed."
      );


      return true;
    }


    // Signed-out users remain local.
    showSaveMessage(
      "✓ Creation saved on this device"
    );


    return true;
  }


  // =========================================
  // MIGRATE LOCAL CREATIONS
  // =========================================

  async function migrateLocalCreations() {

    if (
      !currentUser ||
      !supabase
    ) {
      return;
    }


    const migrationKey =
      MIGRATION_KEY_PREFIX +
      currentUser.id;


    try {

      if (
        window.localStorage.getItem(
          migrationKey
        ) === "done"
      ) {
        return;
      }

    } catch {
      // Continue without migration flag.
    }


    const localCreations =
      getLocalCreations();


    if (
      localCreations.length === 0
    ) {

      try {

        window.localStorage.setItem(
          migrationKey,
          "done"
        );

      } catch {}

      return;
    }


    let migratedCount = 0;


    for (
      const creation
      of localCreations
    ) {

      try {

        const {
          error
        } =
          await supabase
            .from("creations")
            .insert({
              user_id:
                currentUser.id,

              type:
                creation.type,

              url:
                creation.url,

              prompt:
                creation.prompt ||
                "DuncanAI creation",

              aspect_ratio:
                creation.aspectRatio ||
                "16:9",

              created_at:
                creation.createdAt ||
                new Date().toISOString()
            });


        if (!error) {
          migratedCount++;
        }

      } catch (error) {

        console.error(
          "DuncanAI migration error:",
          error
        );
      }
    }


    await loadCloudCreations();


    try {

      window.localStorage.setItem(
        migrationKey,
        "done"
      );

    } catch {}


    if (
      migratedCount > 0
    ) {

      showSaveMessage(
        `${migratedCount} creation${
          migratedCount === 1
            ? ""
            : "s"
        } moved to your cloud library`
      );
    }
  }


  // =========================================
  // DELETE CLOUD CREATION
  // =========================================

  async function deleteCloudCreation(
    id
  ) {

    if (
      !supabase ||
      !currentUser
    ) {
      return false;
    }


    try {

      const {
        error
      } =
        await supabase
          .from("creations")
          .delete()
          .eq(
            "id",
            id
          );


      if (error) {
        throw error;
      }


      cloudCreations =
        cloudCreations.filter(
          (creation) =>
            creation.id !== id
        );


      renderCreations();


      showSaveMessage(
        "Creation deleted"
      );


      return true;

    } catch (error) {

      console.error(
        "DuncanAI cloud deletion error:",
        error
      );


      showSaveMessage(
        "Unable to delete that creation."
      );


      return false;
    }
  }


  // =========================================
  // DELETE LOCAL CREATION
  // =========================================

  function deleteLocalCreation(
    id
  ) {

    const existing =
      getLocalCreations();


    const updated =
      existing.filter(
        (creation) =>
          creation.id !== id
      );


    saveLocalCreations(
      updated
    );
  }


  // =========================================
  // DELETE CREATION
  // =========================================

  async function deleteCreation(
    id,
    source
  ) {

    if (
      source === "cloud"
    ) {

      await deleteCloudCreation(
        id
      );

      return;
    }


    deleteLocalCreation(
      id
    );


    renderCreations();


    showSaveMessage(
      "Creation deleted"
    );
  }


  // =========================================
  // CLEAR ALL CREATIONS
  // =========================================

  async function clearAllCreations() {

    const confirmed =
      window.confirm(
        currentUser
          ? "Delete all of your cloud creations?"
          : "Delete all saved creations from this device?"
      );


    if (!confirmed) {
      return;
    }


    if (
      currentUser &&
      supabase
    ) {

      try {

        const {
          error
        } =
          await supabase
            .from("creations")
            .delete()
            .eq(
              "user_id",
              currentUser.id
            );


        if (error) {
          throw error;
        }


        cloudCreations = [];


        renderCreations();


        showSaveMessage(
          "Your cloud creations were cleared."
        );


        return;

      } catch (error) {

        console.error(
          "DuncanAI cloud clear error:",
          error
        );


        showSaveMessage(
          "Unable to clear your cloud creations."
        );


        return;
      }
    }


    try {

      window.localStorage.removeItem(
        LOCAL_CREATIONS_KEY
      );

    } catch {}


    renderCreations();


    showSaveMessage(
      "Local creations were cleared."
    );
  }


  // =========================================
  // ACTIVE CREATIONS
  // =========================================

  function getActiveCreations() {

    if (
      currentUser &&
      cloudMode
    ) {

      return cloudCreations;
    }


    return getLocalCreations();
  }


  // =========================================
  // RENDER MY CREATIONS
  // =========================================

  function renderCreations() {

    if (!creationsGrid) {
      return;
    }


    let creations =
      getActiveCreations();


    if (
      currentFilter !==
      "all"
    ) {

      creations =
        creations.filter(
          (creation) =>
            creation.type ===
            currentFilter
        );
    }


    if (
      creations.length ===
      0
    ) {

      creationsGrid.innerHTML = `
        <div class="creations-empty">

          <div class="creations-empty-icon">
            ✨
          </div>

          <h3>
            ${
              currentUser
                ? "No cloud creations yet"
                : "No creations yet"
            }
          </h3>

          <p>
            ${
              currentUser
                ? "Your generated images and videos will appear here."
                : "Generate an image or video and it will appear here."
            }
          </p>

          <a
            href="#studio"
            class="primary"
          >
            Start Creating
          </a>

        </div>
      `;

      return;
    }


    creationsGrid.innerHTML =
      creations
        .map(
          (creation) =>
            renderCreationCard(
              creation
            )
        )
        .join("");


    attachCreationActions();
  }


  // =========================================
  // CREATION CARD
  // =========================================

  function renderCreationCard(
    creation
  ) {

    const isCloud =
      Boolean(
        currentUser &&
        cloudMode &&
        creation.user_id
      );


    const typeLabel =
      creation.type ===
      "image"
        ? "Image"
        : "Video";


    const prompt =
      truncateText(
        creation.prompt ||
          "DuncanAI creation",
        120
      );


    const createdAt =
      creation.created_at ||
      creation.createdAt;


    const date =
      formatDate(
        createdAt
      );


    let media;


    if (
      creation.type ===
      "image"
    ) {

      media = `
        <img
          src="${escapeHtml(
            creation.url
          )}"
          alt="${escapeHtml(
            prompt
          )}"
          loading="lazy"
        />
      `;

    } else {

      media = `
        <video
          controls
          preload="metadata"
          playsinline
        >

          <source
            src="${escapeHtml(
              creation.url
            )}"
            type="video/mp4"
          />

          Your browser does not support
          video playback.

        </video>
      `;
    }


    return `
      <article
        class="creation-card"
        data-id="${escapeHtml(
          creation.id
        )}"
      >

        <div class="creation-media">
          ${media}
        </div>


        <div class="creation-info">

          <div class="creation-type">
            ${typeLabel}
          </div>


          <div class="creation-prompt">
            ${escapeHtml(
              prompt
            )}
          </div>


          <div class="creation-date">
            ${escapeHtml(
              date
            )}
          </div>


          <div class="creation-actions">

            <a
              href="${escapeHtml(
                creation.url
              )}"
              target="_blank"
              rel="noopener noreferrer"
              class="creation-action"
            >
              Open
            </a>


            <a
              href="${escapeHtml(
                creation.url
              )}"
              download="${
                creation.type ===
                "image"
                  ? "duncanai-image.png"
                  : "duncanai-video.mp4"
              }"
              class="creation-action"
            >
              Download
            </a>


            <button
              type="button"
              class="creation-action delete"
              data-delete-id="${escapeHtml(
                creation.id
              )}"
              data-delete-source="${
                isCloud
                  ? "cloud"
                  : "local"
              }"
            >
              Delete
            </button>

          </div>

        </div>

      </article>
    `;
  }


  // =========================================
  // DELETE BUTTONS
  // =========================================

  function attachCreationActions() {

    const buttons =
      document.querySelectorAll(
        "[data-delete-id]"
      );


    buttons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.deleteId;

            const source =
              button.dataset.deleteSource ||
              "local";


            await deleteCreation(
              id,
              source
            );
          }
        );
      }
    );
  }


  // =========================================
  // DATE
  // =========================================

  function formatDate(
    value
  ) {

    try {

      return new Date(
        value
      ).toLocaleString();

    } catch {

      return "Recently created";
    }
  }


  // =========================================
  // TRUNCATE
  // =========================================

  function truncateText(
    value,
    maxLength
  ) {

    const text =
      String(
        value || ""
      );


    if (
      text.length <=
      maxLength
    ) {

      return text;
    }


    return (
      text.slice(
        0,
        maxLength
      ) + "..."
    );
  }


  // =========================================
  // FILTERS
  // =========================================

  creationFilterButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          currentFilter =
            button.dataset.filter ||
            "all";


          creationFilterButtons.forEach(
            (item) => {

              item.classList.toggle(
                "active",
                item === button
              );
            }
          );


          renderCreations();
        }
      );
    }
  );


  if (
    clearCreationsButton
  ) {

    clearCreationsButton.addEventListener(
      "click",
      clearAllCreations
    );
  }


  // =========================================
  // OPEN CREATOR
  // =========================================

  toolButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          currentTool =
            button.dataset.tool;


          creator.classList.remove(
            "hidden"
          );


          if (
            currentTool ===
            "image"
          ) {

            creatorTitle.textContent =
              "Create Image";


            promptInput.placeholder =
              "Example: A cinematic sunrise over the African savanna, dramatic clouds, warm light...";


            result.innerHTML = `
              <div class="result-placeholder">
                Your generated image will appear here.
              </div>
            `;
          }


          if (
            currentTool ===
            "image-video"
          ) {

            creatorTitle.textContent =
              "Image → Video";


            promptInput.placeholder =
              "Describe the movement you want: slowly move the camera toward the subject, gentle wind moving hair, natural waves...";


            showImageVideoInterface();
          }


          if (
            currentTool ===
            "video"
          ) {

            creatorTitle.textContent =
              "Text → Video";


            promptInput.placeholder =
              "Example: A cinematic drone shot flying over the African savanna at golden hour, dramatic clouds, realistic movement...";


            showTextVideoInterface();
          }


          if (
            currentTool ===
            "edit"
          ) {

            creatorTitle.textContent =
              "Edit & Enhance";


            result.innerHTML = `
              <div class="result-placeholder">

                <strong>
                  ✨ Edit & Enhance
                </strong>

                <p
                  style="margin-top:8px;"
                >
                  AI image editing is coming next.
                </p>

              </div>
            `;
          }


          creator.scrollIntoView({
            behavior:
              "smooth",
            block:
              "start"
          });
        }
      );
    }
  );


  // =========================================
  // CLOSE CREATOR
  // =========================================

  if (
    closeCreator
  ) {

    closeCreator.addEventListener(
      "click",
      () => {

        creator.classList.add(
          "hidden"
        );

        uploadedImage =
          null;
      }
    );
  }


  // =========================================
  // IMAGE → VIDEO INTERFACE
  // =========================================

  function showImageVideoInterface() {

    uploadedImage =
      null;


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


          <div
            id="image-preview"
          ></div>


          <p class="upload-help">
            Upload an image you want DuncanAI to animate.
            JPG, PNG, or WebP.
          </p>

        </div>

      </div>
    `;


    const uploadInput =
      document.getElementById(
        "video-image-upload"
      );


    if (
      uploadInput
    ) {

      uploadInput.addEventListener(
        "change",
        handleImageUpload
      );
    }
  }


  // =========================================
  // TEXT → VIDEO INTERFACE
  // =========================================

  function showTextVideoInterface() {

    uploadedImage =
      null;


    result.innerHTML = `
      <div class="video-workspace">

        <div class="video-generation-panel">

          <h3>
            🎬 Create Video From Text
          </h3>


          <p>
            Describe the scene, camera movement,
            subjects, atmosphere, and visual style.
          </p>


          <div
            class="video-source-card"
            style="margin-top:20px;"
          >

            <div class="video-source-title">
              💡 Prompt examples
            </div>


            <p
              style="
                text-align:left;
                margin:8px 0;
              "
            >
              • Cinematic drone shot over a modern city at sunrise.
            </p>


            <p
              style="
                text-align:left;
                margin:8px 0;
              "
            >
              • A woman walking along the ocean while waves move naturally.
            </p>


            <p
              style="
                text-align:left;
                margin:8px 0;
              "
            >
              • A luxury car driving through a futuristic city at night.
            </p>

          </div>

        </div>

      </div>
    `;
  }


  // =========================================
  // IMAGE UPLOAD
  // =========================================

  function handleImageUpload(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      alert(
        "Please select an image file."
      );


      event.target.value =
        "";


      return;
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        "Please choose an image smaller than 5 MB."
      );


      event.target.value =
        "";


      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      uploadedImage =
        reader.result;


      const preview =
        document.getElementById(
          "image-preview"
        );


      if (!preview) {
        return;
      }


      preview.innerHTML = `
        <div class="video-source-card">

          <div class="video-source-title">
            🖼️ Source Image
          </div>


          <img
            src="${escapeHtml(
              uploadedImage
            )}"
            alt="Uploaded source image"
            class="video-source-image"
          />

        </div>
      `;
    };


    reader.onerror = () => {

      uploadedImage =
        null;


      result.innerHTML = `
        <div class="error">
          Unable to read that image.
          Please try another image.
        </div>
      `;
    };


    reader.readAsDataURL(
      file
    );
  }


  // =========================================
  // GENERATE BUTTON
  // =========================================

  if (
    generateButton
  ) {

    generateButton.addEventListener(
      "click",
      async () => {

        if (
          currentTool ===
          "image"
        ) {

          await generateImage();

          return;
        }


        if (
          currentTool ===
          "image-video"
        ) {

          await generateImageVideo();

          return;
        }


        if (
          currentTool ===
          "video"
        ) {

          await generateTextVideo();

          return;
        }


        if (
          currentTool ===
          "edit"
        ) {

          result.innerHTML = `
            <div class="result-placeholder">

              <strong>
                ✨ Edit & Enhance
              </strong>


              <p
                style="margin-top:8px;"
              >
                AI image editing is coming next.
              </p>

            </div>
          `;
        }
      }
    );
  }


  // =========================================
  // TEXT → IMAGE
  // =========================================

  async function generateImage() {

    const prompt =
      promptInput.value.trim();


    if (
      prompt.length <
      5
    ) {

      result.innerHTML = `
        <div class="error">
          Please enter a description of at least 5 characters.
        </div>
      `;


      return;
    }


    if (
      prompt.length >
      32000
    ) {

      result.innerHTML = `
        <div class="error">
          Your prompt is too long.
          Please keep it under 32,000 characters.
        </div>
      `;


      return;
    }


    const aspectRatio =
      getAspectRatio();


    setStandardLoading(
      "Creating your image..."
    );


    try {

      const response =
        await fetch(
          "/api/generate",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                prompt,
                aspectRatio
              })
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (
        !response.ok ||
        data.error
      ) {

        throw new Error(
          data.error ||
          "Image generation failed."
        );
      }


      if (
        !data.imageUrl
      ) {

        throw new Error(
          "No image was returned."
        );
      }


      result.innerHTML = `
        <div class="generated-result">

          <img
            src="${escapeHtml(
              data.imageUrl
            )}"
            alt="${escapeHtml(
              prompt.substring(
                0,
                100
              )
            )}"
          />


          <a
            href="${escapeHtml(
              data.imageUrl
            )}"
            download="duncanai-image.png"
            class="primary download-button"
          >
            ⬇ Download Image
          </a>

        </div>
      `;


      await saveCreation({
        type:
          "image",

        url:
          data.imageUrl,

        prompt,

        aspectRatio
      });


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
  // IMAGE → VIDEO
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


    const prompt =
      promptInput.value.trim();


    if (
      prompt.length <
      5
    ) {

      result.innerHTML = `
        <div class="error">
          Please describe the movement you want
          in the video.
        </div>
      `;


      return;
    }


    if (
      prompt.length >
      1000
    ) {

      result.innerHTML = `
        <div class="error">
          Video prompts must be under 1,000 characters.
        </div>
      `;


      return;
    }


    const aspectRatio =
      getAspectRatio();


    setVideoLoading(
      "Sending your image to DuncanAI..."
    );


    generateButton.disabled =
      true;


    generateButton.textContent =
      "Creating...";


    try {

      const response =
        await fetch(
          "/api/image-to-video",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                image:
                  uploadedImage,

                prompt,

                aspectRatio,

                duration:
                  5
              })
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (
        !response.ok ||
        data.error
      ) {

        throw new Error(
          data.error ||
          "Unable to start video generation."
        );
      }


      if (
        !data.taskId
      ) {

        throw new Error(
          "Runway did not return a video task ID."
        );
      }


      await pollVideoStatus(
        data.taskId,
        {
          prompt,
          aspectRatio
        }
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

      generateButton.disabled =
        false;


      generateButton.textContent =
        "Generate";
    }
  }


  // =========================================
  // TEXT → VIDEO
  // =========================================

  async function generateTextVideo() {

    const prompt =
      promptInput.value.trim();


    if (
      prompt.length <
      5
    ) {

      result.innerHTML = `
        <div class="error">
          Please describe the video you want to create.
        </div>
      `;


      return;
    }


    if (
      prompt.length >
      1000
    ) {

      result.innerHTML = `
        <div class="error">
          Video prompts must be under 1,000 characters.
        </div>
      `;


      return;
    }


    const aspectRatio =
      getAspectRatio();


    if (
      aspectRatio ===
      "1:1"
    ) {

      result.innerHTML = `
        <div class="error">
          Text → Video currently supports
          16:9 and 9:16.
        </div>
      `;


      return;
    }


    setVideoLoading(
      "Sending your text prompt to DuncanAI..."
    );


    generateButton.disabled =
      true;


    generateButton.textContent =
      "Creating...";


    try {

      const response =
        await fetch(
          "/api/text-to-video",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                prompt,

                aspectRatio,

                duration:
                  5
              })
          }
        );


      const data =
        await readJsonResponse(
          response
        );


      if (
        !response.ok ||
        data.error
      ) {

        throw new Error(
          data.error ||
          "Unable to start text-to-video generation."
        );
      }


      if (
        !data.taskId
      ) {

        throw new Error(
          "Runway did not return a video task ID."
        );
      }


      await pollVideoStatus(
        data.taskId,
        {
          prompt,
          aspectRatio
        }
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

      generateButton.disabled =
        false;


      generateButton.textContent =
        "Generate";
    }
  }


  // =========================================
  // POLL VIDEO STATUS
  // =========================================

  async function pollVideoStatus(
    taskId,
    creationInfo = {}
  ) {

    const maxAttempts =
      60;


    for (
      let attempts = 1;
      attempts <= maxAttempts;
      attempts++
    ) {

      let message =
        "Preparing your video...";


      if (
        attempts <=
        2
      ) {

        message =
          "Preparing your video...";

      } else if (
        attempts <=
        8
      ) {

        message =
          "Generating your video...";

      } else {

        message =
          "Finalizing your video...";
      }


      setVideoLoading(
        `${message} (${attempts}/${maxAttempts})`
      );


      await wait(
        5000
      );


      try {

        const response =
          await fetch(
            `/api/video-status?taskId=${encodeURIComponent(
              taskId
            )}&_=${Date.now()}`
          );


        const data =
          await readJsonResponse(
            response
          );


        if (
          !response.ok ||
          data.error
        ) {

          throw new Error(
            data.error ||
            "Unable to check video status."
          );
        }


        console.log(
          "DuncanAI video status:",
          data.status
        );


        if (
          data.status ===
          "SUCCEEDED"
        ) {

          if (
            !data.videoUrl
          ) {

            throw new Error(
              "Runway completed the video but did not return a video URL."
            );
          }


          await showGeneratedVideo(
            data.videoUrl,
            creationInfo
          );


          return;
        }


        if (
          data.status ===
          "FAILED"
        ) {

          throw new Error(
            data.error ||
            "Runway video generation failed."
          );
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
  // SHOW GENERATED VIDEO
  // =========================================

  async function showGeneratedVideo(
    videoUrl,
    creationInfo = {}
  ) {

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
              src="${escapeHtml(
                videoUrl
              )}"
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
              href="${escapeHtml(
                videoUrl
              )}"
              target="_blank"
              rel="noopener noreferrer"
              class="video-open"
            >
              ↗ Open Video
            </a>


            <a
              href="${escapeHtml(
                videoUrl
              )}"
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


    await saveCreation({
      type:
        "video",

      url:
        videoUrl,

      prompt:
        creationInfo.prompt ||
        "DuncanAI video",

      aspectRatio:
        creationInfo.aspectRatio ||
        "16:9"
    });


    const newVideoButton =
      document.getElementById(
        "create-another-video"
      );


    if (
      newVideoButton
    ) {

      newVideoButton.addEventListener(
        "click",
        () => {

          uploadedImage =
            null;


          promptInput.value =
            "";


          if (
            currentTool ===
            "image-video"
          ) {

            showImageVideoInterface();

          } else {

            showTextVideoInterface();
          }


          promptInput.focus();
        }
      );
    }


    const video =
      result.querySelector(
        ".video-result-player"
      );


    if (
      video
    ) {

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
  // ASPECT RATIO
  // =========================================

  function getAspectRatio() {

    const value =
      aspectSelect?.value ||
      "";


    if (
      value.includes(
        "1:1"
      )
    ) {

      return "1:1";
    }


    if (
      value.includes(
        "9:16"
      )
    ) {

      return "9:16";
    }


    return "16:9";
  }


  // =========================================
  // STANDARD LOADING
  // =========================================

  function setStandardLoading(
    message
  ) {

    result.innerHTML = `
      <div
        class="result-placeholder loading"
      >

        <div class="spinner"></div>


        <p>
          ${escapeHtml(
            message
          )}
        </p>


        <small>
          Please wait...
        </small>

      </div>
    `;
  }


  // =========================================
  // VIDEO LOADING
  // =========================================

  function setVideoLoading(
    message
  ) {

    result.innerHTML = `
      <div class="video-generation-panel">

        <div class="spinner"></div>


        <h3>
          🎬 Creating your video
        </h3>


        <p>
          DuncanAI is generating your video with AI.
        </p>


        <div class="video-status">
          ${escapeHtml(
            message
          )}
        </div>


        <div class="video-progress">
          <span></span>
        </div>


        <p
          style="
            margin-top:16px;
            font-size:13px;
          "
        >
          Please keep this page open while your
          video is being created.
        </p>

      </div>
    `;
  }


  // =========================================
  // JSON RESPONSE
  // =========================================

  async function readJsonResponse(
    response
  ) {

    const text =
      await response.text();


    if (!text) {
      return {};
    }


    try {

      return JSON.parse(
        text
      );

    } catch {

      return {
        error:
          text ||
          `Server returned HTTP ${response.status}`
      };
    }
  }


  // =========================================
  // WAIT
  // =========================================

  function wait(
    milliseconds
  ) {

    return new Promise(
      (resolve) => {

        setTimeout(
          resolve,
          milliseconds
        );
      }
    );
  }


  // =========================================
  // ESCAPE HTML
  // =========================================

  function escapeHtml(
    value
  ) {

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


  // =========================================
  // LOAD USER + CLOUD LIBRARY
  // =========================================

  async function initializeCloudLibrary() {

    if (!supabase) {

      renderCreations();

      return;
    }


    currentUser =
      await getCurrentUser();


    if (!currentUser) {

      cloudMode = false;

      renderCreations();

      return;
    }


    cloudMode = true;


    await loadCloudCreations();


    await migrateLocalCreations();


    await loadCloudCreations();


    renderCreations();
  }


  // =========================================
  // AUTH CHANGES
  // =========================================

  if (
    supabase
  ) {

    supabase.auth.onAuthStateChange(
      async (
        event,
        session
      ) => {

        console.log(
          "DuncanAI auth event:",
          event
        );


        currentUser =
          session?.user ||
          null;


        if (
          currentUser
        ) {

          cloudMode =
            true;


          await loadCloudCreations();


          await migrateLocalCreations();


          await loadCloudCreations();

        } else {

          currentUser =
            null;

          cloudCreations =
            [];

          cloudMode =
            false;
        }


        renderCreations();
      }
    );
  }


  // =========================================
  // INITIAL GALLERY
  // =========================================

  renderCreations();


  // =========================================
  // INITIAL CLOUD LOAD
  // =========================================

  initializeCloudLibrary();

});
