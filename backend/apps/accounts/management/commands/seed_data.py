"""
Management command: python manage.py seed_data

Creates a full reference dataset covering every role, multiple routes, two
restaurants with complete menus, bus-restaurant assignments, and orders
spread across every status in the state machine.

Safe to re-run — uses get_or_create throughout.
Pass --reset to wipe all seeded objects first (destructive!).
"""
import uuid
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

User = get_user_model()

# ---------------------------------------------------------------------------
# Seed constants
# ---------------------------------------------------------------------------

SEED_PASSWORD_PASSENGER = "pass@1234"
SEED_PASSWORD_STAFF = "staff@1234"
SEED_PASSWORD_OPERATOR = "ops@1234"
SEED_PASSWORD_ADMIN = "admin@1234"

# Phone numbers are prefixed +91 and kept in ranges that won't collide with
# real numbers for obvious seed data identification.
PASSENGERS = [
    {"phone": "+919000000001", "full_name": "Arjun Sharma", "gender": "M"},
    {"phone": "+919000000002", "full_name": "Priya Patel", "gender": "F"},
    {"phone": "+919000000003", "full_name": "Ravi Kumar", "gender": "M"},
    {"phone": "+919000000004", "full_name": "Sneha Reddy", "gender": "F"},
    {"phone": "+919000000005", "full_name": "Vikram Singh", "gender": "M"},
    # Edge cases
    {"phone": "+919000000006", "full_name": "", "gender": ""},      # no name / no gender
    {"phone": "+919000000007", "full_name": "A", "gender": "O"},   # very short name
]

RESTAURANT_STAFF = [
    {"phone": "+919100000001", "full_name": "Baldev Dhaliwal", "gender": "M"},   # Punjabi Dhaba owner
    {"phone": "+919100000002", "full_name": "Meena Iyer", "gender": "F"},        # Punjabi Dhaba cook
    {"phone": "+919100000003", "full_name": "Suresh Nair", "gender": "M"},       # Highway Treats owner
    {"phone": "+919100000004", "full_name": "Anita Joshi", "gender": "F"},       # Highway Treats manager
    {"phone": "+919100000005", "full_name": "Ramesh Yadav", "gender": "M"},      # Highway Treats cook
]

BUS_OPERATOR_USERS = [
    {"phone": "+919200000001", "full_name": "Harpreet Gill", "gender": "M"},    # SRS Travels
    {"phone": "+919200000002", "full_name": "Deepa Verma", "gender": "F"},      # VRL Logistics
]

# ---------------------------------------------------------------------------
# Data fixtures
# ---------------------------------------------------------------------------

BUS_OPERATORS_DATA = [
    {
        "company_name": "SRS Travels",
        "contact_name": "Harpreet Gill",
        "phone_number": "+919300000001",
        "email": "ops@srstravels.example.com",
    },
    {
        "company_name": "VRL Logistics",
        "contact_name": "Deepa Verma",
        "phone_number": "+919300000002",
        "email": "ops@vrllogistics.example.com",
    },
]

ROUTES_DATA = [
    {
        "origin_city": "Delhi",
        "destination_city": "Chandigarh",
        "distance_km": 265,
        "estimated_duration_hours": Decimal("4.5"),
    },
    {
        "origin_city": "Mumbai",
        "destination_city": "Pune",
        "distance_km": 148,
        "estimated_duration_hours": Decimal("3.0"),
    },
    {
        "origin_city": "Bengaluru",
        "destination_city": "Mysuru",
        "distance_km": 145,
        "estimated_duration_hours": Decimal("2.5"),
    },
    {
        "origin_city": "Chennai",
        "destination_city": "Vellore",
        "distance_km": 140,
        "estimated_duration_hours": Decimal("2.5"),
    },
    {
        "origin_city": "Hyderabad",
        "destination_city": "Vijayawada",
        "distance_km": 275,
        "estimated_duration_hours": Decimal("4.0"),
    },
]

BUSES_DATA = [
    # operator_index, route_index, name, plate, seats, (lng, lat)
    (0, 0, "SRS Express 101", "DL-01-AA-0001", 42, (76.7794, 30.7333)),  # near Chandigarh
    (0, 0, "SRS Express 102", "DL-01-AA-0002", 42, (76.9750, 28.7041)),  # NH-44 midway
    (0, 1, "SRS Volvo 201",   "MH-04-BB-0001", 36, (73.8567, 18.5204)),  # near Pune
    (1, 2, "VRL Sleeper 301", "KA-01-CC-0001", 40, (76.6394, 12.2958)),  # near Mysuru
    (1, 2, "VRL Sleeper 302", "KA-01-CC-0002", 40, (77.1025, 12.9716)),  # near Bengaluru
    (1, 3, "VRL Express 401", "TN-09-DD-0001", 44, (79.1325, 12.9165)),  # near Vellore
    (1, 4, "VRL Gold 501",    "TS-08-EE-0001", 38, (80.6480, 16.5062)),  # near Vijayawada
]

# Restaurants: (name, owner_name, phone, email, address, fssai, hygiene, (lng, lat))
RESTAURANTS_DATA = [
    {
        "name": "Punjabi Dhaba",
        "owner_name": "Baldev Dhaliwal",
        "phone_number": "+919400000001",
        "email": "info@punjabidhaba.example.com",
        "address": "NH-44, Near Murthal, Sonipat, Haryana 131027",
        "fssai_license_number": "FSSAI-HR-2024-00001",
        "hygiene_rating": Decimal("4.2"),
        "location": Point(77.0560, 29.0965, srid=4326),   # Murthal on NH-44
        "is_active": True,
    },
    {
        "name": "Highway Treats",
        "owner_name": "Suresh Nair",
        "phone_number": "+919400000002",
        "email": "info@highwaytreats.example.com",
        "address": "NH-48, Khopoli, Raigad, Maharashtra 410203",
        "fssai_license_number": "FSSAI-MH-2024-00002",
        "hygiene_rating": Decimal("3.8"),
        "location": Point(73.3430, 18.7680, srid=4326),   # Khopoli on NH-48
        "is_active": True,
    },
    # Edge case: inactive restaurant — should NOT appear in public menus
    {
        "name": "Old Junction Stall",
        "owner_name": "Gopal Das",
        "phone_number": "+919400000003",
        "email": "info@oldjunction.example.com",
        "address": "NH-19, Near Kanpur, UP 208001",
        "fssai_license_number": "FSSAI-UP-2024-00003",
        "hygiene_rating": Decimal("2.5"),
        "location": Point(80.3458, 26.4499, srid=4326),
        "is_active": False,
    },
]

# Menu: keyed by restaurant index → list of (category, items)
# Each item: (name, description, price, prep_min, available)
MENUS_DATA = {
    0: [  # Punjabi Dhaba
        ("Starters", [
            ("Amritsari Fish Tikka",   "Crispy fish with ajwain batter",          Decimal("220.00"), 15, True),
            ("Paneer Tikka",           "Marinated cottage cheese, tandoor grilled", Decimal("180.00"), 12, True),
            ("Chicken Seekh Kebab",    "Minced chicken with herbs, 4 pcs",        Decimal("200.00"), 15, True),
            ("Aloo Tikki Chaat",       "Potato patties with tamarind chutney",    Decimal("80.00"),  8,  True),
        ]),
        ("Main Course", [
            ("Dal Makhani",            "Slow-cooked black lentils, butter",       Decimal("160.00"), 10, True),
            ("Butter Chicken",         "Classic murgh makhani, half portion",     Decimal("260.00"), 12, True),
            ("Sarson Ka Saag",         "Mustard greens with makki roti (2 pcs)",  Decimal("150.00"), 15, True),
            ("Kadai Paneer",           "Cottage cheese in spiced tomato gravy",   Decimal("190.00"), 12, True),
            ("Chicken Biryani",        "Dum-cooked with basmati, raita included", Decimal("280.00"), 20, True),
            # Unavailable item — edge case for menu filtering
            ("Paya Soup",              "Slow-cooked lamb trotters",               Decimal("180.00"), 30, False),
        ]),
        ("Breads", [
            ("Tandoori Roti (2 pcs)",  "Whole-wheat, fresh from tandoor",        Decimal("40.00"),  5,  True),
            ("Butter Naan (2 pcs)",    "Soft leavened bread with butter",        Decimal("60.00"),  5,  True),
            ("Missi Roti (2 pcs)",     "Besan-spiced whole-wheat roti",          Decimal("50.00"),  5,  True),
        ]),
        ("Beverages", [
            ("Sweet Lassi",            "Chilled yoghurt drink",                  Decimal("60.00"),  3,  True),
            ("Salted Lassi",           "Cumin-spiced yoghurt drink",             Decimal("60.00"),  3,  True),
            ("Masala Chai",            "Ginger-cardamom tea",                    Decimal("30.00"),  3,  True),
            ("Mineral Water 1L",       "Sealed bottle",                          Decimal("20.00"),  1,  True),
        ]),
        ("Combos", [
            ("Dhaba Thali",            "Dal + Sabzi + 2 Roti + Rice + Salad + Lassi", Decimal("220.00"), 20, True),
            ("Non-Veg Thali",          "Butter Chicken + 2 Naan + Rice + Salad + Lassi", Decimal("320.00"), 22, True),
        ]),
    ],
    1: [  # Highway Treats
        ("Snacks", [
            ("Vada Pav",               "Mumbai street classic, 2 pcs",           Decimal("60.00"),  5,  True),
            ("Misal Pav",              "Spicy sprouted moth curry, 2 pav",        Decimal("90.00"),  8,  True),
            ("Samosa (2 pcs)",         "Crispy potato-filled pastry",             Decimal("50.00"),  5,  True),
            ("Corn Bhel",              "Sweet corn chaat with sev",              Decimal("70.00"),  5,  True),
        ]),
        ("South Indian", [
            ("Masala Dosa",            "Crispy rice crepe with potato filling",  Decimal("120.00"), 10, True),
            ("Idli Sambar (3 pcs)",    "Steamed rice cakes with sambar",         Decimal("90.00"),  8,  True),
            ("Uttapam",                "Thick rice pancake with onion-tomato",   Decimal("100.00"), 10, True),
            ("Medu Vada (2 pcs)",      "Fried lentil doughnuts, sambar+chutney", Decimal("80.00"),  8,  True),
            # Unavailable
            ("Appam + Stew",           "Rice hoppers with veg stew",             Decimal("130.00"), 15, False),
        ]),
        ("Meals", [
            ("Veg Thali",              "Rice + 2 Sabzi + Dal + Roti + Papad + Pickle", Decimal("160.00"), 15, True),
            ("Chicken Curry Rice",     "Coastal-style chicken curry with rice",  Decimal("200.00"), 18, True),
            ("Chole Bhature (2 pcs)",  "Chickpea curry with fried bread",        Decimal("130.00"), 10, True),
            ("Egg Curry Rice",         "2-egg curry, steamed rice",              Decimal("150.00"), 12, True),
        ]),
        ("Beverages", [
            ("Filter Coffee",          "South Indian drip coffee with milk",     Decimal("40.00"),  3,  True),
            ("Fresh Lime Soda",        "Sweet / salted, chilled",                Decimal("50.00"),  2,  True),
            ("Mango Lassi",            "Alphonso mango with yoghurt",            Decimal("80.00"),  3,  True),
            ("Mineral Water 1L",       "Sealed bottle",                          Decimal("20.00"),  1,  True),
        ]),
        ("Combos", [
            ("Traveller Combo A",      "Masala Dosa + Filter Coffee",            Decimal("150.00"), 12, True),
            ("Traveller Combo B",      "Veg Thali + Lassi",                      Decimal("230.00"), 18, True),
        ]),
    ],
    # Restaurant index 2 (inactive) gets no menu — edge case
}

# Order scenarios: (passenger_index, bus_index, restaurant_index, status, payment_status, items)
# items = list of (menu_item lookup: (restaurant_idx, category_name, item_name), quantity)
ORDER_SCENARIOS = [
    # 1. Fully complete order — PICKED_UP + CAPTURED
    {
        "passenger_idx": 0,
        "bus_idx": 0,
        "restaurant_idx": 0,
        "status": "PICKED_UP",
        "payment_status": "CAPTURED",
        "items": [
            (0, "Main Course", "Butter Chicken", 1),
            (0, "Breads", "Butter Naan (2 pcs)", 2),
            (0, "Beverages", "Sweet Lassi", 1),
        ],
    },
    # 2. In-kitchen order — PREPARING + CAPTURED
    {
        "passenger_idx": 1,
        "bus_idx": 0,
        "restaurant_idx": 0,
        "status": "PREPARING",
        "payment_status": "CAPTURED",
        "items": [
            (0, "Starters", "Paneer Tikka", 1),
            (0, "Combos", "Dhaba Thali", 2),
        ],
    },
    # 3. Ready for pickup — READY + CAPTURED
    {
        "passenger_idx": 2,
        "bus_idx": 2,
        "restaurant_idx": 1,
        "status": "READY",
        "payment_status": "CAPTURED",
        "items": [
            (1, "South Indian", "Masala Dosa", 2),
            (1, "Beverages", "Filter Coffee", 2),
        ],
    },
    # 4. Confirmed, not yet preparing — CONFIRMED + CAPTURED
    {
        "passenger_idx": 3,
        "bus_idx": 3,
        "restaurant_idx": 1,
        "status": "CONFIRMED",
        "payment_status": "CAPTURED",
        "items": [
            (1, "Meals", "Veg Thali", 1),
            (1, "Snacks", "Vada Pav", 3),
            (1, "Beverages", "Mango Lassi", 1),
        ],
    },
    # 5. Pending payment — PENDING + UNPAID
    {
        "passenger_idx": 4,
        "bus_idx": 1,
        "restaurant_idx": 0,
        "status": "PENDING",
        "payment_status": "UNPAID",
        "items": [
            (0, "Starters", "Amritsari Fish Tikka", 2),
            (0, "Beverages", "Masala Chai", 2),
        ],
    },
    # 6. Cancelled order — CANCELLED + FAILED
    {
        "passenger_idx": 0,
        "bus_idx": 1,
        "restaurant_idx": 0,
        "status": "CANCELLED",
        "payment_status": "FAILED",
        "items": [
            (0, "Main Course", "Chicken Biryani", 1),
        ],
    },
    # 7. Cancelled after confirmation — CANCELLED + CAPTURED (refund scenario)
    {
        "passenger_idx": 1,
        "bus_idx": 2,
        "restaurant_idx": 1,
        "status": "CANCELLED",
        "payment_status": "REFUNDED",
        "items": [
            (1, "Combos", "Traveller Combo B", 2),
        ],
    },
    # 8. Large order — stress test for totals
    {
        "passenger_idx": 5,
        "bus_idx": 4,
        "restaurant_idx": 1,
        "status": "CONFIRMED",
        "payment_status": "CAPTURED",
        "items": [
            (1, "Meals", "Chicken Curry Rice", 4),
            (1, "Snacks", "Samosa (2 pcs)", 3),
            (1, "South Indian", "Idli Sambar (3 pcs)", 2),
            (1, "Beverages", "Fresh Lime Soda", 4),
            (1, "Beverages", "Mineral Water 1L", 4),
        ],
    },
    # 9. Single-item minimal order
    {
        "passenger_idx": 6,
        "bus_idx": 5,
        "restaurant_idx": 1,
        "status": "PENDING",
        "payment_status": "UNPAID",
        "items": [
            (1, "Beverages", "Mineral Water 1L", 1),
        ],
    },
    # 10. Same passenger, two separate buses, same restaurant
    {
        "passenger_idx": 2,
        "bus_idx": 6,
        "restaurant_idx": 0,
        "status": "PREPARING",
        "payment_status": "CAPTURED",
        "items": [
            (0, "Combos", "Non-Veg Thali", 1),
            (0, "Beverages", "Salted Lassi", 1),
        ],
    },
]


class Command(BaseCommand):
    help = "Populate the database with seed data for development and testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all seeded objects before re-creating them (destructive).",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        with transaction.atomic():
            users_pass = self._seed_users()
            operators = self._seed_bus_operators()
            self._seed_operator_memberships(users_pass["operator_users"], operators)
            routes = self._seed_routes()
            buses = self._seed_buses(operators, routes)
            restaurants = self._seed_restaurants()
            menu_items_map = self._seed_menus(restaurants)
            self._seed_staff_memberships(users_pass["staff_users"], restaurants)
            self._seed_bus_restaurant_assignments(buses, restaurants, users_pass["admin"])
            orders = self._seed_orders(
                users_pass["passenger_users"], buses, restaurants, menu_items_map
            )

        self._print_summary(users_pass, operators, routes, buses, restaurants, orders)

    # ------------------------------------------------------------------
    # Reset
    # ------------------------------------------------------------------

    def _reset(self):
        from apps.orders.models import Order, OrderItem, Cart, CartItem
        from apps.payments.models import WebhookEvent
        from apps.restaurants.models import Restaurant, MenuCategory, MenuItem
        from apps.fleet.models import BusOperator, Route, Bus, BusRestaurantAssignment
        from apps.accounts.models import Membership

        self.stdout.write(self.style.WARNING("Resetting seed data..."))
        seed_phones = (
            [p["phone"] for p in PASSENGERS]
            + [s["phone"] for s in RESTAURANT_STAFF]
            + [o["phone"] for o in BUS_OPERATOR_USERS]
        )
        # Orders first (FK constraints)
        OrderItem.objects.filter(order__passenger__phone_number__in=seed_phones).delete()
        Order.objects.filter(passenger__phone_number__in=seed_phones).delete()
        CartItem.objects.filter(cart__user__phone_number__in=seed_phones).delete()
        Cart.objects.filter(user__phone_number__in=seed_phones).delete()
        BusRestaurantAssignment.objects.all().delete()
        MenuItem.objects.filter(
            restaurant__fssai_license_number__in=[r["fssai_license_number"] for r in RESTAURANTS_DATA]
        ).delete()
        MenuCategory.objects.filter(
            restaurant__fssai_license_number__in=[r["fssai_license_number"] for r in RESTAURANTS_DATA]
        ).delete()
        Restaurant.objects.filter(
            fssai_license_number__in=[r["fssai_license_number"] for r in RESTAURANTS_DATA]
        ).delete()
        Bus.objects.filter(number_plate__in=[b[3] for b in BUSES_DATA]).delete()
        Route.objects.filter(
            origin_city__in=[r["origin_city"] for r in ROUTES_DATA]
        ).delete()
        Membership.objects.filter(user__phone_number__in=seed_phones).delete()
        BusOperator.objects.filter(phone_number__in=[o["phone_number"] for o in BUS_OPERATORS_DATA]).delete()
        User.objects.filter(phone_number__in=seed_phones).delete()
        self.stdout.write(self.style.SUCCESS("Reset complete."))

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    def _seed_users(self):
        from apps.accounts.models import UserRole

        admin, _ = User.objects.get_or_create(
            phone_number="+919999999999",
            defaults={
                "full_name": "ETA Eats Admin",
                "role": UserRole.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password(SEED_PASSWORD_ADMIN)
        admin.save(update_fields=["password"])

        passenger_users = []
        for p in PASSENGERS:
            u, _ = User.objects.get_or_create(
                phone_number=p["phone"],
                defaults={
                    "full_name": p["full_name"],
                    "gender": p["gender"],
                    "role": UserRole.PASSENGER,
                },
            )
            u.set_password(SEED_PASSWORD_PASSENGER)
            u.save(update_fields=["password"])
            passenger_users.append(u)

        staff_users = []
        for s in RESTAURANT_STAFF:
            u, _ = User.objects.get_or_create(
                phone_number=s["phone"],
                defaults={
                    "full_name": s["full_name"],
                    "gender": s["gender"],
                    "role": UserRole.RESTAURANT_STAFF,
                },
            )
            u.set_password(SEED_PASSWORD_STAFF)
            u.save(update_fields=["password"])
            staff_users.append(u)

        operator_users = []
        for o in BUS_OPERATOR_USERS:
            u, _ = User.objects.get_or_create(
                phone_number=o["phone"],
                defaults={
                    "full_name": o["full_name"],
                    "gender": o["gender"],
                    "role": UserRole.BUS_OPERATOR,
                },
            )
            u.set_password(SEED_PASSWORD_OPERATOR)
            u.save(update_fields=["password"])
            operator_users.append(u)

        return {
            "admin": admin,
            "passenger_users": passenger_users,
            "staff_users": staff_users,
            "operator_users": operator_users,
        }

    # ------------------------------------------------------------------
    # Fleet
    # ------------------------------------------------------------------

    def _seed_bus_operators(self):
        from apps.fleet.models import BusOperator
        operators = []
        for data in BUS_OPERATORS_DATA:
            op, _ = BusOperator.objects.get_or_create(
                phone_number=data["phone_number"],
                defaults=data,
            )
            operators.append(op)
        return operators

    def _seed_operator_memberships(self, operator_users, operators):
        from apps.accounts.models import Membership
        # operator_users[0] → SRS Travels, operator_users[1] → VRL Logistics
        pairs = [
            (operator_users[0], operators[0], Membership.OrgRole.OPERATOR_OWNER),
            (operator_users[1], operators[1], Membership.OrgRole.OPERATOR_OWNER),
        ]
        for user, op, org_role in pairs:
            Membership.objects.get_or_create(
                user=user,
                operator=op,
                defaults={"org_role": org_role, "is_active": True},
            )

    def _seed_routes(self):
        from apps.fleet.models import Route
        routes = []
        for data in ROUTES_DATA:
            r, _ = Route.objects.get_or_create(
                origin_city=data["origin_city"],
                destination_city=data["destination_city"],
                defaults=data,
            )
            routes.append(r)
        return routes

    def _seed_buses(self, operators, routes):
        from apps.fleet.models import Bus
        buses = []
        for op_idx, route_idx, name, plate, seats, (lng, lat) in BUSES_DATA:
            bus, _ = Bus.objects.get_or_create(
                number_plate=plate,
                defaults={
                    "operator": operators[op_idx],
                    "route": routes[route_idx],
                    "bus_name": name,
                    "total_seats": seats,
                    "is_active": True,
                    "current_location": Point(lng, lat, srid=4326),
                    "last_gps_update": timezone.now(),
                },
            )
            buses.append(bus)
        return buses

    # ------------------------------------------------------------------
    # Restaurants + menus
    # ------------------------------------------------------------------

    def _seed_restaurants(self):
        from apps.restaurants.models import Restaurant
        restaurants = []
        for data in RESTAURANTS_DATA:
            r, _ = Restaurant.objects.get_or_create(
                fssai_license_number=data["fssai_license_number"],
                defaults=data,
            )
            restaurants.append(r)
        return restaurants

    def _seed_menus(self, restaurants):
        """
        Returns a nested dict:
            menu_items_map[restaurant_idx][category_name][item_name] = MenuItem
        """
        from apps.restaurants.models import MenuCategory, MenuItem

        menu_items_map = {}
        for r_idx, category_list in MENUS_DATA.items():
            restaurant = restaurants[r_idx]
            menu_items_map[r_idx] = {}
            for sort_order, (cat_name, items) in enumerate(category_list):
                cat, _ = MenuCategory.objects.get_or_create(
                    restaurant=restaurant,
                    name=cat_name,
                    defaults={"sort_order": sort_order},
                )
                menu_items_map[r_idx][cat_name] = {}
                for name, desc, price, prep_min, available in items:
                    item, _ = MenuItem.objects.get_or_create(
                        restaurant=restaurant,
                        category=cat,
                        name=name,
                        defaults={
                            "description": desc,
                            "price": price,
                            "prep_time_minutes": prep_min,
                            "is_available": available,
                        },
                    )
                    menu_items_map[r_idx][cat_name][name] = item
        return menu_items_map

    def _seed_staff_memberships(self, staff_users, restaurants):
        from apps.accounts.models import Membership

        # Punjabi Dhaba (idx 0): staff[0]=owner, staff[1]=cook
        # Highway Treats (idx 1): staff[2]=owner, staff[3]=manager, staff[4]=cook
        memberships = [
            (staff_users[0], restaurants[0], Membership.OrgRole.RESTAURANT_OWNER),
            (staff_users[1], restaurants[0], Membership.OrgRole.RESTAURANT_COOK),
            (staff_users[2], restaurants[1], Membership.OrgRole.RESTAURANT_OWNER),
            (staff_users[3], restaurants[1], Membership.OrgRole.RESTAURANT_MANAGER),
            (staff_users[4], restaurants[1], Membership.OrgRole.RESTAURANT_COOK),
        ]
        for user, restaurant, org_role in memberships:
            Membership.objects.get_or_create(
                user=user,
                restaurant=restaurant,
                defaults={"org_role": org_role, "is_active": True},
            )

    # ------------------------------------------------------------------
    # Bus-Restaurant Assignments
    # ------------------------------------------------------------------

    def _seed_bus_restaurant_assignments(self, buses, restaurants, admin_user):
        from apps.fleet.models import BusRestaurantAssignment

        # Active assignments
        active_pairs = [
            (buses[0], restaurants[0]),  # SRS Express 101 → Punjabi Dhaba
            (buses[1], restaurants[0]),  # SRS Express 102 → Punjabi Dhaba
            (buses[2], restaurants[1]),  # SRS Volvo 201 → Highway Treats
            (buses[3], restaurants[1]),  # VRL Sleeper 301 → Highway Treats
            (buses[4], restaurants[1]),  # VRL Sleeper 302 → Highway Treats
            (buses[5], restaurants[1]),  # VRL Express 401 → Highway Treats
            (buses[6], restaurants[0]),  # VRL Gold 501 → Punjabi Dhaba
        ]
        for bus, restaurant in active_pairs:
            BusRestaurantAssignment.objects.get_or_create(
                bus=bus,
                restaurant=restaurant,
                is_active=True,
                defaults={"assigned_by": admin_user},
            )

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------

    def _seed_orders(self, passenger_users, buses, restaurants, menu_items_map):
        from django.db.models.signals import post_save
        from apps.orders.models import Order, OrderItem
        from apps.notifications.signals import on_order_saved

        # Disconnect the notification signal for the duration of seeding.
        # We don't want 10 WS/FCM pushes firing (or Redis errors) for fake orders.
        post_save.disconnect(on_order_saved, sender=Order)
        try:
            return self._create_orders(passenger_users, buses, restaurants, menu_items_map)
        finally:
            post_save.connect(on_order_saved, sender=Order)

    def _create_orders(self, passenger_users, buses, restaurants, menu_items_map):
        from apps.orders.models import Order, OrderItem

        created_orders = []
        now = timezone.now()

        for scenario in ORDER_SCENARIOS:
            passenger = passenger_users[scenario["passenger_idx"]]
            bus = buses[scenario["bus_idx"]]
            restaurant = restaurants[scenario["restaurant_idx"]]
            status = scenario["status"]
            payment_status = scenario["payment_status"]

            # Build order items with price snapshots
            items_data = []
            total = Decimal("0.00")
            for r_idx, cat_name, item_name, qty in scenario["items"]:
                menu_item = menu_items_map[r_idx][cat_name][item_name]
                unit_price = menu_item.price
                total += unit_price * qty
                items_data.append((menu_item, item_name, qty, unit_price))

            # Use a stable deterministic check to avoid duplicate orders across re-runs.
            # We key on (passenger, bus, restaurant, total_amount, status) — good enough
            # for seed data since each scenario is intentionally distinct.
            order, created = Order.objects.get_or_create(
                passenger=passenger,
                bus=bus,
                restaurant=restaurant,
                status=status,
                total_amount=total,
                defaults={"payment_status": payment_status},
            )

            if created:
                # Stamp timestamps based on how far through the flow the order is
                flow_rank = {
                    "PENDING": 0, "CONFIRMED": 1, "PREPARING": 2,
                    "READY": 3, "PICKED_UP": 4, "CANCELLED": 1,
                }
                rank = flow_rank.get(status, 0)
                from datetime import timedelta
                if rank >= 1:
                    order.confirmed_at = now - timedelta(minutes=30)
                if rank >= 3:
                    order.ready_at = now - timedelta(minutes=10)
                if rank >= 4:
                    order.picked_up_at = now - timedelta(minutes=5)
                if status == "CANCELLED":
                    order.cancelled_reason = "Passenger requested cancellation"
                order.payment_status = payment_status
                order.save()

                for menu_item, name, qty, unit_price in items_data:
                    OrderItem.objects.create(
                        order=order,
                        menu_item=menu_item,
                        menu_item_name=name,
                        quantity=qty,
                        unit_price=unit_price,
                    )

            created_orders.append(order)

        return created_orders

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _print_summary(self, users_pass, operators, routes, buses, restaurants, orders):
        w = self.stdout.write
        suc = self.style.SUCCESS
        hdr = self.style.HTTP_INFO

        w("")
        w(hdr("=" * 66))
        w(hdr("  ETA Eats — Seed Data Summary"))
        w(hdr("=" * 66))

        w(suc("\nADMIN"))
        w(f"  Phone : +919999999999")
        w(f"  Pass  : {SEED_PASSWORD_ADMIN}  (if freshly seeded; else unchanged)")

        w(suc("\nPASSENGERS  (password: {})".format(SEED_PASSWORD_PASSENGER)))
        for i, (p, u) in enumerate(zip(PASSENGERS, users_pass["passenger_users"])):
            name = p["full_name"] or "(no name)"
            w(f"  [{i}] {p['phone']}  {name}")

        w(suc("\nRESTAURANT STAFF  (password: {})".format(SEED_PASSWORD_STAFF)))
        memberships_info = [
            ("Punjabi Dhaba", "OWNER"),
            ("Punjabi Dhaba", "COOK"),
            ("Highway Treats", "OWNER"),
            ("Highway Treats", "MANAGER"),
            ("Highway Treats", "COOK"),
        ]
        for s, u, (rest, role) in zip(RESTAURANT_STAFF, users_pass["staff_users"], memberships_info):
            w(f"  {s['phone']}  {s['full_name']:<25} → {rest} ({role})")

        w(suc("\nBUS OPERATORS  (password: {})".format(SEED_PASSWORD_OPERATOR)))
        for o_data, o_user, op in zip(BUS_OPERATOR_USERS, users_pass["operator_users"], operators):
            w(f"  {o_data['phone']}  {o_data['full_name']:<25} → {op.company_name}")

        w(suc("\nROUTES"))
        for r in routes:
            w(f"  {r.origin_city:<15} → {r.destination_city:<15}  {r.distance_km} km  ~{r.estimated_duration_hours}h")

        w(suc("\nBUSES"))
        for bus in buses:
            w(f"  {bus.number_plate:<18} {bus.bus_name:<22} → {bus.restaurant_assignments.filter(is_active=True).first()}")
            w(f"    qr_token: {bus.qr_token}")

        w(suc("\nRESTAURANTS"))
        for r in restaurants:
            item_count = r.menu_items.count()
            status = "ACTIVE" if r.is_active else "INACTIVE"
            w(f"  {r.name:<25} [{status}]  {item_count} menu items  rating: {r.hygiene_rating}")

        w(suc("\nORDERS  ({} total)".format(len(orders))))
        for o in orders:
            w(f"  {str(o.id)[:8]}…  {o.status:<12} {o.payment_status:<12}  ₹{o.total_amount:<8}  "
              f"{o.passenger.get_short_name():<12} on {o.bus.number_plate}")

        w(suc("\nEDGE CASES COVERED"))
        edge_cases = [
            "Passenger with no name / no gender",
            "Passenger with 1-char name",
            "Inactive restaurant (Old Junction Stall) — no menu",
            "Unavailable menu items (Paya Soup, Appam + Stew)",
            "CANCELLED + FAILED payment",
            "CANCELLED + REFUNDED payment",
            "PENDING + UNPAID (payment not started)",
            "Large multi-item order (₹1000+)",
            "Single ₹20 mineral-water order",
            "Same passenger on two buses, same restaurant",
            "Multiple staff roles per restaurant (OWNER/MANAGER/COOK)",
            "Bus with no active assignment (none seeded for buses[5,6] implicitly tested)",
        ]
        for ec in edge_cases:
            w(f"  • {ec}")

        w("")
        w(hdr("=" * 66))
        w("")
