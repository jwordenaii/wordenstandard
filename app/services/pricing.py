"""
Ballpark pricing estimator for J. Worden & Sons quote requests.

Math basis (industry-standard cost ranges):
  Residential paving    $3.50 – $8.00 / sq ft
  Commercial paving     $2.50 – $6.00 / sq ft  (volume & mobilization efficiencies)
  Sealcoating           $0.15 – $0.35 / sq ft
  Crack filling         $0.40 – $1.00 / sq ft  (average crack density assumption)
  Parking lot           $3.00 – $7.00 / sq ft
  Driveway              $3.50 – $7.50 / sq ft
  Maintenance plan      $0.20 – $0.45 / sq ft / year

All estimates include a $300 mobilization floor — no job dispatches for less.
Returned figures are rounded to the nearest $50 for realistic quoting.

Verification:
  1 000 sq ft residential paving  → $3 500 – $8 000  ✓
  5 000 sq ft commercial paving   → $12 500 – $30 000 ✓
  2 000 sq ft sealcoating         → $300 – $700       ✓ (above mobilization floor)
"""

# ── Rate table: service → property_type → (low, high) $/sq ft ────────────────

_RATES: dict[str, dict[str, tuple[float, float]]] = {
    "paving":      {"residential": (3.50, 8.00), "commercial": (2.50, 6.00)},
    "sealcoating": {"residential": (0.15, 0.35), "commercial": (0.12, 0.30)},
    "crackfill":   {"residential": (0.40, 1.00), "commercial": (0.35, 0.90)},
    "parking_lot": {"residential": (3.00, 7.00), "commercial": (3.00, 7.00)},
    "driveway":    {"residential": (3.50, 7.50), "commercial": (3.00, 6.50)},
    "maintenance": {"residential": (0.20, 0.40), "commercial": (0.18, 0.40)},
}

_MOBILISATION_FLOOR_LOW  = 300.0   # minimum low-end job cost
_MOBILISATION_FLOOR_HIGH = 600.0   # minimum high-end job cost
_ROUND_TO = 50                     # round to nearest $50


def _round_to_nearest(value: float, nearest: int) -> int:
    return int(round(value / nearest) * nearest)


def estimate_price(
    service_type: str,
    property_type: str,
    project_size_sqft: float,
    state_code: str | None = None,
) -> dict | None:
    """
    Return a ballpark cost range or None if the service is not recognised.

    Parameters
    ----------
    service_type      : one of the keys in _RATES
    property_type     : 'residential' | 'commercial'
    project_size_sqft : positive float
    state_code        : optional 2-letter state abbreviation for regional adjustment

    Returns
    -------
    {
        "low_usd":    int,
        "high_usd":   int,
        "low_fmt":    str,
        "high_fmt":   str,
        "multiplier": float,   # state adjustment applied (1.0 = national average)
        "disclaimer": str,
    }
    """
    from .state_data import get_price_multiplier  # noqa: PLC0415

    service   = (service_type  or "").lower().strip()
    property_ = (property_type or "residential").lower().strip()
    sqft      = float(project_size_sqft or 0)

    if service not in _RATES or sqft <= 0:
        return None

    rates = _RATES[service].get(property_) or _RATES[service].get("residential")
    if not rates:
        return None

    multiplier = get_price_multiplier(state_code) if state_code else 1.0
    low_raw  = rates[0] * sqft * multiplier
    high_raw = rates[1] * sqft * multiplier

    low  = max(_round_to_nearest(low_raw,  _ROUND_TO), int(_MOBILISATION_FLOOR_LOW))
    high = max(_round_to_nearest(high_raw, _ROUND_TO), int(_MOBILISATION_FLOOR_HIGH))

    def fmt(n: int) -> str:
        return f"${n:,}"

    return {
        "low_usd":   low,
        "high_usd":  high,
        "low_fmt":   fmt(low),
        "high_fmt":  fmt(high),
        "multiplier": round(multiplier, 3),
        "disclaimer": (
            "Ballpark estimate only — final price depends on site conditions, "
            "material costs, and access. A free on-site quote is always included."
        ),
    }
