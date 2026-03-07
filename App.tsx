import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { WorldScreen } from './src/screens/WorldScreen';
import { DistancesNavigator } from './src/screens/DistancesScreen';
import { SafetyMapScreen } from './src/screens/SafetyMapScreen';
import { COLORS, FONT } from './src/theme';

export type RootTabParamList = {
  Home: undefined;
  World: undefined;
  Distances: undefined;
  SafetyMap: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: COLORS.accent,
            background: COLORS.background,
            card: COLORS.surface,
            text: COLORS.textPrimary,
            border: COLORS.border,
            notification: COLORS.accent,
          },
        }}
      >
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              // iOS: fixed height to accommodate the home indicator
              // Android: let SafeAreaProvider handle bottom inset for older phones
              // with software navigation buttons
              ...(Platform.OS === 'ios' && {
                height: 84,
                paddingBottom: 24,
              }),
            },
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarLabelStyle: {
              fontSize: FONT.sizeSm,
              fontWeight: '500',
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: 'Around Me',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="◎" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="World"
            component={WorldScreen}
            options={{
              tabBarLabel: 'World',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="◌" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Distances"
            component={DistancesNavigator}
            options={{
              tabBarLabel: 'Distances',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="↔" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="SafetyMap"
            component={SafetyMapScreen}
            options={{
              tabBarLabel: 'Safety Map',
              tabBarIcon: ({ focused }) => (
                <TabIcon icon="⊕" focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  iconFocused: {
    color: COLORS.accent,
  },
});
