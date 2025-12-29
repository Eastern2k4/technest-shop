import 'dart:async';

import '../models/user.dart';

/// Mock authentication service
/// TODO: Replace with real API later
class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  /// Mock login - delay 1s to simulate API call
  /// Returns User if email contains "@", otherwise throws exception
  Future<User?> login(String email, String password) async {
    // Simulate API delay
    await Future.delayed(const Duration(seconds: 1));

    // Mock validation: email must contain "@"
    if (email.contains('@')) {
      return User(
        id: 'user_${DateTime.now().millisecondsSinceEpoch}',
        name: email.split('@')[0],
        email: email,
      );
    } else {
      throw Exception('Thông tin đăng nhập không đúng');
    }
  }

  /// Mock logout
  Future<void> logout() async {
    // Simulate API delay
    await Future.delayed(const Duration(milliseconds: 500));
    // TODO: Replace with real API call
  }
}
