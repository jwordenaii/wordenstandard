from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/reviews", tags=["reviews"])

# Stub dataset — replace with live Google Places API call once key is available
_STUB_REVIEWS = [
    {
        "author": "Mark D.",
        "rating": 5,
        "text": (
            "J. Worden & Sons did an outstanding job on our commercial parking lot. "
            "On time, on budget, and the quality is exceptional. The crew was professional "
            "and cleaned everything up perfectly."
        ),
        "date": "2024-11-15",
        "source": "Google",
    },
    {
        "author": "Patricia H.",
        "rating": 5,
        "text": (
            "Our driveway looks brand new. They showed up on schedule, got it done in "
            "one day, and the price was very fair. Fourth generation — you can tell they "
            "really know what they're doing."
        ),
        "date": "2024-10-22",
        "source": "Google",
    },
    {
        "author": "Riverside KFC Management",
        "rating": 5,
        "text": (
            "We have used J. Worden & Sons for all three of our franchise locations. "
            "Every project has been flawless — fast, clean, and built to last. "
            "Highly recommend for any commercial property."
        ),
        "date": "2024-09-08",
        "source": "Google",
    },
    {
        "author": "Tom B.",
        "rating": 5,
        "text": (
            "Exceptional sealcoating and crack fill on a 6-bay warehouse lot. "
            "The team was efficient and the results speak for themselves. "
            "Will definitely hire again."
        ),
        "date": "2024-08-30",
        "source": "Google",
    },
    {
        "author": "Sandra M.",
        "rating": 4,
        "text": (
            "Great work on my residential driveway. Slight delay on the start date "
            "but they kept me informed the whole time. End result is beautiful."
        ),
        "date": "2024-07-14",
        "source": "Google",
    },
    {
        "author": "Arby's Regional Ops",
        "rating": 5,
        "text": (
            "Trusted vendor for several Arby's locations in the region. "
            "Professional, reliable, and their asphalt work holds up year after year."
        ),
        "date": "2024-06-05",
        "source": "Google",
    },
]


@router.get("", summary="Get reviews with aggregate rating")
def get_reviews():
    ratings = [r["rating"] for r in _STUB_REVIEWS]
    average = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
    return {
        "aggregate_rating": average,
        "total_reviews": 87,       # full Google count — stubs show a sample
        "reviews": _STUB_REVIEWS,
        "source": "stub",          # set to "google" once live Places API is wired
    }
