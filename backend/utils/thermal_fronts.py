"""
2D Sobel & Scharr Thermal Front Gradient Extraction Engine
Applies spatial gradient and edge convolution operations over Sea Surface Temperature (SST) rasters
to locate upwelling boundaries, thermal fronts, and high-density pelagic feeding grounds.
"""

import numpy as np
from scipy.ndimage import sobel
from typing import Dict, Any, Tuple

def compute_thermal_front_gradients(sst_matrix: np.ndarray, cell_size_km: float = 1.0) -> np.ndarray:
    """
    Computes 2D spatial gradient magnitude (°C / km) over an SST raster matrix:
    |∇SST| = sqrt( (∂SST/∂x)² + (∂SST/∂y)² ) / (cell_size_km)
    """
    if not isinstance(sst_matrix, np.ndarray) or sst_matrix.ndim != 2:
        raise ValueError("SST matrix must be a 2D numpy ndarray.")
        
    # Apply Sobel convolution along X (longitude) and Y (latitude) axes
    dx = sobel(sst_matrix, axis=1, mode='reflect') / 8.0
    dy = sobel(sst_matrix, axis=0, mode='reflect') / 8.0
    
    gradient_magnitude = np.hypot(dx, dy) / max(0.1, cell_size_km)
    return gradient_magnitude

def extract_front_indicators(
    sst_matrix: np.ndarray,
    threshold_c_km: float = 0.35
) -> Dict[str, Any]:
    """
    Detects front pixels where spatial thermal gradient exceeds threshold (e.g. 0.35°C / km).
    Returns front boolean mask, mean gradient, max gradient, and front density percentage.
    """
    gradients = compute_thermal_front_gradients(sst_matrix)
    front_mask = gradients >= threshold_c_km
    
    total_pixels = sst_matrix.size
    front_pixels = int(np.sum(front_mask))
    density_pct = round((front_pixels / max(1, total_pixels)) * 100.0, 2)
    
    return {
        "front_mask": front_mask,
        "gradient_magnitude": gradients,
        "mean_gradient_c_km": round(float(np.mean(gradients)), 3),
        "max_gradient_c_km": round(float(np.max(gradients)), 3),
        "front_density_pct": density_pct,
        "upwelling_indicated": bool(density_pct > 5.0 or np.max(gradients) > 0.60)
    }

def synthesize_sst_patch(center_sst: float = 28.4, grid_size: int = 16, front_intensity: float = 0.8) -> np.ndarray:
    """
    Synthesizes a realistic local SST raster patch with a natural ocean temperature gradient for simulation.
    """
    y, x = np.mgrid[0:grid_size, 0:grid_size]
    # Create diagonal thermal front with slight sinusoidal meander
    front_line = x + 0.3 * np.sin(y / 2.0)
    base = center_sst + front_intensity * np.tanh((front_line - grid_size / 2.0) / 2.5)
    noise = np.random.normal(0, 0.05, (grid_size, grid_size))
    return base + noise
