// components/ProtectedRoute.js
import React, { useContext, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../src/context/AuthContext';

const ProtectedRoute = (Component) => {
  const Protected = (props) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const navigation = useNavigation();

    // Redirect to Login if not authenticated
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        console.log("Not authenticated → redirecting to Login");
        navigation.replace('Login'); // 'replace' prevents going back
      }
    }, [isAuthenticated, loading, navigation]);

    // Show loading spinner
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      );
    }

    // Wait for redirect (optional: show nothing)
    if (!isAuthenticated) {
      return null;
    }

    // User is authenticated → render the screen
    return <Component {...props} />;
  };

  // Nice display name for debugging
  const componentName = Component.displayName || Component.name || 'Component';
  Protected.displayName = `ProtectedRoute(${componentName})`;

  return Protected;
};

// Styles
const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
};

export default ProtectedRoute;