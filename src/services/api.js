import { toast } from "sonner";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Optional: customize nprogress if needed.
// We disable the spinner for a cleaner look at the top bar.
NProgress.configure({ showSpinner: false, speed: 400 });

let activeRequests = 0;

export async function fetchJson(url, options = {}) {
  activeRequests++;
  if (activeRequests === 1) {
    NProgress.start();
  }

  try {
    // Read token from localStorage
    const token = localStorage.getItem("cashier_auth_token");

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        // Inject token if it exists
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = raw || "Network response was not ok";
      let data = null;
      try {
        data = JSON.parse(raw);
        if (data && data.message) {
          message = data.message;
        }
      } catch {
        // Response body was not JSON; keep the raw text as the message.
      }
      const error = new Error(message);
      error.status = response.status;
      error.data = data;

      if (response.status === 401) {
        localStorage.removeItem("cashier_auth_token");
        localStorage.removeItem("cashier_auth_user");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      // Globally show the error using sonner toast
      toast.error(message);

      throw error;
    }

    const jsonResponse = await response.json();

    // Show a global success toast if it's a mutating request and a success message is available
    const method = options.method?.toUpperCase() || "GET";
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (jsonResponse?.message) {
        toast.success(jsonResponse.message);
      } else if (jsonResponse?.success) {
        toast.success("Operation successful");
      }
    }

    return jsonResponse;
  } finally {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      NProgress.done();
    }
  }
}
