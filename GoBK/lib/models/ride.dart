import 'driver.dart';
import 'location.dart';
import 'ride_status.dart';
import 'user.dart';

class Ride {
  final String id;
  final User passenger;
  final Driver? driver;
  final Location pickupLocation;
  final Location dropoffLocation;
  final double price;
  final RideStatus status;
  final DateTime requestedAt;
  final DateTime? completedAt;

  Ride({
    required this.id,
    required this.passenger,
    this.driver,
    required this.pickupLocation,
    required this.dropoffLocation,
    required this.price,
    required this.status,
    required this.requestedAt,
    this.completedAt,
  });

  factory Ride.fromJson(Map<String, dynamic> json) {
    return Ride(
      id: json['id'] as String,
      passenger: User.fromJson(json['passenger'] as Map<String, dynamic>),
      driver: json['driver'] != null
          ? Driver.fromJson(json['driver'] as Map<String, dynamic>)
          : null,
      pickupLocation:
          Location.fromJson(json['pickupLocation'] as Map<String, dynamic>),
      dropoffLocation:
          Location.fromJson(json['dropoffLocation'] as Map<String, dynamic>),
      price: (json['price'] as num).toDouble(),
      status: RideStatus.fromString(json['status'] as String),
      requestedAt: DateTime.parse(json['requestedAt'] as String),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'passenger': passenger.toJson(),
      'driver': driver?.toJson(),
      'pickupLocation': pickupLocation.toJson(),
      'dropoffLocation': dropoffLocation.toJson(),
      'price': price,
      'status': status.toJsonString(),
      'requestedAt': requestedAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  Ride copyWith({
    String? id,
    User? passenger,
    Driver? driver,
    Location? pickupLocation,
    Location? dropoffLocation,
    double? price,
    RideStatus? status,
    DateTime? requestedAt,
    DateTime? completedAt,
  }) {
    return Ride(
      id: id ?? this.id,
      passenger: passenger ?? this.passenger,
      driver: driver ?? this.driver,
      pickupLocation: pickupLocation ?? this.pickupLocation,
      dropoffLocation: dropoffLocation ?? this.dropoffLocation,
      price: price ?? this.price,
      status: status ?? this.status,
      requestedAt: requestedAt ?? this.requestedAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
