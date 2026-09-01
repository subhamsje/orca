"""
ORCA 4.0 Domain Enums
Defines core enumeration types for marine physics, multilingual dialects, disaster alerts, and species taxonomy.
"""

from enum import Enum

class LanguageCode(str, Enum):
    MARATHI = "Marathi"
    HINDI = "Hindi"
    TAMIL = "Tamil"
    TELUGU = "Telugu"
    MALAYALAM = "Malayalam"
    GUJARATI = "Gujarati"
    BENGALI = "Bengali"
    ODIA = "Odia"
    KANNADA = "Kannada"
    ENGLISH = "English"

class SeaState(str, Enum):
    CALM_GLASSY = "Calm (Glassy)"
    CALM_RIPPLED = "Calm (Rippled)"
    SMOOTH = "Smooth"
    SLIGHT = "Slight"
    MODERATE = "Moderate"
    ROUGH = "Rough"
    VERY_ROUGH = "Very Rough"
    HIGH = "High"
    VERY_HIGH = "Very High"
    PHENOMENAL = "Phenomenal"

class AlertLevel(str, Enum):
    NONE = "NONE"
    GREEN = "GREEN"
    YELLOW_WATCH = "YELLOW_WATCH"
    ORANGE_ALERT = "ORANGE_ALERT"
    RED_WARNING = "RED_WARNING"

class PortDangerSignal(int, Enum):
    SIGNAL_1_CAUTION = 1
    SIGNAL_2_WARNING = 2
    SIGNAL_3_SQUALLY_WINDS = 3
    SIGNAL_4_THREATENING_WEATHER = 4
    SIGNAL_5_CYCLONE_STORM_MODERATE = 5
    SIGNAL_6_CYCLONE_STORM_SEVERE = 6
    SIGNAL_7_CYCLONE_STORM_VERY_SEVERE = 7
    SIGNAL_8_GREAT_DANGER_LANDFALL_NORTH = 8
    SIGNAL_9_GREAT_DANGER_LANDFALL_SOUTH = 9
    SIGNAL_10_GREAT_DANGER_DIRECT_HIT = 10
    SIGNAL_11_COMMUNICATIONS_FAILED = 11

class SpeciesType(str, Enum):
    BANGDA = "Bangda (Indian Mackerel)"
    SURMAI = "Surmai (Kingfish / Seerfish)"
    TARLI = "Tarli (Indian Oil Sardine)"
    POPLET = "Poplet (Silver / Black Pomfret)"
    RAWAS = "Rawas (Indian Salmon)"
    VANJARAM = "Vanjaram (Spanish Mackerel)"
    HALWA = "Halwa (Black Pomfret)"
    BOMBIL = "Bombil (Bombay Duck)"
    JHINGA = "Jhinga (Tiger Prawn / Shrimp)"
    TUNA = "Yellowfin Tuna (Kera)"

class NavigationHazardType(str, Enum):
    IMBL_BUFFER = "IMBL Buffer Zone"
    NAVAL_FIRING_RANGE = "Naval Firing Range"
    MARINE_PROTECTED_AREA = "Marine Protected Sanctuary"
    HIGH_SWELL_SECTOR = "High Swell Wave Hazard"
    SHALLOW_REEF = "Submerged Reef / Shallow Hazard"
