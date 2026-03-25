import { createContext, useCallback, useContext, useState, useEffect } from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  fetchUserProfile,
  refreshAccessToken,
  AUTH_STORAGE_PREFERENCE_KEY,
} from "../services/apiClient";
import { logger } from "../services/logger";

const AuthContext = createContext(null);

// Helper to clear all auth data from all storage types (mobile compatible)
function clearAuthData() {
  const keysToRemove = [
    "auth_token",
    "authToken",
    "authUserId",
    "auth_user_cache",
    "auth_user",
    "user",
    "refreshToken",
    "refreshExpiresAt",
    AUTH_STORAGE_PREFERENCE_KEY,
  ];
  
  // Clear from localStorage
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      logger.warn(`Failed to remove ${key} from localStorage`, e);
    }
  });
  
  // Clear from sessionStorage (for mobile fallback)
  keysToRemove.forEach(key => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      logger.warn(`Failed to remove ${key} from sessionStorage`, e);
    }
  });
}

// Refresh token 2 minutes before it expires (15 min TTL - 2 min = 13 min)
const TOKEN_REFRESH_INTERVAL = 1000 * 60 * 13; // Refresh every 13 minutes

function normalizeUser(user) {
  if (!user) return null;
  const normalizedCountry = typeof user.country === "string" ? user.country.trim() : "";
  return {
    ...user,
    country: normalizedCountry,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Load user from API on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      // Read token from storage with fallback chain
      let token = null;
      
      try {
        token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");
      } catch (e) {
        logger.warn("Unable to read from localStorage, trying sessionStorage", e);
      }
      
      // Fallback to sessionStorage for mobile browsers
      if (!token) {
        try {
          token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("authToken");
          if (token) {
            logger.info("Token found in sessionStorage (mobile fallback)");
          }
        } catch (e) {
          logger.warn("Unable to read from sessionStorage", e);
        }
      }
      
      if (!token) {
        setInitializing(false);
        setLoading(false);
        return;
      }

      // Get stored user ID from storage with fallback
      let storedUserId = null;
      try {
        storedUserId = localStorage.getItem("authUserId");
      } catch (e) {
        logger.warn("Unable to read authUserId from localStorage", e);
      }
      
      if (!storedUserId) {
        try {
          storedUserId = sessionStorage.getItem("authUserId");
        } catch (e) {
          logger.warn("Unable to read authUserId from sessionStorage", e);
        }
      }
      
      const ensurePlaceholderUser = () => {
        if (storedUserId) {
          setUser((prev) => prev ?? {
            id: storedUserId,
            email: "Loading...",
            role: "user",
          });
        }
      };

      // Try to load cached user first for instant UI
      let cachedUser = null;
      try {
        cachedUser = localStorage.getItem("auth_user_cache");
      } catch (e) {
        logger.warn("Unable to read auth_user_cache from localStorage", e);
      }
      
      // Fallback to sessionStorage
      if (!cachedUser) {
        try {
          cachedUser = sessionStorage.getItem("auth_user_cache");
        } catch (e) {
          logger.warn("Unable to read auth_user_cache from sessionStorage", e);
        }
      }
      
      let cachedUserPayload = null;
      if (cachedUser && storedUserId) {
        try {
          const parsed = JSON.parse(cachedUser);
          
          // CRITICAL: Verify cached user matches the token's user ID
          if (parsed.id === storedUserId) {
            cachedUserPayload = normalizeUser(parsed);
            setUser((prev) => prev ?? cachedUserPayload);
            logger.info("Loaded cached user data", { userId: parsed.id });
          } else {
            // Cached user doesn't match token - clear invalid cache
            logger.warn("Cached user ID mismatch - clearing cache", { 
              cached: parsed.id, 
              stored: storedUserId 
            });
            localStorage.removeItem("auth_user_cache");
          }
        } catch (e) {
          logger.warn("Failed to parse cached user", e);
        }
      }

      try {
        const response = await fetchUserProfile();
        if (response === null) {
          logger.info("Profile cache validated, retaining cached session.");
          if (!cachedUserPayload) {
            ensurePlaceholderUser();
          }
          return;
        }

        if (response?.user) {
          const normalized = normalizeUser(response.user);
          
          // CRITICAL: Verify API response matches stored user ID
          if (storedUserId && normalized.id !== storedUserId) {
            logger.error("User ID mismatch detected", { 
              api: normalized.id, 
              stored: storedUserId 
            });
            // Clear all auth data - this is a security issue
            clearAuthData();
            setUser(null);
            setInitializing(false);
            setLoading(false);
            return;
          }
          
          setUser(normalized);
          
          // Update cache with fresh data - use storage fallback
          const cacheData = JSON.stringify({
            id: normalized.id,
            email: normalized.email,
            role: normalized.role,
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            country: normalized.country || "",
          });
          
          try {
            localStorage.setItem("auth_user_cache", cacheData);
          } catch (e) {
            logger.warn("Unable to cache user in localStorage, trying sessionStorage", e);
            try {
              sessionStorage.setItem("auth_user_cache", cacheData);
            } catch (e2) {
              logger.warn("Unable to cache user in sessionStorage", e2);
            }
          }
          
          logger.info("User profile loaded from API", { userId: normalized.id });
        } else if (!cachedUserPayload) {
          logger.warn("Profile response missing user payload; retaining existing session.");
          ensurePlaceholderUser();
        }
      } catch (error) {
        logger.error("Failed to load user profile", error);
        
        const isAuthError =
          error?.status === 401 || error?.status === 403 || error?.message?.includes("AUTH_REQUIRED");

        if (isAuthError) {
          // Check for refresh token with fallback chain
          let hasRefreshToken = false;
          try {
            hasRefreshToken = Boolean(localStorage.getItem("refreshToken"));
          } catch (e) {
            logger.warn("Unable to check refreshToken in localStorage", e);
          }
          
          if (!hasRefreshToken) {
            try {
              hasRefreshToken = Boolean(sessionStorage.getItem("refreshToken"));
            } catch (e) {
              logger.warn("Unable to check refreshToken in sessionStorage", e);
            }
          }
          
          if (hasRefreshToken) {
            try {
              logger.info("Attempting to refresh access token after authentication failure.");
              await refreshAccessToken();
              const retryResponse = await fetchUserProfile();
              if (retryResponse === null) {
                logger.info("Profile cache validated after token refresh.");
                if (!cachedUserPayload) {
                  ensurePlaceholderUser();
                }
                return;
              }
              if (retryResponse?.user) {
                const normalized = normalizeUser(retryResponse.user);

                if (storedUserId && normalized.id !== storedUserId) {
                  logger.error("User ID mismatch detected after refresh", {
                    api: normalized.id,
                    stored: storedUserId,
                  });
                  clearAuthData();
                  setUser(null);
                  return;
                }

                setUser(normalized);
                
                const cacheData = JSON.stringify({
                  id: normalized.id,
                  email: normalized.email,
                  role: normalized.role,
                  firstName: normalized.firstName,
                  lastName: normalized.lastName,
                  country: normalized.country || "",
                });
                
                try {
                  localStorage.setItem("auth_user_cache", cacheData);
                } catch (e) {
                  logger.warn("Unable to cache user in localStorage after refresh", e);
                  try {
                    sessionStorage.setItem("auth_user_cache", cacheData);
                  } catch (e2) {
                    logger.warn("Unable to cache user in sessionStorage after refresh", e2);
                  }
                }
                
                logger.info("User profile loaded from API after refresh", { userId: normalized.id });
                return;
              }
            } catch (refreshError) {
              logger.error("Access token refresh failed during bootstrap", refreshError);
            }
          }

          clearAuthData();
          setUser(null);
          logger.info("Cleared invalid authentication tokens");
        } else {
          // For network errors, keep cached user if available
          logger.warn("Network error loading profile, using cached data if available");
          if (!cachedUserPayload) {
            ensurePlaceholderUser();
          }
        }
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Auto-refresh access token before it expires
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        // Check for refresh token with fallback chain
        let refreshToken = null;
        try {
          refreshToken = localStorage.getItem("refreshToken");
        } catch (e) {
          logger.warn("Unable to read refreshToken from localStorage", e);
        }
        
        if (!refreshToken) {
          try {
            refreshToken = sessionStorage.getItem("refreshToken");
          } catch (e) {
            logger.warn("Unable to read refreshToken from sessionStorage", e);
          }
        }
        
        if (!refreshToken) {
          logger.warn("No refresh token found, user may need to re-login");
          return;
        }

        logger.info("Refreshing access token...");
        await refreshAccessToken();
        logger.info("Access token refreshed successfully");
      } catch (error) {
        logger.error("Failed to refresh access token", error);
        
        // Clear auth data and log user out
        clearAuthData();
        setUser(null);
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const updateProfile = useCallback(
    (updates) => {
      setUser((prev) => {
        if (!prev) {
          return prev;
        }
        const updated = normalizeUser({ ...prev, ...updates });
        return updated;
      });
    },
    [],
  );

  const login = useCallback(
    async (email, password, options = {}) => {
      const normalizedOptions =
        typeof options === "boolean" ? { remember: options } : (options || {});
      const remember = normalizedOptions.remember ?? true;
      setLoading(true);
      try {
        // CRITICAL: Clear all previous auth data before login to prevent user mixing
        clearAuthData();
        
        const response = await apiLogin({ email, password }, { remember });
        const userData = response?.user;
        if (!userData) {
          throw new Error("Incomplete login response.");
        }
        const normalized = normalizeUser(userData);
        setUser(normalized);
        
        // Store minimal user info for persistence across refreshes
        const cacheData = JSON.stringify({
          id: normalized.id,
          email: normalized.email,
          role: normalized.role,
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          country: normalized.country || "",
        });
        
        try {
          localStorage.setItem("auth_user_cache", cacheData);
        } catch (e) {
          logger.warn("Unable to cache user in localStorage, trying sessionStorage", e);
          try {
            sessionStorage.setItem("auth_user_cache", cacheData);
          } catch (e2) {
            logger.warn("Unable to cache user in sessionStorage", e2);
          }
        }
        
        logger.info("Login successful", { userId: normalized.id, role: normalized.role });
        const route = normalized.role === "admin" ? "/admin" : "/dashboard";
        return { success: true, route };
      } catch (error) {
        logger.error("Login failed", error);
        
        // Extract error details from API response
        let errorMessage = "Invalid email or password";
        let attemptsRemaining;
        let remainingMinutes;
        
        if (error.details) {
          if (error.details.error) {
            errorMessage = error.details.error;
          }
          if (error.details.attemptsRemaining !== undefined) {
            attemptsRemaining = error.details.attemptsRemaining;
          }
          if (error.details.remainingMinutes !== undefined) {
            remainingMinutes = error.details.remainingMinutes;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return {
          success: false,
          error: errorMessage,
          attemptsRemaining,
          remainingMinutes,
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signup = useCallback(async (payload) => {
    setLoading(true);
    try {
      // CRITICAL: Clear all previous auth data before signup to prevent user mixing
      clearAuthData();
      
      const response = await apiSignup(payload);
      
      // Check if response contains an error
      if (response?.error) {
        logger.error("Signup error from API", { error: response.error, details: response.details });
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
      
      if (response?.user && response?.token) {
        const normalized = normalizeUser(response.user);
        setUser(normalized);
        
        // Store user cache after successful signup
        const cacheData = JSON.stringify({
          id: normalized.id,
          email: normalized.email,
          role: normalized.role,
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          country: normalized.country || "",
        });
        
        try {
          localStorage.setItem("auth_user_cache", cacheData);
        } catch (e) {
          logger.warn("Unable to cache user in localStorage, trying sessionStorage", e);
          try {
            sessionStorage.setItem("auth_user_cache", cacheData);
          } catch (e2) {
            logger.warn("Unable to cache user in sessionStorage", e2);
          }
        }
        
        logger.info("Signup successful", { userId: normalized.id, role: normalized.role });
        
        return {
          success: true,
          user: normalized,
        };
      }
      
      return response;
    } catch (error) {
      logger.error("Signup exception", error);
      return {
        success: false,
        error: error.message || "Failed to create account",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      clearAuthData();
    } catch (error) {
      logger.error("Logout error", error);
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    initializing,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
