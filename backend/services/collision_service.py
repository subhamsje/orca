"""
Multi-Vessel Fleet CPA/TCPA Collision Avoidance Guard Agent
Computes Closest Point of Approach (CPA in nautical miles) and Time to Closest Point of Approach (TCPA in minutes)
between own-vessel and neighboring AIS targets to prevent collisions at sea.

Solves Cons of Legacy Vessel Tracking Apps:
- Legacy tracking apps display static positions on a map without calculating predictive collision vectors.
- ORCA 4.0 CollisionAvoidanceAgent projects 15-minute linear velocity vectors (SOG/COG) and alerts fishermen
  if CPA falls below 0.5 nautical miles and TCPA is under 10 minutes.
"""

import numpy as np
from typing import Dict, Any, List

class CollisionAvoidanceAgent:
    def calculate_cpa_tcpa(
        self,
        own_lat: float, own_lon: float, own_speed_knots: float, own_cog_deg: float,
        target_lat: float, target_lon: float, target_speed_knots: float, target_cog_deg: float
    ) -> Dict[str, Any]:
        """Calculates CPA (nautical miles) and TCPA (minutes) using 2D relative velocity vectors."""
        # Convert lat/lon offset to relative distance in nautical miles (1 deg lat = 60 NM)
        dx_nm = (target_lon - own_lon) * 60.0 * np.cos(np.radians((own_lat + target_lat) / 2.0))
        dy_nm = (target_lat - own_lat) * 60.0

        range_nm = float(np.hypot(dx_nm, dy_nm))

        # Convert speed/course to velocity vectors (Vx = Speed * sin(COG), Vy = Speed * cos(COG))
        own_vx = own_speed_knots * np.sin(np.radians(own_cog_deg))
        own_vy = own_speed_knots * np.cos(np.radians(own_cog_deg))

        target_vx = target_speed_knots * np.sin(np.radians(target_cog_deg))
        target_vy = target_speed_knots * np.cos(np.radians(target_cog_deg))

        # Relative velocity vector
        rel_vx = target_vx - own_vx
        rel_vy = target_vy - own_vy

        rel_speed_knots = float(np.hypot(rel_vx, rel_vy))

        if rel_speed_knots < 0.1:
            tcpa_mins = 0.0
            cpa_nm = range_nm
        else:
            # TCPA = -(P_rel . V_rel) / |V_rel|^2 (in hours)
            tcpa_hours = -(dx_nm * rel_vx + dy_nm * rel_vy) / (rel_speed_knots ** 2)
            tcpa_mins = float(max(0.0, tcpa_hours * 60.0))

            # CPA position vector = P_rel + V_rel * TCPA
            cpa_x = dx_nm + rel_vx * max(0.0, tcpa_hours)
            cpa_y = dy_nm + rel_vy * max(0.0, tcpa_hours)
            cpa_nm = float(np.hypot(cpa_x, cpa_y))

        is_collision_risk = bool(cpa_nm < 0.5 and 0.0 < tcpa_mins <= 10.0)

        return {
            "initial_range_nm": round(range_nm, 2),
            "relative_speed_knots": round(rel_speed_knots, 1),
            "cpa_nautical_miles": round(cpa_nm, 2),
            "tcpa_minutes": round(tcpa_mins, 1),
            "collision_risk_alert": is_collision_risk,
            "recommended_action": "ALTER COURSE TO STARBOARD 15°" if is_collision_risk else "MAINTAIN COURSE & SPEED"
        }

collision_service = CollisionAvoidanceAgent()
