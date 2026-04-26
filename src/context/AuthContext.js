import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginUser, getCurrentUser } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const cachedUser = await AsyncStorage.getItem('user');

        if (token) {
          // Set cached data first for instant UI response
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
            setIsAuthenticated(true);
          }

          // Then, refresh from server to get latest profile_pic or data
          try {
            const freshUser = await getCurrentUser();
            await AsyncStorage.setItem('user', JSON.stringify(freshUser));
            setUser(freshUser);
            setIsAuthenticated(true);
          } catch (refreshError) {
            console.log("Token expired or network error during refresh");
            // If token is invalid, clear storage
            if (refreshError.response?.status === 401) {
                await logout();
            }
          }
        }
      } catch (e) {
        console.error("Auth Bootstrap Error:", e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // LOGIN
  const login = async (identifier, password) => {
    try {
      const data = await LoginUser(identifier, password);
      
      // Ensure data exists before destructuring
      if (data && data.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        setIsAuthenticated(true);
        return data.user;
      }
    } catch (error) {
      // Re-throw to allow the Login Screen to show the error message
      throw error;
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['access_token', 'user']);
      setUser(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.error("Logout Error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        setUser, // Useful if you want to update user state after editing profile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};