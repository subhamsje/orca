"""
Eco-Economic Trip Optimizer & Wholesale Market Aggregator Microservice
Calculates expected trip ROI: Net Profit = Catch Value - Fuel Cost - Risk Penalty
Compares live wholesale auction rates across adjacent harbors to recommend max-profit docking.
"""

from typing import Dict, Any, List

class EconomicService:
    def __init__(self):
        # Simulated live wholesale harbor auction rates (INR per kg)
        self.harbor_prices = {
            "Malvan Port": {"Bangda": 180, "Surmai": 650, "Tarli": 120, "Poplet": 850},
            "Ratnagiri Harbor": {"Bangda": 210, "Surmai": 720, "Tarli": 130, "Poplet": 900},
            "Panaji Port": {"Bangda": 195, "Surmai": 690, "Tarli": 125, "Poplet": 880}
        }
        self.fuel_cost_per_liter = 98.50  # INR per liter

    def optimize_trip_economics(
        self,
        target_ground: dict,
        vessel_profile: dict,
        est_catch_kg: float = 85.0,
        fuel_liters: float = 12.5
    ) -> Dict[str, Any]:
        """
        Calculates expected net profit across competing harbors:
        Profit = (Catch Weight * Harbor Price) - Fuel Cost - Risk Cost
        """
        fuel_cost = fuel_liters * self.fuel_cost_per_liter
        likely_species = target_ground.get("likely_species", ["Bangda (Mackerel)"])[0].split(" ")[0]

        harbor_recommendations = []

        for harbor, prices in self.harbor_prices.items():
            unit_price = prices.get(likely_species, 200)
            gross_revenue = est_catch_kg * unit_price
            
            # Extra fuel penalty for further harbors
            extra_dist_km = 10.0 if harbor != "Malvan Port" else 0.0
            total_fuel_liters = fuel_liters + (extra_dist_km * 0.45)
            total_fuel_cost = total_fuel_liters * self.fuel_cost_per_liter
            
            net_profit = gross_revenue - total_fuel_cost

            harbor_recommendations.append({
                "harbor_name": harbor,
                "gross_revenue_inr": round(gross_revenue, 2),
                "total_fuel_cost_inr": round(total_fuel_cost, 2),
                "net_profit_inr": round(net_profit, 2),
                "unit_price_per_kg": unit_price,
                "extra_distance_km": extra_dist_km
            })

        # Sort by maximum net profit
        harbor_recommendations.sort(key=lambda x: x["net_profit_inr"], reverse=True)

        best_option = harbor_recommendations[0]

        return {
            "best_docking_harbor": best_option["harbor_name"],
            "max_expected_profit_inr": best_option["net_profit_inr"],
            "estimated_catch_kg": est_catch_kg,
            "target_species": likely_species,
            "fuel_cost_total_inr": round(fuel_cost, 2),
            "harbor_comparisons": harbor_recommendations
        }

economic_service = EconomicService()
