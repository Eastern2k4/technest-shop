import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/ride_status.dart';
import '../providers/ride_provider.dart';

class RideTrackingScreen extends StatelessWidget {
  const RideTrackingScreen({super.key});

  Future<void> _handleStartRide(BuildContext context) async {
    final rideProvider = context.read<RideProvider>();
    try {
      await rideProvider.startRide();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleCompleteRide(BuildContext context) async {
    final rideProvider = context.read<RideProvider>();
    try {
      await rideProvider.completeRide();
      if (context.mounted) {
        context.go('/history');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Theo dõi chuyến xe'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            context.go('/home');
          },
        ),
      ),
      body: Consumer<RideProvider>(
        builder: (context, rideProvider, _) {
          final ride = rideProvider.activeRide;

          if (ride == null) {
            return const Center(
              child: Text('Không có chuyến xe đang hoạt động'),
            );
          }

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.directions_bus,
                              color: Color(0xFF2ecc71),
                            ),
                            const SizedBox(width: 8),
                            const Expanded(
                              child: Text(
                                'Thông tin chuyến xe',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Chip(
                              label: Text(
                                ride.status.toDisplayString(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                              backgroundColor: const Color(0xFF2ecc71),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child:
                                  Text('Điểm đón: ${ride.pickupLocation.name}'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.location_on,
                                size: 20, color: Colors.red),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                  'Điểm đến: ${ride.dropoffLocation.name}'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.attach_money, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Giá: ${ride.price.toStringAsFixed(0).replaceAllMapped(RegExp(r"(\d)(?=(\d{3})+(?!\d))"), (m) => "${m[1]} ")}đ / 1 km',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2ecc71),
                              ),
                            ),
                          ],
                        ),
                        if (ride.driver != null) ...[
                          const SizedBox(height: 16),
                          const Divider(),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.person, size: 20),
                              const SizedBox(width: 8),
                              Text('Tài xế: ${ride.driver!.name}'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.phone, size: 20),
                              const SizedBox(width: 8),
                              Text('SĐT: ${ride.driver!.phone}'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.directions_car, size: 20),
                              const SizedBox(width: 8),
                              Text('Biển số: ${ride.driver!.vehiclePlate}'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.star,
                                  size: 20, color: Colors.amber),
                              const SizedBox(width: 8),
                              Text('Đánh giá: ${ride.driver!.rating}'),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Expanded(
                  child: Card(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.map,
                            size: 80,
                            color: Color(0xFF2ecc71),
                          ),
                          SizedBox(height: 16),
                          Text(
                            'Bản đồ theo dõi',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Tính năng đang phát triển',
                            style: TextStyle(
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (ride.status == RideStatus.driverAssigned ||
                    ride.status == RideStatus.pickingUp)
                  ElevatedButton(
                    onPressed: rideProvider.isLoading
                        ? null
                        : () => _handleStartRide(context),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: rideProvider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text('Bắt đầu chuyến'),
                  ),
                if (ride.status == RideStatus.inProgress) ...[
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: rideProvider.isLoading
                        ? null
                        : () => _handleCompleteRide(context),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: const Color(0xFF2ecc71),
                    ),
                    child: rideProvider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text('Kết thúc chuyến'),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
