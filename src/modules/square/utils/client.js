// src/modules/square/utils/client.js
import axios from "axios";

// Create axios instance for Square API
const squareClient = axios.create({
  baseURL: "https://connect.squareup.com/v2",
  headers: {
    "Square-Version": process.env.SQUARE_API_VERSION || "2024-06-04",
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

// Add auth token from environment variable
squareClient.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`;

  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.log("Square API:", config.method?.toUpperCase(), config.url);
  }

  return config;
});

// Error response interceptor for better error handling
squareClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("Square API Error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        errors: error.response.data?.errors
      });
    }
    return Promise.reject(error);
  }
);

export function getSquareClient() {
  return squareClient;
}

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
