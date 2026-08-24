document.addEventListener("DOMContentLoaded", async () => {

  // =========================================
  // DUNCANAI AUTHENTICATION
  // =========================================

  const supabase = window.supabaseClient;

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
    document.getElementById("auth-modal-backdrop");

  const authClose =
    document.getElementById("auth-close");

  const loginForm =
    document.getElementById("login-form");

  const signupForm =
    document.getElementById("signup-form");

  const authTitle =
    document.getElementById("auth-title");

  const authDescription =
    document.getElementById("auth-description");

  const authSwitchText =
    document.getElementById("auth-switch-text");

  const authSwitchButton =
    document.getElementById("auth-switch-button");

  const authError =
    document.getElementById("auth-error");

  const authSuccess =
    document.getElementById("auth-success");

  const accountMenu =
    document.getElementById("account-menu");

  const accountUserEmail =
    document.getElementById("account-user-email");

  const logoutButton =
    document.getElementById("logout-button");


  // =========================================
  // SAFETY CHECK
  // =========================================

  if (!supabase) {

    console.error(
      "DuncanAI: Supabase client is not available."
    );

    if (authError) {
      authError.textContent =
        "Authentication system is not available. Please refresh the page.";
      
      authError.classList.remove("hidden");
    }

    return;
  }


  // =========================================
  // STATE
  // =========================================

  let showingSignup = false;


  // =========================================
  // AUTH REDIRECT URL
  // =========================================
  //
  // IMPORTANT:
  // Change this to your REAL WEBSITE URL
  // when your website is published.
  //
  // Example:
  // https://duncanai.com
  //
  // For now, this automatically uses the
  // current website address.
  // =========================================

  const SITE_URL =
    window.location.origin;


  // =========================================
  // OPEN AUTH MODAL
  // =========================================

  function openAuthModal(signup = false) {

    showingSignup = signup;

    clearMessages();

    updateAuthView();

    if (authModal) {
      authModal.classList.remove("hidden");
    }

    document.body.style.overflow = "hidden";
  }


  // =========================================
  // CLOSE AUTH MODAL
  // =========================================

  function closeAuthModal() {

    if (authModal) {
      authModal.classList.add("hidden");
    }

    document.body.style.overflow = "";

    clearMessages();
  }


  // =========================================
  // UPDATE LOGIN / SIGNUP VIEW
  // =========================================

  function updateAuthView() {

    if (showingSignup) {

      authTitle.textContent =
        "Create your account";

      authDescription.textContent =
        "Create an account to keep your DuncanAI creations with you.";

      loginForm.classList.add("hidden");

      signupForm.classList.remove("hidden");

      authSwitchText.textContent =
        "Already have an account?";

      authSwitchButton.textContent =
        "Log in";

    } else {

      authTitle.textContent =
        "Welcome back";

      authDescription.textContent =
        "Sign in to save your creations across devices.";

      signupForm.classList.add("hidden");

      loginForm.classList.remove("hidden");

      authSwitchText.textContent =
        "Don't have an account?";

      authSwitchButton.textContent =
        "Create one";
    }
  }


  // =========================================
  // CLEAR MESSAGES
  // =========================================

  function clearMessages() {

    if (authError) {

      authError.textContent = "";

      authError.classList.add("hidden");
    }

    if (authSuccess) {

      authSuccess.textContent = "";

      authSuccess.classList.add("hidden");
    }
  }


  // =========================================
  // SHOW ERROR
  // =========================================

  function showError(message) {

    if (authSuccess) {
      authSuccess.classList.add("hidden");
    }

    if (authError) {

      authError.textContent =
        message;

      authError.classList.remove("hidden");
    }

    console.error(
      "DuncanAI Auth:",
      message
    );
  }


  // =========================================
  // SHOW SUCCESS
  // =========================================

  function showSuccess(message) {

    if (authError) {
      authError.classList.add("hidden");
    }

    if (authSuccess) {

      authSuccess.textContent =
        message;

      authSuccess.classList.remove("hidden");
    }
  }


  // =========================================
  // OPEN LOGIN BUTTON
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

        if (accountMenu) {

          accountMenu.classList.toggle(
            "hidden"
          );
        }
      }
    );
  }


  // =========================================
  // CLOSE AUTH MODAL
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
            .getElementById("signup-name")
            .value
            .trim();


        const email =
          document
            .getElementById("signup-email")
            .value
            .trim();


        const password =
          document
            .getElementById("signup-password")
            .value;


        // -------------------------------------
        // VALIDATE NAME
        // -------------------------------------

        if (name.length < 2) {

          showError(
            "Please enter your name."
          );

          return;
        }


        // -------------------------------------
        // VALIDATE PASSWORD
        // -------------------------------------

        if (password.length < 8) {

          showError(
            "Your password must be at least 8 characters."
          );

          return;
        }


        const submitButton =
          signupForm.querySelector(
            "button[type='submit']"
          );


        submitButton.disabled = true;

        submitButton.textContent =
          "Creating account...";


        try {

          // -----------------------------------
          // CREATE SUPABASE ACCOUNT
          // -----------------------------------

          const {
            data,
            error
          } =
            await supabase.auth.signUp({

              email: email,

              password: password,

              options: {

                data: {
                  full_name: name
                },

                /*
                 * IMPORTANT
                 *
                 * The user will be redirected back
                 * to the same website after clicking
                 * the confirmation email.
                 */

                emailRedirectTo:
                  SITE_URL
              }
            });


          if (error) {
            throw error;
          }


          // -----------------------------------
          // ACCOUNT CREATED
          // -----------------------------------

          if (data?.user) {

            if (data?.session) {

              showSuccess(
                "Account created successfully. You are now signed in."
              );

              await refreshAuthState();

              setTimeout(
                closeAuthModal,
                1000
              );

            } else {

              showSuccess(
                "Account created! Please check your email and click the confirmation link to activate your DuncanAI account."
              );
            }

          } else {

            showError(
              "The account could not be created. Please try again."
            );
          }


        } catch (error) {

          console.error(
            "DuncanAI signup error:",
            error
          );


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
            .getElementById("login-email")
            .value
            .trim();


        const password =
          document
            .getElementById("login-password")
            .value;


        const submitButton =
          loginForm.querySelector(
            "button[type='submit']"
          );


        submitButton.disabled = true;

        submitButton.textContent =
          "Signing in...";


        try {

          const {
            data,
            error
          } =
            await supabase.auth.signInWithPassword({

              email: email,

              password: password
            });


          if (error) {
            throw error;
          }


          if (data?.user) {

            showSuccess(
              "You are now signed in."
            );

            await refreshAuthState();

            setTimeout(
              closeAuthModal,
              800
            );

          } else {

            showError(
              "Login was not completed. Please try again."
            );
          }


        } catch (error) {

          console.error(
            "DuncanAI login error:",
            error
          );


          showError(
            error?.message ||
            "Unable to sign in. Please check your email and password."
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


          if (accountMenu) {

            accountMenu.classList.add(
              "hidden"
            );
          }


          await refreshAuthState();


        } catch (error) {

          console.error(
            "DuncanAI logout error:",
            error
          );

          showError(
            "Unable to log out. Please try again."
          );
        }
      }
    );
  }


  // =========================================
  // REFRESH AUTH STATE
  // =========================================

  async function refreshAuthState() {

    try {

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


    } catch (error) {

      console.error(
        "DuncanAI session check failed:",
        error
      );
    }
  }


  // =========================================
  // UPDATE NAVIGATION
  // =========================================

  function updateAuthUI(user) {

    if (user) {

      if (loginButton) {

        loginButton.classList.add(
          "hidden"
        );
      }


      if (accountButton) {

        accountButton.classList.remove(
          "hidden"
        );
      }


      if (accountUserEmail) {

        accountUserEmail.textContent =
          user.email || "Signed in";
      }


    } else {

      if (loginButton) {

        loginButton.classList.remove(
          "hidden"
        );
      }


      if (accountButton) {

        accountButton.classList.add(
          "hidden"
        );
      }


      if (accountMenu) {

        accountMenu.classList.add(
          "hidden"
        );
      }


      if (accountUserEmail) {

        accountUserEmail.textContent =
          "";
      }
    }
  }


  // =========================================
  // SUPABASE AUTH STATE CHANGES
  // =========================================

  supabase.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "DuncanAI Auth Event:",
        event
      );


      updateAuthUI(
        session?.user || null
      );
    }
  );


  // =========================================
  // HANDLE EMAIL CONFIRMATION
  // =========================================
  //
  // Supabase may return the user to the site
  // with authentication information in the URL.
  //
  // getSession() lets Supabase process the
  // confirmation session.
  // =========================================

  const url =
    new URL(window.location.href);


  const hash =
    window.location.hash;


  if (
    hash.includes("access_token") ||
    hash.includes("type=signup") ||
    hash.includes("type=recovery")
  ) {

    console.log(
      "DuncanAI: Authentication callback detected."
    );


    setTimeout(
      async () => {

        await refreshAuthState();

      },
      500
    );
  }


  // =========================================
  // INITIAL AUTH CHECK
  // =========================================

  await refreshAuthState();


  console.log(
    "DuncanAI: Authentication system ready."
  );

});
