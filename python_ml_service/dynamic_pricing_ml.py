import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

MODEL_PATH = "pricing_model.pkl"

def generate_synthetic_data(n_samples=1000):
    """Generate synthetic historical data for training the pricing model.
    Factors: weather_idx (0-10, 10 is worst), surge_multiplier (1.0-3.0),
    zone_risk (0-10, 10 is high risk of water logging/traffic).
    """
    np.random.seed(42)
    weather_idx = np.random.uniform(0, 10, n_samples)
    surge = np.random.uniform(1.0, 3.0, n_samples)
    zone_risk = np.random.uniform(0, 10, n_samples)
    
    # Target: Weekly Premium Multiplier (base is 1.0)
    # Higher risk/weather/surge slightly increases premium or triggers coverage extensions
    premium_mult = 1.0 + (weather_idx * 0.05) + (zone_risk * 0.04) - (surge * 0.02)
    noise = np.random.normal(0, 0.02, n_samples)
    premium_mult += noise
    
    return pd.DataFrame({
        'weather_idx': weather_idx,
        'surge': surge,
        'zone_risk': zone_risk,
        'premium_mult': premium_mult
    })

def train_and_save_model():
    """Trains the dynamic pricing ML model and saves it."""
    print("Generating synthetic dataset...")
    df = generate_synthetic_data(2000)
    
    X = df[['weather_idx', 'surge', 'zone_risk']]
    y = df['premium_mult']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Model trained. MSE: {mse:.4f}, R2: {r2:.4f}")
    assert r2 > 0.85, "Model R2 score is below threshold!"
    
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

def calculate_weekly_premium(weather_idx: float, surge: float, zone_risk: float) -> float:
    """Inference function: Returns the premium multiplier based on inputs."""
    if not os.path.exists(MODEL_PATH):
        train_and_save_model()
        
    model = joblib.load(MODEL_PATH)
    features = pd.DataFrame([{
        'weather_idx': weather_idx,
        'surge': surge,
        'zone_risk': zone_risk
    }])
    
    multiplier = model.predict(features)[0]
    return float(multiplier)

if __name__ == "__main__":
    # Test execution
    train_and_save_model()
    test_mult = calculate_weekly_premium(8.5, 1.2, 7.0)
    print(f"Test Multiplier for high risk: {test_mult:.2f}")
