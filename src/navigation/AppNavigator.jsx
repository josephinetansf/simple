/**
 * Habita — App Navigator
 * Phase 4: UI Pages
 *
 * Bottom tab navigation container for the app.
 * Routes: Dashboard, Tenancies, Rentals, Expenses
 */

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

import DashboardPage from '../pages/DashboardPage';
import TenancyListPage from '../pages/TenancyListPage';
import RentalListPage from '../pages/RentalListPage';
import ExpenseListPage from '../pages/ExpenseListPage';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => renderIcon(route),
          tabBarLabel: route.name,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardPage} />
        <Tab.Screen name="Tenancies" component={TenancyListPage} />
        <Tab.Screen name="Rentals" component={RentalListPage} />
        <Tab.Screen name="Expenses" component={ExpenseListPage} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/**
 * Render a simple emoji icon for each tab.
 */
function renderIcon(route) {
  const icons = {
    Dashboard: '📊',
    Tenancies: '🏠',
    Rentals: '💰',
    Expenses: '🧾',
  };
  return <Text style={styles.icon}>{icons[route.name] || '📱'}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});
