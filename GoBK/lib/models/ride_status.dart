enum RideStatus {
  searching,
  driverAssigned,
  pickingUp,
  inProgress,
  completed,
  canceled;

  String toDisplayString() {
    switch (this) {
      case RideStatus.searching:
        return 'Đang tìm tài xế';
      case RideStatus.driverAssigned:
        return 'Tài xế đã nhận';
      case RideStatus.pickingUp:
        return 'Đang đón khách';
      case RideStatus.inProgress:
        return 'Đang di chuyển';
      case RideStatus.completed:
        return 'Hoàn thành';
      case RideStatus.canceled:
        return 'Đã hủy';
    }
  }

  static RideStatus fromString(String value) {
    switch (value) {
      case 'searching':
        return RideStatus.searching;
      case 'driver_assigned':
        return RideStatus.driverAssigned;
      case 'picking_up':
        return RideStatus.pickingUp;
      case 'in_progress':
        return RideStatus.inProgress;
      case 'completed':
        return RideStatus.completed;
      case 'canceled':
        return RideStatus.canceled;
      default:
        return RideStatus.searching;
    }
  }

  String toJsonString() {
    switch (this) {
      case RideStatus.searching:
        return 'searching';
      case RideStatus.driverAssigned:
        return 'driver_assigned';
      case RideStatus.pickingUp:
        return 'picking_up';
      case RideStatus.inProgress:
        return 'in_progress';
      case RideStatus.completed:
        return 'completed';
      case RideStatus.canceled:
        return 'canceled';
    }
  }
}
