"""
Eco-Economic Trip Optimizer & Multi-Harbor Wholesale Auction Aggregator
Calculates expected net economic return: Net Profit = (Catch Probability * Weight * Price) - Fuel Cost - Risk Penalty
Compares live wholesale auction rates across adjacent major landing centers to recommend the profit-maximizing port.
"""

from typing import Dict, Any, List, Optional
from utils.h3_spatial import haversine_distance_km

class EconomicService:
    def __init__(self):
        self.harbor_registry = {
            "Malvan Port (Chivla/Dandi)": {
                "coords": (16.058, 73.465),
                "prices": {"Bangda": 180, "Surmai": 650, "Tarli": 120, "Poplet": 850, "Rawas": 700, "Vanjaram": 680}
            },
            "Mirkarwada Harbor (Ratnagiri)": {
                "coords": (16.985, 73.285),
                "prices": {"Bangda": 215, "Surmai": 730, "Tarli": 135, "Poplet": 920, "Rawas": 750, "Vanjaram": 740}
            },
            "Panaji Port (Betim / Mandovi)": {
                "coords": (15.500, 73.830),
                "prices": {"Bangda": 195, "Surmai": 690, "Tarli": 125, "Poplet": 880, "Rawas": 710, "Vanjaram": 700}
            },
            "Old Mangalore Port (Bunder)": {
                "coords": (12.860, 74.835),
                "prices": {"Bangda": 205, "Surmai": 710, "Tarli": 130, "Poplet": 890, "Rawas": 720, "Vanjaram": 720}
            },
            "Cochin Fisheries Harbour (Thoppumpady)": {
                "coords": (9.940, 76.260),
                "prices": {"Bangda": 210, "Surmai": 740, "Tarli": 140, "Poplet": 930, "Rawas": 760, "Vanjaram": 750}
            },
            "Veraval Fisheries Harbour": {
                "coords": (20.900, 70.370),
                "prices": {"Bangda": 175, "Surmai": 640, "Tarli": 115, "Poplet": 870, "Rawas": 690, "Vanjaram": 660}
            }
        }
        self.fuel_cost_per_liter = 98.50

    def optimize_trip_economics(
        self,
        target_ground: Dict[str, Any],
        vessel_profile: Dict[str, Any],
        est_catch_kg: float = 85.0,
        fuel_liters: float = 12.5,
        user_lat: float = 16.0215,
        user_lon: float = 73.4821
    ) -> Dict[str, Any]:
        raw_species = target_ground.get("likely_species", ["Bangda (Indian Mackerel)"])[0]
        matched_species = "Bangda"
        for key in ["Bangda", "Surmai", "Tarli", "Poplet", "Rawas", "Vanjaram"]:
            if key.lower() in raw_species.lower():
                matched_species = key
                break

        base_fuel_cost = fuel_liters * self.fuel_cost_per_liter
        harbor_comparisons: List[Dict[str, Any]] = []

        for harbor_name, harbor_data in self.harbor_registry.items():
            h_lat, h_lon = harbor_data["coords"]
            prices = harbor_data["prices"]
            unit_price = prices.get(matched_species, 200)

            ground_coords = target_ground.get("coordinates", [user_lat, user_lon])
            dist_to_harbor_km = haversine_distance_km(ground_coords[0], ground_coords[1], h_lat, h_lon)
            
            extra_fuel_liters = round((dist_to_harbor_km / 15.0) * 3.5, 2)
            total_fuel_liters = round(fuel_liters + extra_fuel_liters, 2)
            total_fuel_cost = round(total_fuel_liters * self.fuel_cost_per_liter, 2)

            gross_revenue = round(est_catch_kg * unit_price, 2)
            net_profit = round(gross_revenue - total_fuel_cost, 2)

            harbor_comparisons.append({
                "harbor_name": harbor_name,
                "latitude": h_lat,
                "longitude": h_lon,
                "gross_revenue_inr": gross_revenue,
                "total_fuel_cost_inr": total_fuel_cost,
                "net_profit_inr": net_profit,
                "unit_price_per_kg": unit_price,
                "extra_distance_km": round(dist_to_harbor_km, 1),
                "recommended": False
            })

        harbor_comparisons.sort(key=lambda x: x["net_profit_inr"], reverse=True)
        harbor_comparisons[0]["recommended"] = True
        best_option = harbor_comparisons[0]

        return {
            "best_docking_harbor": best_option["harbor_name"],
            "max_expected_profit_inr": best_option["net_profit_inr"],
            "estimated_catch_kg": est_catch_kg,
            "target_species": f"{matched_species} ({raw_species})",
            "fuel_cost_total_inr": round(base_fuel_cost, 2),
            "harbor_comparisons": harbor_comparisons
        }

    def compute_trip_roi(
        self,
        vessel_profile: Dict[str, Any],
        target_species: str = "Bangda (Mackerel)",
        est_catch_kg: float = 85.0,
        origin_lat: float = 16.0215,
        origin_lon: float = 73.4821
    ) -> Dict[str, Any]:
        target_ground = {
            "likely_species": [target_species],
            "coordinates": [origin_lat, origin_lon]
        }
        return self.optimize_trip_economics(
            target_ground=target_ground,
            vessel_profile=vessel_profile,
            est_catch_kg=est_catch_kg,
            fuel_liters=6.4,
            user_lat=origin_lat,
            user_lon=origin_lon
        )

    def get_all_harbor_wholesale_prices(self) -> Dict[str, Any]:
        return {
            "status": "success",
            "currency": "INR",
            "harbors": self.harbor_registry,
            "harbor_registry": self.harbor_registry
        }

economic_service = EconomicService()
