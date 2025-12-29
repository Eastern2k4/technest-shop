import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/ride_status.dart';
import '../providers/ride_provider.dart';

class DriverWaitingScreen extends StatefulWidget {
  const DriverWaitingScreen({super.key});

  @override
  State<DriverWaitingScreen> createState() => _DriverWaitingScreenState();
}

class _DriverWaitingScreenState extends State<DriverWaitingScreen> {
  Timer? _timer;
  bool _hasSimulated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startSimulation();
    });
  }

  void _startSimulation() {
    final rideProvider = context.read<RideProvider>();

    // Reload active ride first
    rideProvider.reloadActiveRide();

    // Start timer to simulate driver accept after 3 seconds
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (!_hasSimulated) {
        _hasSimulated = true;
        await rideProvider.simulateDriverAccept();
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chờ tài xế'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            context.go('/home');
          },
        ),
      ),
      body: Consumer<RideProvider>(
        builder: (context, rideProvider, _) {
          // Check if driver has been assigned
          if (rideProvider.activeRide != null &&
              rideProvider.activeRide!.status != RideStatus.searching) {
            // Navigate to tracking screen
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                context.go('/ride_tracking');
              }
            });
          }

          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(
                    color: Color(0xFF2ecc71),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'Đang tìm tài xế...',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Vui lòng chờ trong giây lát',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                  if (rideProvider.isLoading) ...[
                    const SizedBox(height: 24),
                    const Text(
                      'Tài xế đang nhận chuyến...',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF2ecc71),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
