# =============================================================================
# UNIT TESTS: ROUTE TOOLS — tests/unit/test_route_tools.py
# =============================================================================
# These tests verify the route optimization logic WITHOUT calling any external API.
#
# KEY TESTING PATTERNS:
#
# 1. Pure function test (test_haversine_*):
#    No mocking needed. We just call haversine_km() with known values
#    and verify the math output. Like testing a calculator.
#
# 2. Mocked API test (test_calculate_shortest_route_*):
#    We use pytest-mock's `mocker.patch` to REPLACE the real w3w_to_coords()
#    function with a fake version that returns pre-defined coordinates.
#    This means:
#    - No internet connection needed
#    - No API key needed
#    - Test runs in milliseconds instead of 1-2 seconds
#    - Test is deterministic (same output every time)
#
# WHY MOCK EXTERNAL APIS?
# If tests call real APIs:
#    - They fail when you have no internet (developer on a plane)
#    - They fail when the API is down (not your fault, but CI fails)
#    - They consume API quota (costs money over many test runs)
#    - They're slow (100-500ms per call)
# =============================================================================

import pytest

from app.tools.route_tools import calculate_shortest_route_tool, haversine_km


class TestHaversine:
    """Test the Haversine distance formula with known reference values."""

    def test_zero_distance(self):
        """Distance from a point to itself is exactly 0."""
        assert haversine_km(47.9077, 106.8832, 47.9077, 106.8832) == 0.0

    def test_known_ulaanbaatar_distance(self):
        """
        Verify approximate distance between two points in Ulaanbaatar.
        Moving ~0.01° N and ~0.01° E from Sükhbaatar Square ≈ 1.3 km.
        (This is a sanity check — exact value depends on Earth's curvature at this latitude.)
        """
        dist = haversine_km(47.9077, 106.8832, 47.9177, 106.8932)
        # Allow a 10% tolerance for floating point and Earth's non-perfect spherical shape
        assert 1.0 < dist < 1.8, f"Expected ~1.3 km, got {dist:.4f} km"

    def test_symmetry(self):
        """Distance A→B must equal distance B→A."""
        dist_ab = haversine_km(47.9077, 106.8832, 47.9500, 106.9000)
        dist_ba = haversine_km(47.9500, 106.9000, 47.9077, 106.8832)
        assert abs(dist_ab - dist_ba) < 0.0001, "Haversine should be symmetric"

    def test_positive_distance(self):
        """Distance is always non-negative."""
        assert haversine_km(0.0, 0.0, 90.0, 180.0) > 0


class TestCalculateShortestRoute:
    """Test the nearest-neighbor TSP route optimization with mocked W3W API."""

    @pytest.mark.asyncio
    async def test_empty_list_returns_empty(self, mocker):
        """Edge case: empty input should return empty list."""
        result = await calculate_shortest_route_tool([])
        assert result == []

    @pytest.mark.asyncio
    async def test_single_location_returns_unchanged(self, mocker):
        """Edge case: single location needs no sorting."""
        result = await calculate_shortest_route_tool(["///single.word.address"])
        assert result == ["///single.word.address"]

    @pytest.mark.asyncio
    async def test_nearest_neighbor_ordering(self, mocker):
        """
        Given 3 locations, verify that the nearest-neighbor algorithm
        visits the closest location first.

        Setup:
          - Start: Sükhbaatar Square (47.91, 106.88)
          - Location B: 1 km north (47.92, 106.88) — closer to start
          - Location C: 5 km east  (47.91, 106.94) — farther from start

        Expected route: Start → B (closer) → C (farther)
        """
        # These are the fake coordinates our mock will return
        fake_coords = {
            "///start.point.here": (47.91, 106.88),   # Starting point
            "///close.location.b": (47.92, 106.88),   # ~1 km north
            "///far.location.c":   (47.91, 106.94),   # ~5 km east
        }

        async def mock_w3w_to_coords(address: str):
            """Fake version of w3w_to_coords — returns pre-defined coordinates."""
            return fake_coords[address]

        # Replace the REAL w3w_to_coords with our FAKE version for this test only
        # After the test, pytest-mock automatically restores the original function
        mocker.patch(
            "app.tools.route_tools.w3w_to_coords",
            side_effect=mock_w3w_to_coords,
        )

        result = await calculate_shortest_route_tool(list(fake_coords.keys()))

        assert result[0] == "///start.point.here", "Start point should remain first"
        assert result[1] == "///close.location.b", "Closer location should be visited second"
        assert result[2] == "///far.location.c", "Farther location should be visited last"

    @pytest.mark.asyncio
    async def test_two_locations_always_returns_both(self, mocker):
        """With 2 locations, the route must contain exactly both."""
        mocker.patch(
            "app.tools.route_tools.w3w_to_coords",
            side_effect=lambda addr: {"///loc.a.here": (47.9, 106.8), "///loc.b.there": (47.95, 106.85)}[addr],
        )

        result = await calculate_shortest_route_tool(["///loc.a.here", "///loc.b.there"])
        assert len(result) == 2
        assert "///loc.a.here" in result
        assert "///loc.b.there" in result

    @pytest.mark.asyncio
    async def test_w3w_api_failure_propagates(self, mocker):
        """If the W3W API fails, the exception should propagate (not be swallowed)."""
        mocker.patch(
            "app.tools.route_tools.w3w_to_coords",
            side_effect=Exception("W3W API unavailable"),
        )

        with pytest.raises(Exception, match="W3W API unavailable"):
            await calculate_shortest_route_tool(["///some.w3w.address", "///another.w3w.address"])
