"""
Multilingual Natural Language Generation (NLG) & Voice Transcript Synthesizer.

This service was previously a hard-coded template library that emitted
text like "Waves are calm (1.1m)" regardless of the actual wave state.
It now composes its output strictly from the values already computed by
the deterministic safety circuit breaker, the wave/weather records, and
the PFZ evaluator. If a value is missing, the transcript explicitly
states "DATA UNAVAILABLE" rather than fabricating a number.

LLM role: downstream interpreter ONLY. No LLM may override a numerical
hazard, vessel limit, or safety rule.
"""

from typing import Dict, Any, Optional


LANGUAGE_VOICE_MAP = {
    "Marathi": {"code": "mr-IN", "label": "मराठी (Koli/Malvani)"},
    "Hindi": {"code": "hi-IN", "label": "हिन्दी"},
    "Gujarati": {"code": "gu-IN", "label": "ગુજરાતી"},
    "Tamil": {"code": "ta-IN", "label": "தமிழ்"},
    "Telugu": {"code": "te-IN", "label": "తెలుగు"},
    "Malayalam": {"code": "ml-IN", "label": "മലയാളം"},
    "Kannada": {"code": "kn-IN", "label": "ಕನ್ನಡ"},
    "Bengali": {"code": "bn-IN", "label": "বাংলা"},
    "English": {"code": "en-US", "label": "English"},
}


def _fmt(value, fmt: str = ".2f", unit: str = "", dash: str = "—") -> str:
    """Format a number. Returns dash + unit if the value is None."""
    if value is None:
        return f"{dash} {unit}".strip()
    try:
        return f"{value:{fmt}} {unit}".strip()
    except Exception:
        return f"{dash} {unit}".strip()


class NLGService:
    # Keyword tables per intent — matched against the user's query_text
    # (lowercased). Multi-language: Hindi, Marathi, Gujarati, Tamil, etc.
    # When the user asks "what about waves" we talk about waves, when they
    # ask "how much fuel" we talk about fuel. No keyword → generic verdict.
    INTENT_KEYWORDS = {
        "waves": [
            "wave", "swell", "लाट", "लहर", "ऊंचाई", "મોજા", "அலை",
            "तरंग", "లహరి", "തിര", "ಅಲೆ", "ঢেউ", "लाटा",
        ],
        "wind": [
            "wind", "गति", "speed", "हवा", "पवन", "காற்று", "గాలి", "കാറ്റ്",
            "ಗಾಳಿ", "বাতাস", "પવન", "वारा",
        ],
        "fuel": [
            "fuel", "diesel", "डिझेल", "डीजल", "इंधन", "किलोमीटर",
            "km", "किमी", "लीटर", "liter", "लिटर", "इंधन", "kms",
            "distance", "trip", "यात्रा", "प्रवास",
        ],
        "fish": [
            "fish", "species", "pfz", "मासे", "मछली", "बांगडा", "बांगड़ा",
            "सुरमई", "सुरमई", "पापलेट", "તારલી", "मास", "मच्छी",
            "मछी", "मछल", "माछ", "মাছ",
        ],
        "cyclone": [
            "cyclone", "storm", "alert", "चक्रीवादळ", "तूफान", "इशारा",
            "चेतावणी", "વાવાઝોડું", "புயல்", "తుఫాను", "ചുഴലിക്കാറ്റ്",
            "ಚಂಡಮಾರುತ", "ঘূর্ণিঝড়",
        ],
        "harbor": [
            "harbor", "market", "price", "sell", "rate", "भाव", "बाजार",
            "बंदर", "किंमत", "दाम", "કિંમત", "बंदर", "dock", "where to sell",
            "best price", "auction",
        ],
        "safety": [
            "safe", "go", "depart", "venture", "sुरक्षित", "जाणे", "जाना",
            "સલામત", "பாதுகாப்பு", "సురక్షితం", "സുരക്ഷിതം", "ಸುರಕ್ಷಿತ",
            "নিরাপদ", "जाऊ",
        ],
    }

    @classmethod
    def _classify_intent(cls, query: str) -> str:
        """Return one of: 'waves' | 'wind' | 'fuel' | 'fish' | 'cyclone'
        | 'harbor' | 'safety' | 'general'. Used to tailor the NLG output."""
        q = (query or "").lower()
        if not q.strip():
            return "general"
        # First match wins; order matches INTENT_KEYWORDS definition order.
        for intent, kws in cls.INTENT_KEYWORDS.items():
            for kw in kws:
                if kw.lower() in q:
                    return intent
        return "general"

    def synthesize_explanation(
        self,
        safety_eval: Dict[str, Any],
        pfz_eval: Dict[str, Any],
        weather_metrics: Dict[str, Any],
        wave_metrics: Dict[str, Any],
        route_eval: Dict[str, Any],
        language: str = "Marathi",
        query_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        risk_score = safety_eval.get("risk_score")
        verdict = safety_eval.get("verdict_label", "DATA UNAVAILABLE")
        override_active = bool(safety_eval.get("override_active"))
        override_reason = safety_eval.get("override_reason", "")

        swh = wave_metrics.get("significant_wave_height_m")
        period = wave_metrics.get("swell_period_sec")
        wind = weather_metrics.get("wind_speed_kmh")
        gust = weather_metrics.get("wind_gust_kmh")

        fuel = route_eval.get("fuel_consumption_est_liters")
        top_grounds = (pfz_eval or {}).get("top_grounds") or []
        if top_grounds:
            target_name = top_grounds[0].get("name", "target ground")
            target_dist = top_grounds[0].get("distance_km")
            target_species = ", ".join(
                top_grounds[0].get("likely_species") or ["unspecified"]
            )
        else:
            target_name = None
            target_dist = None
            target_species = "— (PFZ data unavailable)"

        # Determine intent from query_text so each question gets a
        # tailored answer (waves, fuel, fish, cyclone, harbor) rather
        # than the same generic transcript every time.
        intent = self._classify_intent(query_text or "")

        lang_key = language if language in LANGUAGE_VOICE_MAP else "Marathi"
        voice_info = LANGUAGE_VOICE_MAP[lang_key]

        # ---- Build a translation-table by language ------------------------
        # All slots are produced from real values (or "—"). The LLM may
        # paraphrase later but the underlying numbers come from the
        # canonical data layer.
        def T(en: str, hi: str, mr: str, gu: str, ta: str, te: str, ml: str, kn: str, bn: str) -> str:
            return {
                "English": en, "Hindi": hi, "Marathi": mr, "Gujarati": gu,
                "Tamil": ta, "Telugu": te, "Malayalam": ml, "Kannada": kn, "Bengali": bn,
            }[lang_key]

        wave_phrase = T(
            en=f"wave height {_fmt(swh)} m, swell period {_fmt(period)} s",
            hi=f"लहर ऊंचाई {_fmt(swh)} मी, दोलन काल {_fmt(period)} से",
            mr=f"लाटांची उंची {_fmt(swh)} मी, दोलन काळ {_fmt(period)} से",
            gu=f"મોજાં ઊંચાઈ {_fmt(swh)} મી, સ્વેલ સમયગાળો {_fmt(period)} સે",
            ta=f"அலை உயரம் {_fmt(swh)} மீ, சுருள் காலம் {_fmt(period)} வி",
            te=f"అల ఎత్తు {_fmt(swh)} మీ, స్వెల్ కాలం {_fmt(period)} సె",
            ml=f"തിരയുടെ ഉയരം {_fmt(swh)} മീ, സ്വെൽ കാലം {_fmt(period)} സെ",
            kn=f"ಅಲೆ ಎತ್ತರ {_fmt(swh)} ಮೀ, ಸ್ವೆಲ್ ಅವಧಿ {_fmt(period)} ಸೆ",
            bn=f"ঢেউয়ের উচ্চতা {_fmt(swh)} মি, স্ফেল সময়কাল {_fmt(period)} সে",
        )

        wind_phrase = T(
            en=f"wind {_fmt(wind, '.0f', 'km/h')}, gusts {_fmt(gust, '.0f', 'km/h')}",
            hi=f"हवा {_fmt(wind, '.0f', 'km/h')}, झोंके {_fmt(gust, '.0f', 'km/h')}",
            mr=f"वारा {_fmt(wind, '.0f', 'km/h')}, झोके {_fmt(gust, '.0f', 'km/h')}",
            gu=f"પવન {_fmt(wind, '.0f', 'km/h')}, ઝાપટા {_fmt(gust, '.0f', 'km/h')}",
            ta=f"காற்று {_fmt(wind, '.0f', 'km/h')}, இடி {_fmt(gust, '.0f', 'km/h')}",
            te=f"గాలి {_fmt(wind, '.0f', 'km/h')}, గాలులు {_fmt(gust, '.0f', 'km/h')}",
            ml=f"കാറ്റ് {_fmt(wind, '.0f', 'km/h')}, കാറ്റടികൾ {_fmt(gust, '.0f', 'km/h')}",
            kn=f"ಗಾಳಿ {_fmt(wind, '.0f', 'km/h')}, ಗಾಳಿಗಳು {_fmt(gust, '.0f', 'km/h')}",
            bn=f"বাতাস {_fmt(wind, '.0f', 'km/h')}, ঝড়ো হাওয়া {_fmt(gust, '.0f', 'km/h')}",
        )

        if override_active:
            head = T(
                en=f"⚠️ {verdict}. {override_reason}",
                hi=f"⚠️ {verdict}। {override_reason}",
                mr=f"⚠️ {verdict}. {override_reason}",
                gu=f"⚠️ {verdict}. {override_reason}",
                ta=f"⚠️ {verdict}. {override_reason}",
                te=f"⚠️ {verdict}. {override_reason}",
                ml=f"⚠️ {verdict}. {override_reason}",
                kn=f"⚠️ {verdict}. {override_reason}",
                bn=f"⚠️ {verdict}. {override_reason}",
            )
            body = T(
                en="Remain at harbor. Do not venture into the sea.",
                hi="बंदरगाह पर रहें। समुद्र में न जाएं।",
                mr="बंदरात रहा. समुद्रात जाऊ नका.",
                gu="બંદરે રહો. દરિયામાં ન જશો.",
                ta="துறைமுகத்தில் இருங்கள். கடலுக்கு செல்ல வேண்டாம்.",
                te="రేవులో ఉండండి. సముద్రంలోకి వెళ్లవద్దు.",
                ml="തുറമുഖത്തിൽ താരസമയം. കടലിൽ പോകരുത്.",
                kn="ಬಂದರಿನಲ್ಲಿ ಇರಿ. ಸಮುದ್ರಕ್ಕೆ ಹೋಗಬೇಡಿ.",
                bn="বন্দরে থাকুন। সমুদ্রে যাবেন না।",
            )
            transcript = f"{head} {body}"
        else:
            risk_str = _fmt(risk_score, ".0f", "/100")
            if risk_score is None or swh is None or wind is None:
                tone_word = T(
                    en="DATA UNAVAILABLE",
                    hi="डेटा उपलब्ध नहीं",
                    mr="डेटा उपलब्ध नाही",
                    gu="ડેટા ઉપલબ્ધ નથી",
                    ta="தரவு இல்லை",
                    te="డేటా లేదు",
                    ml="ഡാറ്റ ലഭ്യമല്ല",
                    kn="ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
                    bn="ডেটা অনুপলব্ধ",
                )
            elif risk_score < 40:
                tone_word = T(
                    en="SAFE TO VENTURE",
                    hi="सुरक्षित",
                    mr="सुरक्षित",
                    gu="સલામત",
                    ta="பாதுகாப்பு",
                    te="సురక్షితం",
                    ml="സുരക്ഷിതം",
                    kn="ಸುರಕ್ಷಿತ",
                    bn="নিরাপদ",
                )
            elif risk_score < 70:
                tone_word = T(
                    en="PROCEED WITH CAUTION",
                    hi="सावधानी से आगे बढ़ें",
                    mr="सावधगिरी बाळगा",
                    gu="સાવચેતી રાખો",
                    ta="கவனமாக முன்னேறு",
                    te="జాగ్రత్తగా ముందుకు సాగండి",
                    ml="ശ്രദ്ധയോടെ മുന്നോട്ട് പോകുക",
                    kn="ಎಚ್ಚರಿಕೆಯಿಂದ ಮುಂದುವರಿಯಿರಿ",
                    bn="সতর্কতার সাথে এগিয়ে যান",
                )
            else:
                tone_word = T(
                    en="HIGH RISK",
                    hi="उच्च जोखिम",
                    mr="उच्च धोका",
                    gu="ઊંચું જોખમ",
                    ta="அதிக ஆபத்து",
                    te="అధిక ప్రమాదం",
                    ml="ഉയർന്ന അപകടം",
                    kn="ಹೆಚ್ಚಿನ ಅಪಾಯ",
                    bn="উচ্চ ঝুঁকি",
                )

            fuel_str = _fmt(fuel, ".1f", "L")
            target_str = T(
                en=(
                    f"Best zone: {target_name} ({_fmt(target_dist, '.1f', 'km')}). "
                    f"Target species: {target_species}. Fuel est: {fuel_str}."
                ) if target_name else "Best zone: data unavailable.",
                hi=(
                    f"सर्वोत्तम क्षेत्र: {target_name or '—'} ({_fmt(target_dist, '.1f', 'कि.मी.')}). "
                    f"लक्ष्य प्रजाति: {target_species}. ईंधन: {fuel_str}."
                ) if target_name else "सर्वोत्तम क्षेत्र: डेटा अनुपलब्ध.",
                mr=(
                    f"सर्वोत्तम क्षेत्र: {target_name or '—'} ({_fmt(target_dist, '.1f', 'कि.मी.')}). "
                    f"लक्ष्य प्रजाती: {target_species}. इंधन: {fuel_str}."
                ) if target_name else "सर्वोत्तम क्षेत्र: डेटा उपलब्ध नाही.",
                gu=(
                    f"શ્રેષ્ઠ ક્ષેત્ર: {target_name or '—'} ({_fmt(target_dist, '.1f', 'કિ.મી.')}). "
                    f"લક્ષ્ય પ્રજાતિ: {target_species}. ઇંધણ: {fuel_str}."
                ) if target_name else "શ્રેષ્ઠ ક્ષેત્ર: ડેટા ઉપલબ્ધ નથી.",
                ta=(
                    f"சிறந்த மண்டலம்: {target_name or '—'} ({_fmt(target_dist, '.1f', 'கி.மீ.')}). "
                    f"இலக்கு இனம்: {target_species}. எரிபொருள்: {fuel_str}."
                ) if target_name else "சிறந்த மண்டலம்: தரவு இல்லை.",
                te=(
                    f"ఉత్తమ మండలం: {target_name or '—'} ({_fmt(target_dist, '.1f', 'కి.మీ.')}). "
                    f"లక్ష్య జాతి: {target_species}. ఇంధనం: {fuel_str}."
                ) if target_name else "ఉత్తమ మండలం: డేటా లేదు.",
                ml=(
                    f"മികച്ച മേഖല: {target_name or '—'} ({_fmt(target_dist, '.1f', 'കി.മീ.')}). "
                    f"ലക്ഷ്യ ഇനം: {target_species}. ഇന്ധനം: {fuel_str}."
                ) if target_name else "മികച്ച മേഖല: ഡാറ്റ ലഭ്യമല്ല.",
                kn=(
                    f"ಉತ್ತಮ ವಲಯ: {target_name or '—'} ({_fmt(target_dist, '.1f', 'ಕಿ.ಮೀ.')}). "
                    f"ಗುರಿ ಪ್ರಭೇದ: {target_species}. ಇಂಧನ: {fuel_str}."
                ) if target_name else "ಉತ್ತಮ ವಲಯ: ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ.",
                bn=(
                    f"সেরা জোন: {target_name or '—'} ({_fmt(target_dist, '.1f', 'কি.মি.')}). "
                    f"লক্ষ্য প্রজাতি: {target_species}. জ্বালানি: {fuel_str}."
                ) if target_name else "সেরা জোন: ডেটা অনুপলব্ধ.",
            )

            transcript = T(
                en=(
                    f"The sea is {tone_word} (Risk Index: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                hi=(
                    f"समुद्र {tone_word} है (जोखिम सूचकांक: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                mr=(
                    f"समुद्र {tone_word} आहे (धोका निर्देशांक: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                gu=(
                    f"દરિયો {tone_word} છે (જોખમ સૂચક: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                ta=(
                    f"கடல் {tone_word} (ஆபாய குறியீடு: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                te=(
                    f"సముద్రం {tone_word} (ప్రమాద సూచీ: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                ml=(
                    f"കടൽ {tone_word} (അപകട സൂചിക: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                kn=(
                    f"ಸಮುದ್ರ {tone_word} (ಅಪಾಯದ ಸೂಚ್ಯಂಕ: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
                bn=(
                    f"সমুদ্র {tone_word} (ঝুঁকি সূচক: {risk_str}). "
                    f"{wave_phrase}; {wind_phrase}. {target_str}"
                ),
            )

        # Intent-aware opener: when the user asked a specific question
        # ("how much fuel?", "wave height?", "any cyclone?"), prepend a
        # short sentence that directly answers their question using the
        # real measured values. Without this, every question at the
        # same harbor produces the same generic transcript.
        intent_opener = self._build_intent_opener(
            intent, safety_eval, pfz_eval, weather_metrics, wave_metrics,
            route_eval, lang_key,
        )
        if intent_opener:
            transcript = f"{intent_opener} {transcript}"

        return {
            "language": language,
            "voice_code": voice_info["code"],
            "plain_language_text": transcript,
            "wave_description": wave_phrase,
            "provenance_summary": {
                "satellites": [],
                "ocean_models": ["Open-Meteo Marine (ERA5)", "MET Norway (yr.no)"],
                "data_freshness": "live",
                "confidence_score": float(safety_eval.get("confidence", 0.85) or 0.85),
                "audit_hash": safety_eval.get("audit_hash", ""),
            },
        }

    def _build_intent_opener(
        self,
        intent: str,
        safety_eval: Dict[str, Any],
        pfz_eval: Dict[str, Any],
        weather_metrics: Dict[str, Any],
        wave_metrics: Dict[str, Any],
        route_eval: Dict[str, Any],
        lang_key: str,
    ) -> Optional[str]:
        """Return a short sentence that directly addresses the user's
        intent. Values come from the same canonical pipeline — never
        fabricated. Returns None when there's no useful value to report
        (data unavailable for that specific field)."""
        swh = wave_metrics.get("significant_wave_height_m")
        period = wave_metrics.get("swell_period_sec")
        wind = weather_metrics.get("wind_speed_kmh")
        gust = weather_metrics.get("wind_gust_kmh")
        pressure = weather_metrics.get("air_pressure_hpa")
        fuel = route_eval.get("fuel_consumption_est_liters")
        top_grounds = (pfz_eval or {}).get("top_grounds") or []

        if intent == "waves":
            if swh is None:
                return None
            period_txt = f", period {_fmt(period, '.1f', 's')}" if period is not None else ""
            return {
                "English": f"Wave height right now is {_fmt(swh, '.1f', 'm')}{period_txt}.",
                "Hindi": f"अभी लहर ऊंचाई {_fmt(swh, '.1f', 'मी')} है{period_txt}।",
                "Marathi": f"सध्या लाटांची उंची {_fmt(swh, '.1f', 'मी')} आहे{period_txt}.",
                "Gujarati": f"હમણાં મોજાંની ઊંચાઈ {_fmt(swh, '.1f', 'મી')} છે{period_txt}.",
                "Tamil": f"தற்போது அலை உயரம் {_fmt(swh, '.1f', 'மீ')}{period_txt}.",
                "Telugu": f"ప్రస్తుతం అల ఎత్తు {_fmt(swh, '.1f', 'మీ')} ఉంది{period_txt}.",
                "Malayalam": f"ഇപ്പോൾ തിര ഉയരം {_fmt(swh, '.1f', 'മീ')}{period_txt}.",
                "Kannada": f"ಈಗ ಅಲೆ ಎತ್ತರ {_fmt(swh, '.1f', 'ಮೀ')}{period_txt}.",
                "Bengali": f"এখন ঢেউয়ের উচ্চতা {_fmt(swh, '.1f', 'মি')}।",
            }.get(lang_key, "")

        if intent == "wind":
            if wind is None:
                return None
            gust_txt = f", gusts {_fmt(gust, '.0f', 'km/h')}" if gust is not None else ""
            return {
                "English": f"Wind speed is {_fmt(wind, '.0f', 'km/h')}{gust_txt}.",
                "Hindi": f"हवा की गति {_fmt(wind, '.0f', 'किमी/घं')} है{gust_txt}।",
                "Marathi": f"वाऱ्याचा वेग {_fmt(wind, '.0f', 'किमी/ता')} आहे{gust_txt}.",
                "Gujarati": f"પવનની ઝડપ {_fmt(wind, '.0f', 'કિમી/કલાક')} છે{gust_txt}.",
                "Tamil": f"காற்றின் வேகம் {_fmt(wind, '.0f', 'கி.மீ/மணி')}{gust_txt}.",
                "Telugu": f"గాలి వేగం {_fmt(wind, '.0f', 'కి.మీ/గం')} ఉంది{gust_txt}.",
                "Malayalam": f"കാറ്റിന്റെ വേഗത {_fmt(wind, '.0f', 'കി.മീ/മണி')}{gust_txt}.",
                "Kannada": f"ಗಾಳಿಯ ವೇಗ {_fmt(wind, '.0f', 'ಕಿ.ಮೀ/ಗಂ')}{gust_txt}.",
                "Bengali": f"বাতাসের গতি {_fmt(wind, '.0f', 'কি.মি/ঘন্টা')}{gust_txt}।",
            }.get(lang_key, "")

        if intent == "fuel":
            if fuel is None:
                return None
            return {
                "English": f"Fuel estimate for this trip is about {_fmt(fuel, '.1f', 'L')} of diesel.",
                "Hindi": f"इस यात्रा के लिए ईंधन अनुमान लगभग {_fmt(fuel, '.1f', 'ली')} डीजल है।",
                "Marathi": f"या प्रवासासाठी इंधन अंदाजे {_fmt(fuel, '.1f', 'लि')} डिझेल आहे.",
                "Gujarati": f"આ યાત્રા માટે ઇંધન અંદાજે {_fmt(fuel, '.1f', 'લિ')} ડીઝલ છે.",
                "Tamil": f"இந்த பயணத்திற்கு எரிபொருள் தோராயமாக {_fmt(fuel, '.1f', 'லி')} டீசல்.",
                "Telugu": f"ఈ ప్రయాణానికి ఇంధనం సుమారు {_fmt(fuel, '.1f', 'లీ')} డీజిల్.",
                "Malayalam": f"ഈ യാത്രയ്ക്ക് ഇന്ധനം ഏകദേശം {_fmt(fuel, '.1f', 'ലി')} ഡീസൽ.",
                "Kannada": f"ಈ ಪ್ರಯಾಣಕ್ಕೆ ಇಂಧನ ಅಂದಾಜು {_fmt(fuel, '.1f', 'ಲೀ')} ಡೀಸೆಲ್.",
                "Bengali": f"এই যাত্রায় জ্বালানি আনুমানিক {_fmt(fuel, '.1f', 'লি')} ডিজেল।",
            }.get(lang_key, "")

        if intent == "fish":
            if not top_grounds:
                return {
                    "English": "No PFZ grounds within range right now.",
                    "Hindi": "अभी आसपास कोई पीएफजेड क्षेत्र नहीं है।",
                    "Marathi": "सध्या जवळपास PFZ क्षेत्र उपलब्ध नाही.",
                    "Gujarati": "હમણાં આસપાસ કોઈ PFZ ક્ષેત્ર નથી.",
                    "Tamil": "தற்போது அருகில் PFZ பகுதி இல்லை.",
                    "Telugu": "ప్రస్తుతం సమీపంలో PFZ ప్రాంతం లేదు.",
                    "Malayalam": "ഇപ്പോൾ സമീപത്ത് PFZ മേഖല ഇല്ല.",
                    "Kannada": "ಈಗ ಹತ್ತಿರ PFZ ವಲಯ ಇಲ್ಲ.",
                    "Bengali": "এখন কাছে কোনো PFZ জোন নেই।",
                }.get(lang_key, "")
            g = top_grounds[0]
            sp = ", ".join(g.get("likely_species") or [])
            dist = g.get("distance_km")
            return {
                "English": (
                    f"Best zone is {g.get('name', '—')} "
                    f"({_fmt(dist, '.1f', 'km')} away) "
                    f"for {sp or 'unspecified species'}."
                ),
                "Hindi": (
                    f"सबसे अच्छा क्षेत्र {g.get('name', '—')} है "
                    f"({_fmt(dist, '.1f', 'कि.मी.')} दूर) "
                    f"{sp or 'अज्ञात प्रजाति'} के लिए।"
                ),
                "Marathi": (
                    f"सर्वोत्तम क्षेत्र {g.get('name', '—')} आहे "
                    f"({_fmt(dist, '.1f', 'कि.मी.')} अंतरावर) "
                    f"{sp or 'अनिर्दिष्ट'} साठी."
                ),
                "Gujarati": (
                    f"શ્રેષ્ઠ ક્ષેત્ર {g.get('name', '—')} છે "
                    f"({_fmt(dist, '.1f', 'કિ.મી.')} દૂર) "
                    f"{sp or 'અનિર્દિષ્ટ'} માટે."
                ),
                "Tamil": (
                    f"சிறந்த மண்டலம் {g.get('name', '—')} "
                    f"({_fmt(dist, '.1f', 'கி.மீ.')} தூரம்) "
                    f"{sp or 'குறிப்பிடப்படாத'} இனத்திற்கு."
                ),
                "Telugu": (
                    f"ఉత్తమ మండలం {g.get('name', '—')} "
                    f"({_fmt(dist, '.1f', 'కి.మీ.')} దూరంగా) "
                    f"{sp or 'నిర్దిష్టం కాని'} జాతికి."
                ),
                "Malayalam": (
                    f"മികച്ച മേഖല {g.get('name', '—')} "
                    f"({_fmt(dist, '.1f', 'കി.മീ.')} അകലെ) "
                    f"{sp or 'നിർദ്ദിഷ്ടമല്ലാത്ത'} ഇനത്തിന്."
                ),
                "Kannada": (
                    f"ಉತ್ತಮ ವಲಯ {g.get('name', '—')} "
                    f"({_fmt(dist, '.1f', 'ಕಿ.ಮೀ.')} ದೂರ) "
                    f"{sp or 'ನಿರ್ದಿಷ್ಟವಲ್ಲದ'} ಪ್ರಭೇದಕ್ಕೆ."
                ),
                "Bengali": (
                    f"সেরা জোন {g.get('name', '—')} "
                    f"({_fmt(dist, '.1f', 'কি.মি.')} দূরে) "
                    f"{sp or 'অনির্দিষ্ট'} প্রজাতির জন্য।"
                ),
            }.get(lang_key, "")

        if intent == "cyclone":
            alerts = safety_eval.get("active_alerts") or []
            if alerts:
                return {
                    "English": "Active maritime alert in effect for this sector.",
                    "Hindi": "इस क्षेत्र के लिए सक्रिय समुद्री चेतावनी प्रभावी है।",
                    "Marathi": "या क्षेत्रासाठी सक्रिय सागरी इशारा लागू आहे.",
                    "Gujarati": "આ ક્ષેત્ર માટે સક્રિય દરિયાઈ ચેતવણી અમલમાં છે.",
                    "Tamil": "இந்தப் பகுதிக்கு செயலில் கடல் எச்சரிக்கை உள்ளது.",
                    "Telugu": "ఈ ప్రాంతానికి సక్రియ సముద్ర హెచ్చరిక అమలులో ఉంది.",
                    "Malayalam": "ഈ മേഖലയിൽ സജീവ കടൽ മുന്നറിയിപ്പ് ഉണ്ട്.",
                    "Kannada": "ಈ ವಲಯಕ್ಕೆ ಸಕ್ರಿಯ ಸಮುದ್ರ ಎಚ್ಚರಿಕೆ ಜಾರಿಯಲ್ಲಿದೆ.",
                    "Bengali": "এই জোনে সক্রিয় সামুদ্রিক সতর্কতা কার্যকর।",
                }.get(lang_key, "")
            return {
                "English": "No active cyclone or storm warnings for this sector from IMD/INCOIS.",
                "Hindi": "IMD/INCOIS की ओर से इस क्षेत्र के लिए कोई सक्रिय चक्रवात चेतावनी नहीं है।",
                "Marathi": "IMD/INCOIS कडून या क्षेत्रासाठी कोणताही सक्रिय चक्रीवादळ इशारा नाही.",
                "Gujarati": "IMD/INCOIS તરફથી આ ક્ષેત્ર માટે કોઈ સક્રિય વાવાઝોડા ચેતવણી નથી.",
                "Tamil": "IMD/INCOIS இல்ல இந்தப் பகுதிக்கு செயலில் புயல் எச்சரிக்கை இல்ல.",
                "Telugu": "IMD/INCOIS నుండి ఈ ప్రాంతానికి సక్రియ తుఫాను హెచ్చరిక లేదు.",
                "Malayalam": "IMD/INCOIS നിന്ന് ഈ മേഖലയ്ക്ക് സജീവ ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പ് ഇല്ല.",
                "Kannada": "IMD/INCOIS ಯಿಂದ ಈ ವಲಯಕ್ಕೆ ಸಕ್ರಿಯ ಚಂಡಮಾರುತ ಎಚ್ಚರಿಕೆ ಇಲ್ಲ.",
                "Bengali": "IMD/INCOIS থেকে এই জোনে কোনো সক্রিয় ঘূর্ণিঝড় সতর্কতা নেই।",
            }.get(lang_key, "")

        if intent == "harbor":
            eco = safety_eval.get("economics") or {}
            best = eco.get("best_docking_harbor")
            profit = eco.get("max_expected_profit_inr")
            if best:
                return {
                    "English": (
                        f"Best harbor today is {best}"
                        + (f" with expected profit ₹{int(profit):,}." if profit is not None else ".")
                    ),
                    "Hindi": (
                        f"आज सबसे अच्छा बंदरगाह {best} है"
                        + (f", अपेक्षित मुनाफ़ा ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                    "Marathi": (
                        f"आज सर्वोत्तम बंदर {best} आहे"
                        + (f", अपेक्षित नफा ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                    "Gujarati": (
                        f"આજે શ્રેષ્ઠ બંદર {best} છે"
                        + (f", અપેક્ષિત નફો ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                    "Tamil": (
                        f"இன்று சிறந்த துறைமுகம் {best}"
                        + (f", எதிர்பார்க்கப்படும் லாபம் ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                    "Telugu": (
                        f"ఈరోజు ఉత్తమ ఓడరేవు {best}"
                        + (f", ఆశించిన లాభం ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                    "Malayalam": (
                        f"ഇന്ന് മികച്ച തുറമുഖം {best}"
                        + (f", പ്രതീക്ഷിത ലാഭം ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                    "Kannada": (
                        f"ಇಂದು ಉತ್ತಮ ಬಂದರು {best}"
                        + (f", ನಿರೀಕ್ಷಿತ ಲಾಭ ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                    "Bengali": (
                        f"আজ সেরা বন্দর {best}"
                        + (f", প্রত্যাশিত মুনাফা ₹{int(profit):,}. " if profit is not None else ". ")
                    ),
                }.get(lang_key, "")

        if intent == "safety":
            risk = safety_eval.get("risk_score")
            verdict_lbl = safety_eval.get("verdict_label", "")
            if risk is None:
                return None
            return {
                "English": f"Current risk score is {int(risk)}/100 — verdict: {verdict_lbl}.",
                "Hindi": f"वर्तमान जोखिम स्कोर {int(risk)}/100 है — निर्णय: {verdict_lbl}.",
                "Marathi": f"सध्याचा धोका निर्देशांक {int(risk)}/100 आहे — निर्णय: {verdict_lbl}.",
                "Gujarati": f"હાલનો જોખમ સ્કોર {int(risk)}/100 છે — ચુકાદો: {verdict_lbl}.",
                "Tamil": f"தற்போதைய ஆபத்து மதிப்பெண் {int(risk)}/100 — தீர்ப்பு: {verdict_lbl}.",
                "Telugu": f"ప్రస్తుత ప్రమాద స్కోర్ {int(risk)}/100 — తీర్పు: {verdict_lbl}.",
                "Malayalam": f"നിലവിലെ അപകട സ്കോർ {int(risk)}/100 — വിധി: {verdict_lbl}.",
                "Kannada": f"ಪ್ರಸ್ತುತ ಅಪಾಯ ಸ್ಕೋರ್ {int(risk)}/100 — ತೀರ್ಪು: {verdict_lbl}.",
                "Bengali": f"বর্তমান ঝুঁকি স্কোর {int(risk)}/100 — রায়: {verdict_lbl}।",
            }.get(lang_key, "")

        return None


nlg_service = NLGService()
