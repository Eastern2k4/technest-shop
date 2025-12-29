import 'package:flutter/foundation.dart';

import '../models/location.dart';
import '../models/ride.dart';
import '../models/user.dart';
import '../services/ride_service.dart';

class RideProvider extends ChangeNotifier {
  final RideService _rideService = RideService();

  List<Location> _locations = [];
  Location? _selectedPickup;
  Location? _selectedDropoff;
  Ride? _activeRide;
  List<Ride> _history = [];
  bool _isLoading = false;

  List<Location> get locations => _locations;
  Location? get selectedPickup => _selectedPickup;
  Location? get selectedDropoff => _selectedDropoff;
  Ride? get activeRide => _activeRide;
  List<Ride> get history => _history;
  bool get isLoading => _isLoading;

  /// Load danh sách 4 điểm đến cố định
  Future<void> loadLocations() async {
    _isLoading = true;
    notifyListeners();

    // 4 điểm đến cố định
    _locations = [
      Location(
        id: 'dest_ktx',
        name: 'Ký túc xá',
        description: 'Ký túc xá',
      ),
      Location(
        id: 'dest_cong_chinh',
        name: 'Cổng chính',
        description: 'Cổng chính',
      ),
      Location(
        id: 'dest_cong_phu',
        name: 'Cổng phụ',
        description: 'Cổng phụ',
      ),
      Location(
        id: 'dest_khu_the_chat',
        name: 'Khu thể chất',
        description: 'Khu thể chất',
      ),
    ];

    _isLoading = false;
    notifyListeners();
  }

  /// Điểm đón – sẽ được set bằng Location tạo từ text user nhập
  void setPickup(Location? location) {
    _selectedPickup = location;
    notifyListeners();
  }

  /// Điểm đến – chọn từ dropdown
  void setDropoff(Location? location) {
    _selectedDropoff = location;
    notifyListeners();
  }

  Future<void> reloadActiveRide() async {
    _activeRide = await _rideService.getActiveRide();
    notifyListeners();
  }

  /// Tạo chuyến mới
  Future<void> createRide(User passenger) async {
    if (_selectedPickup == null ||
        _selectedPickup!.name.trim().isEmpty ||
        _selectedDropoff == null) {
      throw StateError('Pickup and dropoff must be provided');
    }

    _isLoading = true;
    notifyListeners();
    try {
      final ride = await _rideService.createRide(
        passenger: passenger,
        pickup: _selectedPickup!,
        dropoff: _selectedDropoff!,
      );
      _activeRide = ride;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshActiveRide() async {
    _isLoading = true;
    notifyListeners();
    try {
      _activeRide = await _rideService.getActiveRide();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> simulateDriverAccept() async {
    _isLoading = true;
    notifyListeners();
    try {
      final ride = await _rideService.simulateDriverAccept();
      if (ride != null) {
        _activeRide = ride;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> startRide() async {
    _isLoading = true;
    notifyListeners();
    try {
      final ride = await _rideService.startRide();
      if (ride != null) {
        _activeRide = ride;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> completeRide() async {
    _isLoading = true;
    notifyListeners();
    try {
      final ride = await _rideService.completeRide();
      if (ride != null) {
        _activeRide = ride;
      }
      _history = await _rideService.getHistory();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadHistory() async {
    _isLoading = true;
    notifyListeners();
    try {
      _history = await _rideService.getHistory();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
