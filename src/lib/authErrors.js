// src/lib/authErrors.js

export function getFriendlyErrorMessage(error) {
    if (!error) return "";
  
    const code = error.code || "";
  
    switch (code) {
      case "auth/admin-restricted-operation":
        return "Google Sign-In is not enabled in the Firebase Console. Please enable Google Auth under Authentication > Sign-in method.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed before completing authentication.";
      case "auth/popup-blocked":
        return "Sign-in popup was blocked by your browser. Please allow popups for this site.";
      case "auth/unauthorized-domain":
        return "This domain (localhost) is not authorized for Google Sign-In in Firebase Settings.";
      case "auth/network-request-failed":
        return "Network connection error. Please check your internet connection.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/operation-not-allowed":
        return "Google Sign-In provider is disabled in Firebase.";
      default:
        return error.message || "An unexpected error occurred. Please try again.";
    }
  }