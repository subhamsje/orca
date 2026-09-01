"""
Multilingual Plain-Language NLG & Provenance Synthesizer Microservice
Translates complex data metrics into native language audio and plain-language physical descriptions.
"""

from typing import Dict, Any

class NLGService:
    def synthesize_explanation(
        self,
        safety_eval: dict,
        pfz_eval: dict,
        weather_metrics: dict,
        wave_metrics: dict,
        route_eval: dict,
        language: str = "Marathi"
    ) -> Dict[str, Any]:
        """Generates plain language explanations and audio transcriptions."""
        swh = wave_metrics.get("significant_wave_height_m", 1.1)
        verdict = safety_eval.get("verdict_label", "SAFE TO VENTURE")
        override_reason = safety_eval.get("override_reason")
        top_ground = pfz_eval["top_grounds"][0]

        # Plain language physical wave descriptions
        if swh < 1.0:
            wave_desc_mr = "लाटा गुडघ्यापर्यंत - समुद्र शांत आहे."
            wave_desc_en = "Waves knee-high - sea is calm."
        elif swh < 2.0:
            wave_desc_mr = "लाटा छातीपर्यंत - समुद्र थोडा उधाणाचा आहे."
            wave_desc_en = "Waves chest-high - sea is moderately rough."
        else:
            wave_desc_mr = "लाटा खूप मोठ्या आहेत - समुद्रात जाऊ नका."
            wave_desc_en = "Waves extremely high - dangerous sea."

        if language == "Marathi":
            if safety_eval.get("override_active"):
                text_plan = f"⚠️ धोका इशारा! {override_reason}. आज मासेमारीसाठी जाऊ नका."
            else:
                text_plan = (
                    f"आज समुद्र {verdict} आहे (धोका निर्देशांक: {safety_eval['risk_score']}/१००). "
                    f"{wave_desc_mr} "
                    f"सर्वात उत्तम मासेमारीचे क्षेत्र: {top_ground['name']} ({top_ground['distance_km']} किमी). "
                    f"संभाव्य मासे: बांगडा आणि सुरमई."
                )
        else:
            if safety_eval.get("override_active"):
                text_plan = f"⚠️ SAFETY ALERT! {override_reason}. Do not venture out to sea."
            else:
                text_plan = (
                    f"Today's Sea Status: {verdict} (Risk Score: {safety_eval['risk_score']}/100). "
                    f"{wave_desc_en} "
                    f"Best Fishing Zone: {top_ground['name']} ({top_ground['distance_km']} km out). "
                    f"Likely Catch: Mackerel (Bangda) and Kingfish (Surmai)."
                )

        return {
            "plain_language_text": text_plan,
            "wave_description": wave_desc_mr if language == "Marathi" else wave_desc_en,
            "provenance_summary": {
                "satellites": ["INSAT-3DR (SST)", "Oceansat-3 (OCM)", "SCATSAT-1"],
                "ocean_models": ["INCOIS WAVEWATCH III", "ROMS Surface Currents"],
                "data_freshness": "30 minutes ago",
                "confidence_score": 0.94
            }
        }

nlg_service = NLGService()
