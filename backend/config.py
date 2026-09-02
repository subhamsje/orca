"""
ORCA 4.0 Central Environment & API Key Configuration
Supports optional API keys for premium providers (NASA Earthdata, Mapbox, OpenWeather, Gemini API)
with 100% graceful fallback to free open government data endpoints (INCOIS, Open-Meteo, AGMARKNET).
"""

import os
from pydantic import BaseModel

class SystemConfig(BaseModel):
    # Optional API Keys (Graceful Fallback if None)
    NASA_EARTHDATA_API_KEY: str = os.getenv("NASA_EARTHDATA_API_KEY", "")
    MAPBOX_ACCESS_TOKEN: str = os.getenv("MAPBOX_ACCESS_TOKEN", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Core Public Endpoints (Zero Key Required)
    INCOIS_ERDDAP_URL: str = "https://erddap.incois.gov.in/erddap"
    OPEN_METEO_MARINE_URL: str = "https://marine-api.open-meteo.com/v1/marine"
    AGMARKNET_PORTAL_URL: str = "https://agmarknet.gov.in"
    
    # Environment Settings
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

    def is_nasa_key_configured(self) -> bool:
        return bool(self.NASA_EARTHDATA_API_KEY.strip())

    def is_mapbox_configured(self) -> bool:
        return bool(self.MAPBOX_ACCESS_TOKEN.strip())

config = SystemConfig()
