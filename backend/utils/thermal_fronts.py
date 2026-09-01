"""
2D Sobel Filter Thermal Front Extraction Engine
Applies Sobel spatial gradient operations over Sea Surface Temperature (SST) rasters
to locate upwelling boundaries and oceanic thermal fronts.
"""

import numpy as np
from scipy.ndimage import sobel

def compute_thermal_front_gradients(sst_matrix: np.ndarray) -> np.ndarray:
    """
    Computes 2D spatial gradient magnitude over an SST matrix:
    grad = sqrt((dSST/dx)^2 + (dSST/dy)^2)
    """
    if sst_matrix.ndim != 2:
        raise ValueError("SST matrix must be a 2D numpy array.")
        
    dx = sobel(sst_matrix, axis=1, mode='nearest')
    dy = sobel(sst_matrix, axis=0, mode='nearest')
    gradient_magnitude = np.hypot(dx, dy)
    return gradient_magnitude

def extract_front_indicators(sst_matrix: np.ndarray, threshold: float = 0.3) -> np.ndarray:
    """
    Applies a thermal front gradient threshold to locate high-density pelagic feeding boundaries.
    """
    gradients = compute_thermal_front_gradients(sst_matrix)
    front_mask = gradients >= threshold
    return front_mask.astype(int)
