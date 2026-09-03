"""ORCA 4.0 risk engine — EnvironmentalState, VesselProfile, hazards, circuit breaker, and the continuous risk engine."""
from .state import (  # noqa
    EnvironmentalState,
    EnvVar,
    build_environmental_state,
    classify_freshness,
    nearest_ndbc_station,
    CURRENT,
    RECENT,
    STALE,
    UNAVAILABLE,
)
from .vessel import VesselProfile, default_craft_profile  # noqa
from .hazards import (  # noqa
    wave_height_hazard,
    wind_hazard,
    gust_hazard,
    current_hazard,
    visibility_hazard,
    pressure_hazard,
    precipitation_hazard,
    wave_vessel_interaction_hazard,
    official_warning_hazard,
)
from .circuit_breaker import (  # noqa
    evaluate_circuit_breaker,
    CircuitBreakerResult,
    CircuitBreakerHit,
)
from .engine import (  # noqa
    compute_risk,
    RiskResult,
    RiskComponent,
    WEIGHTS,
    CALCULATION_VERSION,
    CONFIGURATION_VERSION,
    RISK_EQUATION_DOC,
)
from .route_risk import (  # noqa
    compute_route_risk,
    RouteRiskResult,
    RouteSegment,
)
from .replay import assessment_store  # noqa
from .pipeline import assess_now, replay, recent  # noqa
