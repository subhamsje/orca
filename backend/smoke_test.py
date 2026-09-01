"""
ORCA Backend Automated Smoke Test Suite (Updated with Power Modules)
Executes 6 primary testing scenarios headless with pass/fail verification.
"""

import asyncio
from orchestrator import MultiAgentOrchestrator
from services.economic_service import economic_service
from services.sar_drift_service import sar_drift_service
from services.closed_loop_service import closed_loop_service

async def run_smoke_tests():
    print("==================================================")
    print("  ORCA 4.0 ADVANCED POWER MODULES SMOKE TESTS    ")
    print("==================================================")
    
    orchestrator = MultiAgentOrchestrator()
    
    # Test 1: Safe Scenario Pipeline
    print("\n[Test 1] Executing Safe Trip Pipeline with Economic ROI Engine...")
    res1 = await orchestrator.execute_pipeline(lat=16.0215, lon=73.4821, vessel_length_m=8.5, language="Marathi")
    assert res1["verdict"] == "SAFE TO VENTURE", f"Expected SAFE TO VENTURE, got {res1['verdict']}"
    assert "economics" in res1, "Missing economics payload"
    assert "best_docking_harbor" in res1["economics"], "Missing best docking harbor"
    print("  PASS: Economic ROI computed. Recommended dock:", res1["economics"]["best_docking_harbor"], f"(Est Max Profit: ₹{res1['economics']['max_expected_profit_inr']})")
    
    # Test 2: SAR Monte Carlo Drift Simulator
    print("\n[Test 2] Executing 1,000-Particle Monte Carlo SAR Drift Engine...")
    sar_res = sar_drift_service.simulate_drift_trajectory(16.0215, 73.4821, drift_hours=6.0, num_particles=1000)
    assert len(sar_res["hourly_drift_path"]) == 6, "Expected 6 hourly path points"
    assert sar_res["prioritized_search_radius_km"] > 0, "Expected non-zero search radius"
    print("  PASS: SAR drift centroid computed:", sar_res["drift_centroid"], "Search radius:", sar_res["prioritized_search_radius_km"], "km")

    # Test 3: Closed-Loop Machine Learning Feedback Network
    print("\n[Test 3] Testing Closed-Loop Catch Report & HSI Model Weight Nudge...")
    catch_res = closed_loop_service.ingest_catch_report(16.0215, 73.4821, species="Bangda", weight_kg=120.0, net_type="Gillnet", sst_observed=28.4)
    assert catch_res["status"] == "success", "Expected success status"
    assert catch_res["updated_hsi_weights"]["w_sst"] > 0.35, "Expected weight nudge for SST"
    print("  PASS: HSI Model weights updated dynamically:", catch_res["updated_hsi_weights"])

    # Test 4: Statistical Outlier Rejection Filter
    print("\n[Test 4] Testing Catch Report Outlier Rejection...")
    bad_catch = closed_loop_service.ingest_catch_report(16.0215, 73.4821, species="Bangda", weight_kg=5000.0, net_type="Gillnet")
    assert bad_catch["status"] == "rejected", "Expected outlier rejection"
    print("  PASS: Unrealistic catch report rejected by outlier filter.")

    print("\n==================================================")
    print("     ALL POWER MODULE TESTS PASSED (4/4)          ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_smoke_tests())
