import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/location.dart';
import '../providers/auth_provider.dart';
import '../providers/ride_provider.dart';

class RideRequestScreen extends StatefulWidget {
  const RideRequestScreen({super.key});

  @override
  State<RideRequestScreen> createState() => _RideRequestScreenState();
}

class _RideRequestScreenState extends State<RideRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _pickupController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final rideProvider = context.read<RideProvider>();
      if (rideProvider.locations.isEmpty) {
        rideProvider.loadLocations();
      }
    });
  }

  @override
  void dispose() {
    _pickupController.dispose();
    super.dispose();
  }

  Future<void> _handleCreateRide() async {
    final rideProvider = context.read<RideProvider>();
    final authProvider = context.read<AuthProvider>();

    if (authProvider.currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // validate form (điểm đón + điểm đến)
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (rideProvider.selectedDropoff == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn điểm đến'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Tạo Location từ điểm đón do user nhập
    final pickupText = _pickupController.text.trim();
    final pickupLocation = Location(
      id: 'pickup_${DateTime.now().millisecondsSinceEpoch}',
      name: pickupText,
      description: 'Điểm đón do khách nhập',
    );
    rideProvider.setPickup(pickupLocation);

    try {
      await rideProvider.createRide(authProvider.currentUser!);
      if (mounted) {
        context.go('/driver_waiting');
      }
    } catch (e) {
      if (mounted) {
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
        title: const Text('Đặt xe'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            context.go('/home');
          },
        ),
      ),
      body: Consumer<RideProvider>(
        builder: (context, rideProvider, _) {
          if (rideProvider.isLoading && rideProvider.locations.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ======== ĐIỂM ĐÓN: TEXTFIELD ========
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Điểm đón',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _pickupController,
                            decoration: InputDecoration(
                              hintText: 'Nhập điểm đón (vd: Nhà A, KTX...)',
                              prefixIcon: const Icon(Icons.location_on),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Vui lòng nhập điểm đón';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ======== ĐIỂM ĐẾN: DROPDOWN ========
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Điểm đến',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<Location>(
                            initialValue: rideProvider.selectedDropoff,
                            decoration: InputDecoration(
                              hintText: 'Chọn điểm đến',
                              prefixIcon: const Icon(Icons.location_on),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            items: rideProvider.locations
                                .map(
                                  (location) => DropdownMenuItem<Location>(
                                    value: location,
                                    child: Text(location.name),
                                  ),
                                )
                                .toList(),
                            onChanged: (location) {
                              rideProvider.setDropoff(location);
                            },
                            validator: (value) {
                              if (value == null) {
                                return 'Vui lòng chọn điểm đến';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Spacer(),

                  // ======== NÚT ĐẶT XE ========
                  ElevatedButton(
                    onPressed:
                        rideProvider.isLoading ? null : _handleCreateRide,
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
                        : const Text('Đặt xe'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
