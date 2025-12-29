import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/ride_provider.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RideProvider>().loadHistory();
    });
  }

  String _formatDateTime(DateTime dateTime) {
    return DateFormat('dd/MM/yyyy - HH:mm').format(dateTime);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch sử chuyến xe'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            context.go('/home');
          },
        ),
      ),
      body: Consumer<RideProvider>(
        builder: (context, rideProvider, _) {
          if (rideProvider.isLoading && rideProvider.history.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (rideProvider.history.isEmpty) {
            return const Center(
              child: Text(
                'Chưa có lịch sử chuyến xe',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await rideProvider.loadHistory();
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: rideProvider.history.length,
              itemBuilder: (context, index) {
                final ride = rideProvider.history[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Card(
                    child: ListTile(
                      leading: const Icon(
                        Icons.directions_bus,
                        color: Color(0xFF2ecc71),
                      ),
                      title: Text(
                        '${ride.pickupLocation.name} → ${ride.dropoffLocation.name}',
                      ),
                      subtitle: Text(
                        _formatDateTime(ride.requestedAt),
                      ),
                      trailing: Chip(
                        label: Text(
                          ride.status.toDisplayString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                        backgroundColor: ride.status.name == 'completed'
                            ? const Color(0xFF2ecc71)
                            : Colors.orange,
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

