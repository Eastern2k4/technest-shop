import 'dart:async';

import '../models/driver.dart';
import '../models/location.dart';
import '../models/ride.dart';
import '../models/ride_status.dart';
import '../models/user.dart';

/// Mock ride service - stores data in memory
/// TODO: Replace with real API later
class RideService {
  static final RideService _instance = RideService._internal();
  factory RideService() => _instance;
  RideService._internal() {
    _initializeMockData();
  }

  // In-memory storage
  final List<Location> _locations = [];
  final List<Ride> _history = [];
  Ride? _activeRide;

  void _initializeMockData() {
    _locations.addAll([
      Location(
        id: 'loc_1',
        name: 'Cổng chính BK',
        description: 'Cổng chính trường Bách Khoa',
      ),
      Location(
        id: 'loc_2',
        name: 'Ký túc xá',
        description: 'Ký túc xá sinh viên',
      ),
      Location(
        id: 'loc_3',
        name: 'Nhà A',
        description: 'Tòa nhà A',
      ),
      Location(
        id: 'loc_4',
        name: 'Nhà B',
        description: 'Tòa nhà B',
      ),
      Location(
        id: 'loc_5',
        name: 'Bãi xe Khoa CNTT',
        description: 'Bãi đỗ xe Khoa Công nghệ Thông tin',
      ),
    ]);
  }

  /// Get all available locations
  Future<List<Location>> getLocations() async {
    await Future.delayed(const Duration(milliseconds: 300));

    return [
      Location(
        id: 'ktx',
        name: 'Ký túc xá',
        description: 'Ký túc xá',
      ),
      Location(
        id: 'cong_chinh',
        name: 'Cổng chính',
        description: 'Cổng chính trường',
      ),
      Location(
        id: 'cong_phu',
        name: 'Cổng phụ',
        description: 'Cổng phụ trường',
      ),
      Location(
        id: 'khu_the_chat',
        name: 'Khu thể chất',
        description: 'Khu thể chất',
      ),
    ];
  }

  /// Create a new ride
  Future<Ride> createRide({
    required User passenger,
    required Location pickup,
    required Location dropoff,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final ride = Ride(
      id: 'ride_${DateTime.now().millisecondsSinceEpoch}',
      passenger: passenger,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      price: 6000.0,
      status: RideStatus.searching,
      requestedAt: DateTime.now(),
    );

    _activeRide = ride;
    _history.insert(0, ride);

    return ride;
  }

  /// Get active ride
  Future<Ride?> getActiveRide() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _activeRide;
  }

  /// Simulate driver accepting the ride
  Future<Ride?> simulateDriverAccept() async {
    await Future.delayed(const Duration(milliseconds: 500));

    if (_activeRide == null) return null;

    final mockDriver = Driver(
      id: 'driver_${DateTime.now().millisecondsSinceEpoch}',
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      vehiclePlate: '29A-12345',
      rating: 4.8,
    );

    _activeRide = _activeRide!.copyWith(
      driver: mockDriver,
      status: RideStatus.driverAssigned,
    );

    // Update in history
    final index = _history.indexWhere((r) => r.id == _activeRide!.id);
    if (index != -1) {
      _history[index] = _activeRide!;
    }

    return _activeRide;
  }

  /// Start the ride
  Future<Ride?> startRide() async {
    await Future.delayed(const Duration(milliseconds: 300));

    if (_activeRide == null) return null;

    _activeRide = _activeRide!.copyWith(
      status: RideStatus.inProgress,
    );

    // Update in history
    final index = _history.indexWhere((r) => r.id == _activeRide!.id);
    if (index != -1) {
      _history[index] = _activeRide!;
    }

    return _activeRide;
  }

  /// Complete the ride
  Future<Ride?> completeRide() async {
    await Future.delayed(const Duration(milliseconds: 300));

    if (_activeRide == null) return null;

    _activeRide = _activeRide!.copyWith(
      status: RideStatus.completed,
      completedAt: DateTime.now(),
    );

    // Update in history
    final index = _history.indexWhere((r) => r.id == _activeRide!.id);
    if (index != -1) {
      _history[index] = _activeRide!;
    }

    final completedRide = _activeRide;
    _activeRide = null; // Clear active ride

    return completedRide;
  }

  /// Get ride history
  Future<List<Ride>> getHistory() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List.from(_history);
  }
}
