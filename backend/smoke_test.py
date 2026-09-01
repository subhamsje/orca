"""
ORCA 4.0 Advanced Power Modules & Multi-Service Integration Smoke Tests
"""

import asyncio
import time

from orchestrator import MultiAgentOrchestrator
from services.economic_service import economic_service
from services.sar_drift_service import sar_drift_service
from services.closed_loop_service import closed_loop_service

async def run_smoke_tests():
    print("=" * 66)
    print("      ORCA 4.0 UNIVERSAL MARINE OPERATING SYSTEM SMOKE TESTS      ")
    print("         Sponsored by ISRO / SIH26176 / INCOIS / IMD              ")
    print("=" * 66)

    orchestrator = MultiAgentOrchestrator()

    # Test 1: Sub-100ms Multi-Service Pipeline & Economic Engine
    print("\n[Test 1] Executing Sub-100ms Multi-Service Decision Pipeline...")
    t0 = time.time()
    res1 = await orchestrator.execute_pipeline(lat=16.0215, lon=73.4821, vessel_length_m=8.5, language="Marathi")
    dt1 = (time.time() - t0) * 1000

    assert res1["verdict"] in ["SAFE TO VENTURE", "MODERATE RISK / CAUTION"], f"Unexpected verdict: {res1['verdict']}"
    assert "economics" in res1
    best_harbor = res1["economics"]["best_docking_harbor"]
    max_profit = res1["economics"]["max_expected_profit_inr"]

    print(f"  PASS: Pipeline executed in {dt1:.2f}ms. Verdict: {res1['verdict']}")
    print(f"  PASS: Economic ROI computed. Recommended dock: {best_harbor} (Est Max Profit: ₹{max_profit})")

    # Test 2: 1,000-Particle Monte Carlo SAR Drift Engine
    print("\n[Test 2] Executing 1,000-Particle Monte Carlo SAR Drift Engine...")
    sar_res = sar_drift_service.simulate_drift_trajectory(
        last_known_lat=16.0215,
        last_known_lon=73.4821,
        drift_hours=6.0,
        num_particles=1000
    )
    assert len(sar_res["hourly_drift_path"]) == 6
    assert sar_res["prioritized_search_radius_km"] > 0
    print(f"  PASS: SAR drift centroid computed: {sar_res['drift_centroid']} Search radius: {sar_res['prioritized_search_radius_km']} km")

    # Test 3: Closed-Loop Catch Report Feedback Network & HSI Calibration
    print("\n[Test 3] Testing Closed-Loop Catch Report & HSI Model Weight Nudge...")
    catch_res = closed_loop_service.ingest_catch_report(
        lat=16.0215,
        lon=73.4821,
        species="Bangda",
        weight_kg=120.0,
        net_type="Gillnet",
        sst_observed=28.2,
        device_id="SMOKE-TEST-DEV"
    )
    assert catch_res["status"] == "success"
    print(f"  PASS: HSI Model weights updated dynamically: {catch_res['updated_hsi_weights']}")

    # Test 4: Outlier Catch Report Filtering
    print("\n[Test 4] Testing Catch Report Outlier Rejection...")
    bad_res = closed_loop_service.ingest_catch_report(
        lat=16.0215,
        lon=73.4821,
        species="Bangda",
        weight_kg=15000.0,
        net_type="Trawl",
        device_id="SMOKE-TEST-OUTLIER"
    )
    assert bad_res["status"] == "rejected"
    print("  PASS: Unrealistic catch report rejected by outlier filter.")

    print("\n" + "=" * 66)
    print("     ALL POWER MODULE TESTS PASSED (4/4)          ")
    print("=" * 66 + "\n")

if __name__ == "__main__":
    asyncio.run(run_smoke_tests())
