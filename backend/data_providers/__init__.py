"""ORCA 4.0 data acquisition layer.

Importing this package triggers registration of every concrete provider
implementation (MET Norway, Open-Meteo Marine, NDBC buoys, StormGlass,
etc.) with the providers/ abstraction layer.
"""

# Register all concrete providers as a side-effect.
import providers  # noqa: F401
import providers.registry  # noqa: F401

from .canonical import (  # noqa: F401
    CanonicalRecord,
    UNAVAILABLE,
    OBSERVED,
    NEAR_REAL_TIME,
    NOWCAST,
    FORECAST,
    MODEL,
    STALE,
)
from .orchestrator import (  # noqa: F401
    build_canonical_report,
    collect_all,
    select_best,
)
