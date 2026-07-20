import { EARTH_RADIUS_METERS } from './location-evaluation.constants';
import { 
  LocationEvaluationRequest, 
  LocationEvaluationResult, 
  EvaluationReason,
  EvaluationMetadata,
  Point
} from './location-evaluation.types';

export const LocationEvaluationEngine = {
  evaluate(request: LocationEvaluationRequest): LocationEvaluationResult {
    const reasons: EvaluationReason[] = [];
    let measurements: EvaluationMetadata = {};
    let accepted = true;

    const { currentLocation, previousLocation, previousTimestamp, options } = request;

    // 1. Accuracy Check
    if (options.maxAccuracyMeters !== undefined) {
      measurements = { ...measurements, accuracyMeters: currentLocation.accuracy };
      if (currentLocation.accuracy > options.maxAccuracyMeters) {
        accepted = false;
        reasons.push(EvaluationReason.ACCURACY_REJECTED);
      }
    }

    // 2. Time Check
    if (options.minTimeSeconds !== undefined && previousTimestamp !== undefined) {
      const currentMs = new Date(currentLocation.timestamp).getTime();
      const prevMs = new Date(previousTimestamp).getTime();
      
      if (!isNaN(currentMs) && !isNaN(prevMs)) {
        const timeElapsedSeconds = (currentMs - prevMs) / 1000;
        measurements = { ...measurements, timeElapsedSeconds };

        if (timeElapsedSeconds < options.minTimeSeconds) {
          accepted = false;
          reasons.push(EvaluationReason.TIME_REJECTED);
        }
      }
    }

    // 3. Distance Check
    if (options.minDistanceMeters !== undefined && previousLocation !== undefined) {
      const distanceMeters = this.calculateDistance(currentLocation, previousLocation);
      measurements = { ...measurements, distanceMeters };

      if (distanceMeters < options.minDistanceMeters) {
        accepted = false;
        reasons.push(EvaluationReason.DISTANCE_REJECTED);
      }
    }

    // 4. Geofence Check
    if (options.geofence !== undefined) {
      const distanceToGeofenceCenterMeters = this.calculateDistance(
        currentLocation,
        options.geofence.center
      );
      
      measurements = { ...measurements, distanceToGeofenceCenterMeters };

      if (distanceToGeofenceCenterMeters > options.geofence.radiusMeters) {
        accepted = false;
        reasons.push(EvaluationReason.GEOFENCE_REJECTED);
      }
    }

    if (accepted) {
      reasons.push(EvaluationReason.ACCEPTED);
    }

    return {
      accepted,
      reasons,
      measurements
    };
  },

  calculateDistance(point1: Point, point2: Point): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const lat1 = toRadians(point1.latitude);
    const lat2 = toRadians(point2.latitude);
    const deltaLat = toRadians(point2.latitude - point1.latitude);
    const deltaLon = toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
  }
};
