document.addEventListener("DOMContentLoaded", async () => {
  // =========================================
  // AUTH ELEMENTS
  // =========================================

  const loginButton =
    document.getElementById("login-button");

  const accountButton =
    document.getElementById("account-button");

  const authModal =
    document.getElementById("auth-modal");

  const authBackdrop =
    document.getElementById(
      "auth-modal-backdrop"
    );

  const authClose =
    document.getElementById(
      "auth-close"
    );

  const loginForm =
    document.getElementById(
      "login-form"
    );

  const signupForm =
    document.getElementById(
      "signup-form"
    );

  const authTitle =
    document.getElementById(
      "auth-title"
    );

  const authDescription =
    document.getElementById(
      "auth-description"
    );

  const authSwitchText =
    document.getElementById(
      "auth-switch-text"
    );

  const authSwitchButton =
    document.getElementById(
      "auth-switch-button"
    );

  const authError =
    document.getElementById(
      "auth-error"
    );

  const authSuccess =
    document.getElementById(
      "auth-success"
    );

  const accountMenu =
    document.getElementById(
      "account-menu"
    );

  const accountUserEmail =
    document.getElementById(
      "account-user-email"
    );

  const logoutButton =
    document.getElementById(
      "logout-button"
    );

  // =========================================
  // STATE
  // =========================================

  let showingSignup = false;

  // =========================================
  // SAFETY CHECK
  // =========================================

  if (
    !window.supabase ||
    !window.supabaseClient
  ) {
    console.error(
      "DuncanAI: Supabase client is not available."
    );

    return;
  }

  const supabase =
    window.supabaseClient;

  // =========================================
  // AUTH MODAL
  // =========================================

  function openAuthModal(
    signup = false
  ) {
    showingSignup = signup;

    clearMessages();

    updateAuthView();

    authModal.classList.remove(
      "hidden"
    );

    document.body.style.overflow =
      "hidden";
  }

  function closeAuthModal() {
    authModal.classList.add(
      "hidden"
    );

    document.body.style.overflow =
      "";

    clearMessages();
  }

  function updateAuthView() {
    if (showingSignup) {
      authTitle.textContent =
        "Create your account";

      authDescription.textContent =
        "Create an account to keep your DuncanAI creations with you.";

      loginForm.classList.add(
        "hidden"
      );

      signupForm.classList.remove(
        "hidden"
      );

      authSwitchText.textContent =
        "Already have an account?";

      authSwitchButton.textContent =
        "Log in";
    } else {
      authTitle.textContent =
        "Welcome back";

      authDescription.textContent =
        "Sign in to save your creations across devices.";

      signupForm.classList.add(
        "hidden"
      );

      loginForm.classList.remove(
        "hidden"
      );

      authSwitchText.textContent =
        "Don't have an account?";

      authSwitchButton.textContent =
        "Create one";
    }
  }

  function clearMessages() {
    authError.textContent = "";
    authSuccess.textContent = "";

    authError.classList.add(
      "hidden"
    );

    authSuccess.classList.add(
      "hidden"
    );
  }

  function showError(message) {
    authSuccess.classList.add(
      "hidden"
    );

    authError.textContent =
      message;

    authError.classList.remove(
      "hidden"
    );
  }

  function showSuccess(message) {
    authError.classList.add(
      "hidden"
    );

    authSuccess.textContent =
      message;

    authSuccess.classList.remove(
      "hidden"
    );
  }

  // =========================================
  // OPEN LOGIN
  // =========================================

  if (loginButton) {
    loginButton.addEventListener(
      "click",
      () => {
        openAuthModal(false);
      }
    );
  }

  // =========================================
  // OPEN ACCOUNT
  // =========================================

  if (accountButton) {
    accountButton.addEventListener(
      "click",
      () => {
        accountMenu.classList.toggle(
          "hidden"
        );
      }
    );
  }

  // =========================================
  // CLOSE MODAL
  // =========================================

  if (authClose) {
    authClose.addEventListener(
      "click",
      closeAuthModal
    );
  }

  if (authBackdrop) {
    authBackdrop.addEventListener(
      "click",
      closeAuthModal
    );
  }

  // =========================================
  // SWITCH LOGIN / SIGNUP
  // =========================================

  if (authSwitchButton) {
    authSwitchButton.addEventListener(
      "click",
      () => {
        showingSignup =
          !showingSignup;

        clearMessages();

        updateAuthView();
      }
    );
  }

  // =========================================
  // SIGN UP
  // =========================================

  if (signupForm) {
    signupForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        clearMessages();

        const name =
          document
            .getElementById(
              "signup-name"
            )
            .value
            .trim();

        const email =
          document
            .getElementById(
              "signup-email"
            )
            .value
            .trim();

        const password =
          document
            .getElementById(
              "signup-password"
            )
            .value;

        if (
          name.length < 2
        ) {
          showError(
            "Please enter your name."
          );

          return;
        }

        if (
          password.length < 8
        ) {
          showError(
            "Your password must be at least 8 characters."
          );

          return;
        }

        const submitButton =
          signupForm.querySelector(
            "button[type='submit']"
          );

        submitButton.disabled =
          true;

        submitButton.textContent =
          "Creating account...";

        try {
          const {
            data,
            error
          } =
            await supabase.auth.signUp({
              email,
              password,

              options: {
                data: {
                  full_name:
                    name
                },

                emailRedirectTo:
                  window.location.origin
              }
            });

          if (error) {
            throw error;
          }

          if (
            data?.user &&
            data?.session
          ) {
            showSuccess(
              "Account created successfully."
            );

            await refreshAuthState();

            setTimeout(
              closeAuthModal,
              1000
            );
          } else {
            showSuccess(
              "Account created. Check your email to confirm your account."
            );
          }

        } catch (error) {
          showError(
            error?.message ||
            "Unable to create your account."
          );

        } finally {
          submitButton.disabled =
            false;

          submitButton.textContent =
            "Create Account";
        }
      }
    );
  }

  // =========================================
  // LOGIN
  // =========================================

  if (loginForm) {
    loginForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        clearMessages();

        const email =
          document
            .getElementById(
              "login-email"
            )
            .value
            .trim();

        const password =
          document
            .getElementById(
              "login-password"
            )
            .value;

        const submitButton =
          loginForm.querySelector(
            "button[type='submit']"
          );

        submitButton.disabled =
          true;

        submitButton.textContent =
          "Signing in...";

        try {
          const {
            error
          } =
            await supabase.auth.signInWithPassword({
              email,
              password
            });

          if (error) {
            throw error;
          }

          showSuccess(
            "You are now signed in."
          );

          await refreshAuthState();

          setTimeout(
            closeAuthModal,
            800
          );

        } catch (error) {
          showError(
            error?.message ||
            "Unable to sign in."
          );

        } finally {
          submitButton.disabled =
            false;

          submitButton.textContent =
            "Log In";
        }
      }
    );
  }

  // =========================================
  // LOG OUT
  // =========================================

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      async () => {

        try {
          const {
            error
          } =
            await supabase.auth.signOut();

          if (error) {
            throw error;
          }

          accountMenu.classList.add(
            "hidden"
          );

          await refreshAuthState();

        } catch (error) {
          console.error(
            "DuncanAI logout error:",
            error
          );
        }
      }
    );
  }

  // =========================================
  // REFRESH AUTH UI
  // =========================================

  async function refreshAuthState() {
    const {
      data,
      error
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        "DuncanAI session error:",
        error
      );

      return;
    }

    const session =
      data?.session;

    updateAuthUI(
      session?.user || null
    );
  }

  // =========================================
  // UPDATE NAVIGATION
  // =========================================

  function updateAuthUI(
    user
  ) {
    if (user) {
      loginButton.classList.add(
        "hidden"
      );

      accountButton.classList.remove(
        "hidden"
      );

      accountUserEmail.textContent =
        user.email || "Signed in";
    } else {
      loginButton.classList.remove(
        "hidden"
      );

      accountButton.classList.add(
        "hidden"
      );

      accountMenu.classList.add(
        "hidden"
      );

      accountUserEmail.textContent =
        "";
    }
  }

  // =========================================
  // AUTH STATE CHANGES
  // =========================================

  supabase.auth.onAuthStateChange(
    (_event, session) => {
      updateAuthUI(
        session?.user || null
      );
    }
  );

  // =========================================
  // INITIAL AUTH CHECK
  // =========================================

  await refreshAuthState();
});
