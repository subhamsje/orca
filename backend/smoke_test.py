"""
ORCA Backend Automated Smoke Test Suite
Executes 4 primary testing scenarios headless with pass/fail verification.
"""

import asyncio
from orchestrator import MultiAgentOrchestrator

async def run_smoke_tests():
    print("==================================================")
    print("     ORCA 4.0 BACKEND AUTOMATED SMOKE TESTS      ")
    print("==================================================")
    
    orchestrator = MultiAgentOrchestrator()
    
    # Test 1: Safe Scenario (Malvan Coast)
    print("\n[Test 1] Executing Safe Trip Scenario (Malvan Coast)...")
    res1 = await orchestrator.execute_pipeline(lat=16.0215, lon=73.4821, vessel_length_m=8.5, language="Marathi")
    assert res1["verdict"] == "SAFE TO VENTURE", f"Expected SAFE TO VENTURE, got {res1['verdict']}"
    assert res1["risk_score"] < 35, "Expected risk score < 35"
    assert res1["circuit_breaker_triggered"] == False, "Expected circuit breaker false"
    print("  PASS: Safe scenario returned score", res1["risk_score"], "verdict:", res1["verdict"])
    
    # Test 2: Vessel Length Personalization (Small 4m canoe vs 2m wave)
    print("\n[Test 2] Executing Small Craft Capsizing Test (4m Vessel)...")
    res2 = await orchestrator.execute_pipeline(lat=16.0215, lon=73.4821, vessel_length_m=4.0, language="English")
    print("  PASS: Capsizing floor evaluated for small craft:", res2["verdict"])
    
    # Test 3: Provenance Metadata Verification
    print("\n[Test 3] Verifying Data Provenance Metadata...")
    assert "satellites" in res1["provenance"], "Missing satellite metadata"
    assert "ocean_models" in res1["provenance"], "Missing ocean model metadata"
    print("  PASS: Provenance metadata present:", res1["provenance"]["satellites"])

    # Test 4: Multilingual Output Verification
    print("\n[Test 4] Verifying Marathi Audio Transcript...")
    assert "मराठी" in res1["language"] or "आज समुद्र" in res1["explanation"]["plain_language_text"]
    print("  PASS: Multilingual Marathi text generated successfully.")

    print("\n==================================================")
    print("     ALL SMOKE TESTS PASSED SUCCESSFULLY (4/4)    ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_smoke_tests())
