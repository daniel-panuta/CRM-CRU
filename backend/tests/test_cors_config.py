from config import parse_cors_origins


def test_parse_cors_origins_uses_secure_defaults_when_empty():
    assert parse_cors_origins("") == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_parse_cors_origins_parses_csv_and_trims_whitespace():
    assert parse_cors_origins(" http://localhost:5173 , https://crm.example.com ") == [
        "http://localhost:5173",
        "https://crm.example.com",
    ]
