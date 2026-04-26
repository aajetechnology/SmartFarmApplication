import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// ====  NETWORK CONFIG  ====================================================
// Development URL – replace with the LAN IP of the machine running the FastAPI server.
// You can set REACT_NATIVE_DEV_URL in your environment (e.g., via a .env file) for flexibility.
const DEV_URL = process.env.REACT_NATIVE_DEV_URL ?? "http://10.192.117.76:8000";

// Production URL (Render or any hosted backend)
const PROD_URL = "https://smart-farm-backed.onrender.com";

// Set this to 'true' if you want to test your Render backend on your phone right now.
// Set it to '!__DEV__' for normal automatic switching.
const IS_PROD = true; // Changed to true for your Render test

export const BASE_URL = IS_PROD ? PROD_URL : DEV_URL;

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,
});

// Log all outgoing requests for granular debugging
API.interceptors.request.use((config) => {
  const { method, url, baseURL, data, headers } = config;

  // Create a readable version of the payload
  let payload = data;
  if (data instanceof FormData) {
    payload = {};

    if (data._parts) {
      data._parts.forEach(([key, value]) => {
        payload[key] = (value && value.uri) ? `File: ${value.name}` : value;
      });
    }
  }

  console.log("------------------------------------------");
  console.log(`🚀 [API REQUEST] ${method?.toUpperCase()} ${baseURL}${url}`);
  console.log("📂 [PAYLOAD]:", JSON.stringify(payload, null, 2));
  console.log("------------------------------------------");

  return config;
});

// ── 2. INTERCEPTORS ──────────────────────────
API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error("❌ [TOKEN ERROR] Failed to retrieve access_token from storage:", e);
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    console.log(`✅ [API SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url} Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // --- 1. HANDLE TOKEN REFRESH (401) ---
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("🔄 [AUTH] Token expired, attempting refresh...");
      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token in storage");

        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = res.data;
        await AsyncStorage.setItem("access_token", access_token);
        if (newRefreshToken) await AsyncStorage.setItem("refresh_token", newRefreshToken);

        API.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;

        console.log("✨ [AUTH] Token refreshed successfully. Retrying original request...");
        return API(originalRequest);
      } catch (refreshError) {
        console.error("🚫 [AUTH FATAL] Refresh failed. Clearing session:", refreshError.message);
        await AsyncStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    // --- 2. EXPOSE DETAILED ERROR REASON ---
    if (error.response) {
      // The server responded with a status code that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data;

      console.group(`🔴 [API ERROR] ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);
      console.log(`Status: ${status}`);

      if (status === 422) {
        // FastAPI Validation Error
        console.log("⚠️ [VALIDATION ERROR] The backend rejected the fields sent:");
        console.table(data.detail);
      } else if (data && data.detail) {
        console.log(`Message: ${data.detail}`);
      } else {
        console.log("Raw Response Data:", data);
      }
      console.groupEnd();

    } else if (error.request) {
      // The request was made but no response was received
      console.error("🌐 [NETWORK ERROR] No response from server. Check if the backend is running and the IP address is correct.");
      console.error("Target URL:", `${BASE_URL}${originalRequest.url}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("🧨 [REQUEST CONFIG ERROR]:", error.message);
    }

    return Promise.reject(error);
  }
);



// ── 3. AUTHENTICATION ────────────────────────
export const RegisterUser = (formData) =>
  API.post("/api/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => res.data);

/**
 * Login User using OAuth2 Password Flow
 * @param {string} identifier - Email or Username
 * @param {string} password - User password
 */
export const LoginUser = async (identifier, password) => {
  const formData = new FormData();
  // Normalization as recommended by the guide
  formData.append("username", identifier.trim().toLowerCase());
  formData.append("password", password);

  const res = await API.post("/api/auth/login", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const { access_token, refresh_token, user } = res.data;

  // Persist tokens securely - with safety checks to avoid crashes on undefined
  if (access_token) await AsyncStorage.setItem("access_token", access_token);
  if (refresh_token) await AsyncStorage.setItem("refresh_token", refresh_token);
  if (user) await AsyncStorage.setItem("user", JSON.stringify(user));

  // Set default auth header for the session
  API.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

  return { access_token, refresh_token, user };
};


export const getCurrentUser = () =>
  API.get("/api/users/me").then(res => res.data);

// ── 4. CROP SCAN (Updated with Location) ─────
export const PredictPlant = async (imageUri, lat, lon) => {
  const formData = new FormData();

  // Coordinates for the study/disease tracking
  formData.append('lat', lat || 0);
  formData.append('lon', lon || 0);

  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image/jpeg`;

  formData.append("file", {
    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
    name: filename || "upload.jpg",
    type: type,
  });

  const res = await API.post("/api/predict-plant", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ── 5. WEATHER & SOCIAL ─────────────────────
export const FetchWeather = (lat, lon) =>
  API.get("/api/weather", { params: { lat, lon } }).then(res => res.data);

export const FetchContacts = () =>
  API.get("/api/social/contacts").then(res => res.data);

export const SendMessage = (contactId, content) =>
  API.post(`/api/social/messages/${contactId}`, { content }).then(res => res.data);

export const SearchUsers = (query) =>
  API.get("/api/social/users/search", { params: { search: query } }).then(res => res.data);

export const FetchMessages = (contactId) =>
  API.get(`/api/social/messages/${contactId}`).then(res => res.data);

export const AddContact = (username) =>
  API.post("/api/social/contacts/add", { username }).then(res => res.data);

// ── 6. AI & NOTIFICATIONS ─────────────────────
export const FetchNotifications = () =>
  API.get("/api/notifications").then(res => res.data);

export const AskFarmi = (message) =>
  API.post("/api/send", { message }).then(res => res.data);

export const SendVoiceMessage = async (audioUri) => {
  const formData = new FormData();
  const filename = audioUri.split('/').pop();

  formData.append("file", {
    uri: Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri,
    name: filename || "recording.m4a",
    type: "audio/m4a",
  });

  const res = await API.post("/api/send-voice", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export default API;
