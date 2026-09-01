"""
Search & Rescue (SAR) Bayesian Monte Carlo Particle Drift Engine
Simulates lost vessel drift trajectories during engine failures using ocean current vectors,
wind drag coefficients, and Stokes wave drift to generate search heatmaps for Coast Guard.
"""

import numpy as np
from typing import Dict, Any, List

class SARDriftService:
    def simulate_drift_trajectory(
        self,
        last_known_lat: float,
        last_known_lon: float,
        drift_hours: float = 6.0,
        num_particles: int = 1000,
        current_u_ms: float = 0.45,   # Eastward current (m/s)
        current_v_ms: float = -0.20,  # Southward current (m/s)
        wind_u_ms: float = 4.5,       # Wind vector (m/s)
        wind_v_ms: float = 2.1
    ) -> Dict[str, Any]:
        """
        Monte Carlo Particle Drift Formula:
        x_{t+dt} = x_t + (U_current + alpha * U_wind + U_stokes) * dt + sqrt(2 * D * dt) * R_t
        """
        # Wind drag coefficient for small unpowered vessel
        alpha = 0.03  
        stokes_u = 0.05
        stokes_v = 0.02
        diffusion_coeff = 2.5  # Random turbulent diffusion (m²/s)

        dt_seconds = 3600  # 1-hour time steps
        steps = int(max(1, drift_hours))

        # Convert lat/lon to approximate meters (1 deg lat ~= 111,000m)
        lat_to_m = 111000.0
        lon_to_m = 111000.0 * np.cos(np.radians(last_known_lat))

        # Initialize particle cluster at last known location
        np.random.seed(42)  # Deterministic seed for reproducible simulation
        particle_lats = np.full(num_particles, last_known_lat)
        particle_lons = np.full(num_particles, last_known_lon)

        hourly_centroids = []

        for hour in range(steps):
            # Compute net advection velocity
            net_u = current_u_ms + alpha * wind_u_ms + stokes_u
            net_v = current_v_ms + alpha * wind_v_ms + stokes_v

            # Random turbulent diffusion noise
            random_dx = np.random.normal(0, np.sqrt(2 * diffusion_coeff * dt_seconds), num_particles)
            random_dy = np.random.normal(0, np.sqrt(2 * diffusion_coeff * dt_seconds), num_particles)

            # Update particle coordinates
            delta_x_m = (net_u * dt_seconds) + random_dx
            delta_y_m = (net_v * dt_seconds) + random_dy

            particle_lons += delta_x_m / lon_to_m
            particle_lats += delta_y_m / lat_to_m

            hourly_centroids.append([
                round(float(np.mean(particle_lats)), 5),
                round(float(np.mean(particle_lons)), 5)
            ])

        # Compute 95% Confidence Search Polygon Box
        lat_min, lat_max = float(np.percentile(particle_lats, 2.5)), float(np.percentile(particle_lats, 97.5))
        lon_min, lon_max = float(np.percentile(particle_lons, 2.5)), float(np.percentile(particle_lons, 97.5))

        search_radius_km = round(
            float(np.sqrt((lat_max - lat_min)**2 + (lon_max - lon_min)**2) * 111.0 / 2.0),
            2
        )

        return {
            "last_known_coordinate": [last_known_lat, last_known_lon],
            "drift_duration_hours": drift_hours,
            "simulated_particles": num_particles,
            "drift_centroid": hourly_centroids[-1],
            "hourly_drift_path": hourly_centroids,
            "search_bounding_box": {
                "lat_min": round(lat_min, 5),
                "lat_max": round(lat_max, 5),
                "lon_min": round(lon_min, 5),
                "lon_max": round(lon_max, 5)
            },
            "prioritized_search_radius_km": search_radius_km,
            "sar_helipad_dispatch_recommendation": "Coast Guard Air Enclave Ratnagiri"
        }

sar_drift_service = SARDriftService()
