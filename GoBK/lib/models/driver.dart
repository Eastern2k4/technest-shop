class Driver {
  final String id;
  final String name;
  final String phone;
  final String vehiclePlate;
  final double rating;

  Driver({
    required this.id,
    required this.name,
    required this.phone,
    required this.vehiclePlate,
    required this.rating,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      vehiclePlate: json['vehiclePlate'] as String,
      rating: (json['rating'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'vehiclePlate': vehiclePlate,
      'rating': rating,
    };
  }
}
