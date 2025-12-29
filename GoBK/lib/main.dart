import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/ride_provider.dart';
import 'screens/driver_waiting_screen.dart';
import 'screens/history_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/ride_request_screen.dart';
import 'screens/ride_tracking_screen.dart';

void main() {
  runApp(const GoBKApp());
}

class GoBKApp extends StatelessWidget {
  const GoBKApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => RideProvider()),
      ],
      child: MaterialApp.router(
        title: 'GoBK',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2ecc71),
            brightness: Brightness.light,
          ),
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
        ),
        routerConfig: _router,
      ),
    );
  }
}

final GoRouter _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/ride_request',
      name: 'ride_request',
      builder: (context, state) => const RideRequestScreen(),
    ),
    GoRoute(
      path: '/driver_waiting',
      name: 'driver_waiting',
      builder: (context, state) => const DriverWaitingScreen(),
    ),
    GoRoute(
      path: '/ride_tracking',
      name: 'ride_tracking',
      builder: (context, state) => const RideTrackingScreen(),
    ),
    GoRoute(
      path: '/history',
      name: 'history',
      builder: (context, state) => const HistoryScreen(),
    ),
  ],
);
