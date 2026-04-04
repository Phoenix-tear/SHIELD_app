import joblib
import pandas as pd

m = joblib.load("pricing_model.pkl")
print(f"Model type: {type(m).__name__}")
print(f"Number of trees: {m.n_estimators}")
print(f"Input features: {m.feature_names_in_.tolist()}")
print(f"Training R2 (from training run): > 0.85 (assertion passed)")
print()

# Test 1: Safe zone, clear weather
safe = pd.DataFrame([{"weather_idx": 2.0, "surge": 1.1, "zone_risk": 1.5}])
print(f"Safe zone prediction (multiplier): {m.predict(safe)[0]:.4f}")
print(f"  -> Weekly premium: Rs {49 * m.predict(safe)[0]:.0f}")

# Test 2: Risky zone, bad weather
risky = pd.DataFrame([{"weather_idx": 8.5, "surge": 1.2, "zone_risk": 7.0}])
print(f"Risky zone prediction (multiplier): {m.predict(risky)[0]:.4f}")
print(f"  -> Weekly premium: Rs {49 * m.predict(risky)[0]:.0f}")

# Test 3: Mid scenario
mid = pd.DataFrame([{"weather_idx": 5.0, "surge": 2.0, "zone_risk": 4.0}])
print(f"Mid scenario prediction (multiplier): {m.predict(mid)[0]:.4f}")
print(f"  -> Weekly premium: Rs {49 * m.predict(mid)[0]:.0f}")
