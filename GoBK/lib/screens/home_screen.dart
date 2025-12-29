import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GoBK'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              context.go('/history');
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: InkWell(
                onTap: () {
                  context.go('/ride_request');
                },
                child: const Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Icon(
                        Icons.add_location_alt,
                        size: 48,
                        color: Color(0xFF2ecc71),
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Đặt xe mới',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: InkWell(
                onTap: () {
                  context.go('/ride_tracking');
                },
                child: const Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 48,
                        color: Color(0xFF2ecc71),
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Theo dõi chuyến xe',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: InkWell(
                onTap: () {
                  context.go('/driver_waiting');
                },
                child: const Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Icon(
                        Icons.drive_eta,
                        size: 48,
                        color: Color(0xFF2ecc71),
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Chờ tài xế',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

