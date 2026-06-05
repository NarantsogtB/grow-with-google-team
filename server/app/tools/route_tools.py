# =============================================================================
# ROUTE OPTIMIZATION TOOL — app/tools/route_tools.py
# =============================================================================
# Deterministic tool: ZERO LLM tokens consumed.
#
# WHAT THIS TOOL DOES:
# Given a list of What3Words addresses, it:
# 1. Converts each W3W address to GPS coordinates (calls W3W REST API)
# 2. Sorts them into the optimal visit order using the nearest-neighbor
#    Traveling Salesman Problem (TSP) heuristic
#
# WHY NOT USE AN AI MODEL FOR ROUTING?
# Route optimization is a deterministic math problem. Using an LLM for this
# would be like asking GPT "what is 2+2?". It wastes tokens, adds latency,
# and gives non-deterministic results. Pure Python is:
#   - Faster (milliseconds vs. 1-2 seconds)
#   - Free (no API tokens)
#   - Reproducible (same input always gives same output)
#
# WHAT IS WHAT3WORDS?
# What3Words (W3W) divides the entire Earth into 3m×3m squares, each assigned
# a unique 3-word address like "///filled.count.soap". This is essential in
# Mongolia's ger districts where street addresses are often vague or absent.
# The W3W API converts "///filled.count.soap" to lat/lng (47.9077, 106.8832).
#
# ALGORITHM: Nearest-Neighbor TSP Heuristic
# - Not globally optimal, but finds a good solution very quickly
# - O(n²) time complexity — fine for n ≤ 20 patients per day
# - Starting point = doctor's first scheduled patient (or current location)
# =============================================================================

import math
from typing import Dict, List, Tuple

import httpx
from app.core.config import settings


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate straight-line distance between two GPS points using the Haversine formula.

    Named after the haversine trigonometric function: hav(θ) = sin²(θ/2)
    Accurate to within 0.3% for distances under 10,000 km.

    Example:
        haversine_km(47.9077, 106.8832, 47.9177, 106.8932)
        # → approximately 1.3 km

    Args:
        lat1, lon1: Starting GPS coordinates (degrees)
        lat2, lon2: Ending GPS coordinates (degrees)

    Returns:
        Distance in kilometers as a float
    """
    R = 6371  # Earth's mean radius in km

    # Convert degrees to radians — math.sin/cos expect radians
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))

    return R * c


async def w3w_to_coords(w3w_address: str) -> Tuple[float, float]:
    """
    Convert a What3Words address to GPS coordinates via the W3W REST API.

    Args:
        w3w_address: A W3W address like "///filled.count.soap" or "filled.count.soap"

    Returns:
        (latitude, longitude) tuple

    Raises:
        httpx.HTTPError: if the W3W API call fails
        KeyError: if the address is not found (invalid W3W address)

    API docs: https://developer.what3words.com/public-api/docs#convert-to-coordinates
    Get your free key at: https://developer.what3words.com/public-api
    """
    # W3W addresses may or may not have the "///" prefix — strip it for the API
    clean_address = w3w_address.lstrip("/")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.what3words.com/v3/convert-to-coordinates",
            params={
                "words": clean_address,
                "key": settings.WHAT3WORDS_API_KEY,
            },
            timeout=10.0,  # 10-second timeout — don't block forever on network issues
        )
        response.raise_for_status()

    data = response.json()
    coords = data["coordinates"]
    return coords["lat"], coords["lng"]


def calculate_shortest_route_by_coords(
    coords: List[Tuple[float, float]],
) -> List[int]:
    """
    Pure-math nearest-neighbor TSP on (lat, lng) pairs.

    Args:
        coords: list of (lat, lng) tuples. Index 0 = starting point.

    Returns:
        List of indices into `coords` in optimal visit order.
        Always starts with 0. Length == len(coords).

    Example:
        coords = [(47.91, 106.90), (47.93, 106.89), (47.92, 106.92)]
        calculate_shortest_route_by_coords(coords)
        # → [0, 1, 2]  (or whichever order is shortest)
    """
    n = len(coords)
    if n <= 1:
        return list(range(n))

    order = [0]
    unvisited = set(range(1, n))
    current = 0

    while unvisited:
        cur_lat, cur_lng = coords[current]
        nearest = min(
            unvisited,
            key=lambda i: haversine_km(cur_lat, cur_lng, coords[i][0], coords[i][1]),
        )
        order.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    return order


async def calculate_shortest_route_tool(w3w_locations: List[str]) -> List[str]:
    """
    Sort a list of What3Words addresses into the optimal visit order.

    Algorithm: Nearest-Neighbor TSP Heuristic
    1. Start at the first location (index 0 = doctor's starting point)
    2. At each step, visit the closest unvisited location next
    3. Repeat until all locations are visited

    This is greedy — it doesn't guarantee the globally optimal route, but
    for daily schedules of ≤20 patients, it's within 15-25% of optimal
    and runs in milliseconds.

    For a global optimum, you'd use OR-Tools or a proper TSP solver — but
    that's overkill for a family doctor seeing 5-10 patients a day.

    Args:
        w3w_locations: List of W3W addresses, e.g.:
            ["///filled.count.soap", "///index.home.raft", "///limit.broom.topic"]
        The first element is the doctor's starting point.

    Returns:
        The same list re-ordered for optimal visiting sequence.

    Example:
        Input:  ["///start.point.here", "///far.away.place", "///nearby.street.corner"]
        Output: ["///start.point.here", "///nearby.street.corner", "///far.away.place"]
                                           ↑ closer to start                 ↑ farther
    """
    if len(w3w_locations) <= 1:
        return w3w_locations  # Nothing to sort

    # Step 1: Convert all W3W addresses to GPS coordinates in parallel
    # We use a dict to avoid looking up the same address twice
    coords: Dict[str, Tuple[float, float]] = {}
    for w3w in w3w_locations:
        coords[w3w] = await w3w_to_coords(w3w)

    # Step 2: Nearest-neighbor TSP
    # Start at the first location (doctor's home/clinic)
    route = [w3w_locations[0]]
    unvisited = list(w3w_locations[1:])
    current = w3w_locations[0]

    while unvisited:
        current_lat, current_lon = coords[current]

        # Find the closest unvisited location using Haversine distance
        nearest = min(
            unvisited,
            key=lambda w: haversine_km(
                current_lat,
                current_lon,
                coords[w][0],
                coords[w][1],
            ),
        )

        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    return route
