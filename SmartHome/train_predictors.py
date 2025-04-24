# train_predictors.py

import pandas as pd
import xgboost as xgb
# from xgboost.callback import EarlyStopping # Not needed when using early_stopping_rounds parameter
from sklearn.model_selection import train_test_split # Keep for potential future use?
from sklearn.metrics import mean_squared_error
import json
import os
import datetime
import requests
import time
import numpy as np # Keep numpy import for sqrt
import logging # Added logging import

# Configuration
CONFIG_PATH = "config/ai_config.json"

MONGO_ENABLED = False # From original code, assuming still relevant
MODEL_SAVE_DIR = "models/predictors"
MODEL_TEMP_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_temp_predictor.json")
MODEL_HUMID_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_humid_predictor.json")
PREDICTION_HORIZON_MINUTES = 60
MINUTES_PER_SAMPLE = 60
LAG_STEPS_COUNT = 5
LOCAL_CSV_PATH = "open_meteo_data.csv" # Define local CSV path


# --- Configuration Loading (improved path handling) ---
print("Loading configuration...")
try:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir) # Assume script is in project root/some_subdir

    # Construct potential config paths relative to project root or script dir
    config_path_in_root = os.path.join(project_root, CONFIG_PATH)
    config_path_in_script_dir_subdir = os.path.join(script_dir, CONFIG_PATH) # If config/ is subdir of script dir
    config_path_as_is = CONFIG_PATH # Relative to CWD

    effective_config_path = None
    if os.path.exists(config_path_in_root):
        effective_config_path = config_path_in_root
    elif os.path.exists(config_path_in_script_dir_subdir):
         effective_config_path = config_path_in_script_dir_subdir
    elif os.path.exists(config_path_as_is):
         effective_config_path = config_path_as_is

    if effective_config_path and os.path.exists(effective_config_path):
        print(f"Loading configuration from: {os.path.abspath(effective_config_path)}")
        with open(effective_config_path, 'r') as f:
            settings = json.load(f)

        pred_cfg = settings.get("prediction", {})

        # Resolve Model Save Directory relative to project root preferably
        temp_model_rel_path = pred_cfg.get("temp_model_path") # e.g., "models/predictors/xgboost_temp_predictor.json"
        if temp_model_rel_path:
             potential_save_dir = os.path.join(project_root, os.path.dirname(temp_model_rel_path))
             if os.path.exists(os.path.dirname(potential_save_dir)): # Check if parent exists
                 MODEL_SAVE_DIR = os.path.normpath(potential_save_dir)
             else: # Fallback to relative CWD or default
                 MODEL_SAVE_DIR = os.path.dirname(temp_model_rel_path) # Relative to CWD
                 if not os.path.exists(os.path.dirname(MODEL_SAVE_DIR)):
                      MODEL_SAVE_DIR = os.path.join(script_dir, "models/predictors") # Default if others fail
        else:
            MODEL_SAVE_DIR = os.path.join(project_root, "models/predictors") # Default relative to root

        PREDICTION_HORIZON_MINUTES = pred_cfg.get("prediction_horizon_minutes", 60)
        MINUTES_PER_SAMPLE = pred_cfg.get("minutes_per_sample", 60) # Default 60 for hourly
        LAG_STEPS_COUNT = pred_cfg.get("lag_steps_count", 5)

        MODEL_TEMP_PATH = os.path.join(MODEL_SAVE_DIR, os.path.basename(pred_cfg.get("temp_model_path", "xgboost_temp_predictor.json")))
        MODEL_HUMID_PATH = os.path.join(MODEL_SAVE_DIR, os.path.basename(pred_cfg.get("humid_model_path", "xgboost_humid_predictor.json")))

    else:
        print(f"Warning: Config file not found at expected locations. Using default paths and parameters relative to script directory.")
        # Set safe defaults if config loading fails
        MODEL_SAVE_DIR = os.path.join(script_dir, "models/predictors")
        MODEL_TEMP_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_temp_predictor.json")
        MODEL_HUMID_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_humid_predictor.json")
        # Keep default values for horizon, sample, lag


    # Ensure model save directory exists
    print(f"Model save directory: {os.path.abspath(MODEL_SAVE_DIR)}")
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    print(f"Temp model path: {os.path.abspath(MODEL_TEMP_PATH)}")
    print(f"Humid model path: {os.path.abspath(MODEL_HUMID_PATH)}")
    print(f"Prediction Horizon: {PREDICTION_HORIZON_MINUTES} mins")
    print(f"Minutes Per Sample: {MINUTES_PER_SAMPLE} mins")
    print(f"Lag Steps Count: {LAG_STEPS_COUNT}")


except Exception as e:
    print(f"Error loading configuration: {e}. Using defaults relative to script directory.")
    # Set safe defaults if config loading fails completely
    script_dir = os.path.dirname(os.path.abspath(__file__))
    MODEL_SAVE_DIR = os.path.join(script_dir, "models/predictors")
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    MODEL_TEMP_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_temp_predictor.json")
    MODEL_HUMID_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_humid_predictor.json")
    # Default horizon, sample, lag values remain


# --- 1. Load Data via Open-Meteo API or Local Cache ---
print("\n--- Loading Data ---")

df = pd.DataFrame() # Initialize empty dataframe

# Option: Load from local CSV if previously saved
if os.path.exists(LOCAL_CSV_PATH):
    print(f"Attempting to load data from local CSV: {LOCAL_CSV_PATH}")
    try:
        df = pd.read_csv(LOCAL_CSV_PATH, parse_dates=['timestamp'], index_col='timestamp')
        print(f"Loaded {len(df)} points from local CSV.")
    except Exception as e:
        print(f"Error loading local CSV: {e}. Attempting API call.")
        df = pd.DataFrame() # Reset df if loading failed

# Fetch from API if DataFrame is still empty
if df.empty:
    print("Local cache not found or empty. Fetching from Open-Meteo API...")
    # --- Parameters for Open-Meteo ---
    # Coordinates for Dĩ An / near Ho Chi Minh City (approximate)
    latitude = 10.90
    longitude = 106.77
    # Date range - ADJUST AS NEEDED! Ensure enough data for lags + training + testing
    start_date = "2023-01-01"
    # Use current date for end_date for freshest possible data
    end_date = datetime.date.today().strftime("%Y-%m-%d")
    print(f"Requesting data up to: {end_date}")
    hourly_params = "temperature_2m,relative_humidity_2m"
    timezone = "Asia/Ho_Chi_Minh"
    api_url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": hourly_params,
        "timezone": timezone
    }

    try:
        print(f"Requesting data for {latitude}, {longitude} from {start_date} to {end_date}...")
        response = requests.get(api_url, params=params)
        response.raise_for_status() # Raise exception for bad status codes

        data = response.json()
        print("API request successful. Processing data...")

        if 'hourly' not in data or not data['hourly'].get('time'):
            print("Error: API response does not contain hourly data or time array.")
            exit()

        hourly_data = data['hourly']
        df_data = {'timestamp': hourly_data['time']}
        if 'temperature_2m' in hourly_data:
             df_data['temperature'] = hourly_data['temperature_2m']
        else:
             print("Warning: temperature_2m not found in API response.")
             # Handle missing essential data - exit or fill later?
             exit("Temperature data missing from API.")


        if 'relative_humidity_2m' in hourly_data:
            df_data['humidity'] = hourly_data['relative_humidity_2m']
        else:
             print("Warning: relative_humidity_2m not found in API response.")
             exit("Humidity data missing from API.")


        df = pd.DataFrame(df_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.dropna(subset=['timestamp', 'temperature', 'humidity']) # Drop rows missing essentials
        df = df.set_index('timestamp').sort_index()

        # Interpolate intermediate missing values (e.g., if API had gaps)
        df = df.interpolate(method='time')

        print(f"Loaded and preprocessed {len(df)} data points from Open-Meteo API.")

        # Save fetched data locally
        try:
            df.to_csv(LOCAL_CSV_PATH)
            print(f"Data saved locally to {LOCAL_CSV_PATH}")
        except Exception as e:
            print(f"Could not save data locally: {e}")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Open-Meteo API: {e}")
        exit()
    except Exception as e:
        print(f"Error processing data from Open-Meteo: {e}")
        # print("Raw API response:", data) # Uncomment for debugging API response
        exit()

# Final check after loading/fetching
if df.empty or df[['temperature', 'humidity']].isnull().values.any():
    print("No valid data loaded or contains NaNs after preprocessing. Exiting.")
    exit()

# --- 2. Feature Engineering ---
print("\n--- Engineering Features ---")

# --- Add Time-Based Features (Original + Cyclical) ---
df['hour'] = df.index.hour
df['dayofweek'] = df.index.dayofweek
df['dayofyear'] = df.index.dayofyear
df['month'] = df.index.month

# Cyclical Features
df['hour_sin'] = np.sin(2 * np.pi * df['hour']/24.0)
df['hour_cos'] = np.cos(2 * np.pi * df['hour']/24.0)
df['dayofweek_sin'] = np.sin(2 * np.pi * df['dayofweek']/7.0)
df['dayofweek_cos'] = np.cos(2 * np.pi * df['dayofweek']/7.0)
df['month_sin'] = np.sin(2 * np.pi * df['month']/12.0)
df['month_cos'] = np.cos(2 * np.pi * df['month']/12.0)
# df['dayofyear_sin'] = np.sin(2 * np.pi * df['dayofyear']/366.0) # Optional: Day of year might be less predictive locally
# df['dayofyear_cos'] = np.cos(2 * np.pi * df['dayofyear']/366.0) # Optional

print("Added time-based features (original and cyclical).")

# --- Add Lag Features ---
if MINUTES_PER_SAMPLE <= 0:
    print("Error: MINUTES_PER_SAMPLE must be positive.")
    exit()
# How many steps ahead are we predicting? (e.g., 60 min horizon / 60 min sample = 1 step)
lag_steps_start = PREDICTION_HORIZON_MINUTES // MINUTES_PER_SAMPLE
if lag_steps_start <= 0:
     print(f"Warning: prediction_horizon ({PREDICTION_HORIZON_MINUTES}) is less than sample interval ({MINUTES_PER_SAMPLE}). Setting prediction step to 1.")
     lag_steps_start = 1

# How many historical steps to use as features?
lag_steps_end = lag_steps_start + LAG_STEPS_COUNT

print(f"Creating {LAG_STEPS_COUNT} lag features starting from step {lag_steps_start} (each step is {MINUTES_PER_SAMPLE} mins)...")
for i in range(lag_steps_start, lag_steps_end):
     df[f'temp_lag_{i}'] = df['temperature'].shift(i)
     df[f'humid_lag_{i}'] = df['humidity'].shift(i)

# --- Add Target Variables ---
# Shift actual values *back* by the prediction horizon steps
df['temp_target'] = df['temperature'].shift(-lag_steps_start)
df['humid_target'] = df['humidity'].shift(-lag_steps_start)

# --- Clean up NaNs ---
initial_rows = len(df)
# Drop rows where target is NaN (end of series) or where lags are NaN (start of series)
df = df.dropna()
final_rows = len(df)
print(f"Dropped {initial_rows - final_rows} rows containing NaNs after feature engineering.")

print("Engineered features columns:")
print(df.columns)

if df.empty:
    print("No data remaining after feature engineering (check lag/horizon/data range). Exiting.")
    exit()

# --- 3. Prepare Data for XGBoost ---
print("\n--- Preparing Data for Model ---")

# --- Define Features to Use ---
# Decide whether to keep original time features or just cyclical ones
FEATURES = ['hour', 'dayofweek', 'dayofyear', 'month'] # Keep originals for now
FEATURES.extend([col for col in df.columns if col.endswith(('_sin', '_cos'))]) # Add cyclical
FEATURES.extend([col for col in df.columns if col.startswith(('temp_lag_', 'humid_lag_'))]) # Add lags

# Safety check - ensure all selected features actually exist in the DataFrame
FEATURES = [f for f in FEATURES if f in df.columns]

TARGET_TEMP = 'temp_target'
TARGET_HUMID = 'humid_target'

if TARGET_TEMP not in df.columns or TARGET_HUMID not in df.columns:
    print("Error: Target columns ('temp_target', 'humid_target') not found after processing.")
    exit()
if not FEATURES:
    print("Error: No features selected for training.")
    exit()

print(f"\nUsing Features for Training: {FEATURES}")

# --- Save Feature List ---
# Ensure directory exists before saving features
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
features_save_path = os.path.join(MODEL_SAVE_DIR, "predictor_features.json")
try:
    with open(features_save_path, 'w') as f:
        json.dump(FEATURES, f, indent=4) # Added indent for readability
    print(f"Feature list saved to {features_save_path}")
except Exception as e:
    print(f"Error saving feature list: {e}")

X = df[FEATURES]
y_temp = df[TARGET_TEMP]
y_humid = df[TARGET_HUMID]

# --- Chronological Train/Test Split ---
test_size_fraction = 0.2 # Use last 20% of the *time period* for testing
split_index = int(len(df) * (1 - test_size_fraction))

# Ensure the index is sorted (should be from earlier steps)
df_sorted = df # Assuming df is already sorted by index

# Check if split is feasible (need enough data for lags in train AND some data in test)
min_train_size = lag_steps_end # Need at least this many points to calculate latest lags
if split_index < min_train_size or split_index >= len(df_sorted) - 1 : # Ensure train/test have enough data
     print(f"Warning: Cannot perform chronological train/test split effectively.")
     print(f"  Training requires at least {min_train_size} points for lags.")
     print(f"  Calculated split index: {split_index} (out of {len(df_sorted)} total points).")
     print("Training on all available data (no separate test set). Evaluation will be skipped.")
     X_train, X_test = X, pd.DataFrame() # Empty test set
     y_temp_train, y_temp_test = y_temp, pd.Series(dtype=float)
     y_humid_train, y_humid_test = y_humid, pd.Series(dtype=float)
     can_evaluate = False
else:
     train_df = df_sorted.iloc[:split_index]
     test_df = df_sorted.iloc[split_index:]

     X_train, X_test = train_df[FEATURES], test_df[FEATURES]
     y_temp_train, y_temp_test = train_df[TARGET_TEMP], test_df[TARGET_TEMP]
     y_humid_train, y_humid_test = train_df[TARGET_HUMID], test_df[TARGET_HUMID]

     print(f"Chronological Split ({1-test_size_fraction:.0%}/{test_size_fraction:.0%}):")
     print(f"  Training data from {X_train.index.min()} to {X_train.index.max()} ({len(X_train)} points)")
     print(f"  Test data from     {X_test.index.min()} to {X_test.index.max()} ({len(X_test)} points)")
     can_evaluate = True # We have a test set

# --- 4. Train XGBoost Models ---
print("\n--- Training Models ---")

# Define XGBoost parameters (Consider tuning these - see previous suggestion)
xgb_params = {
    'objective': 'reg:squarederror',
    'n_estimators': 1000,           # Early stopping will optimize this
    'learning_rate': 0.05,
    'max_depth': 5,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42,
    'n_jobs': -1 ,                   # Use all available CPU cores
    'early_stopping_rounds': 50    # Define early stopping here
}

# --- Add this line to check the scikit-learn version ---
try:
    import sklearn
    print(f"\nUsing scikit-learn version: {sklearn.__version__}\n")
except ImportError:
    print("\nCould not import scikit-learn to check version.\n")
# --- End of added version check ---


print("\nTraining Temperature Predictor...")
xgb_temp = xgb.XGBRegressor(**xgb_params)

eval_set_temp = None
if can_evaluate:
    eval_set_temp = [(X_train, y_temp_train), (X_test, y_temp_test)] # Use test set for evaluation

xgb_temp.fit(
    X_train,
    y_temp_train,
    eval_set=eval_set_temp,
    verbose=100 # Print progress every 100 rounds (or True for more verbose)
)

print("\nTraining Humidity Predictor...")
xgb_humid = xgb.XGBRegressor(**xgb_params)

eval_set_humid = None
if can_evaluate:
    eval_set_humid = [(X_train, y_humid_train), (X_test, y_humid_test)]

xgb_humid.fit(
    X_train,
    y_humid_train,
    eval_set=eval_set_humid,
    verbose=100 # Print progress every 100 rounds
)

# --- 5. Evaluate Models ---
print("\n--- Evaluating Models ---")
if can_evaluate:
    print("Evaluating on Test Set...")
    temp_pred = xgb_temp.predict(X_test)
    humid_pred = xgb_humid.predict(X_test)

    # --- Corrected RMSE Calculation ---
    temp_mse = mean_squared_error(y_temp_test, temp_pred) # Calculate MSE
    humid_mse = mean_squared_error(y_humid_test, humid_pred) # Calculate MSE

    temp_rmse = np.sqrt(temp_mse) # Calculate RMSE from MSE
    humid_rmse = np.sqrt(humid_mse) # Calculate RMSE from MSE

    print(f"Temperature Prediction RMSE on Test Set: {temp_rmse:.4f}")
    print(f"Humidity Prediction RMSE on Test Set: {humid_rmse:.4f}")
    # --- End of Correction ---


    # --- Optional: Plot predictions vs actuals ---
    # try:
    #     import matplotlib.pyplot as plt
    #     plt.figure(figsize=(15, 6))
    #     plt.plot(y_temp_test.index, y_temp_test, label='Actual Temp')
    #     plt.plot(y_temp_test.index, temp_pred, label='Predicted Temp', alpha=0.7)
    #     plt.title('Temperature Prediction vs Actual (Test Set)')
    #     plt.legend()
    #     plt.show()
    #
    #     plt.figure(figsize=(15, 6))
    #     plt.plot(y_humid_test.index, y_humid_test, label='Actual Humidity')
    #     plt.plot(y_humid_test.index, humid_pred, label='Predicted Humidity', alpha=0.7)
    #     plt.title('Humidity Prediction vs Actual (Test Set)')
    #     plt.legend()
    #     plt.show()
    # except ImportError:
    #     print("\nInstall matplotlib to see prediction plots: pip install matplotlib")

else:
    print("Skipping evaluation as no test set was created.")


# --- 6. Save Models ---
print("\n--- Saving Models ---")
try:
    # Ensure the directory exists one last time
    os.makedirs(os.path.dirname(MODEL_TEMP_PATH), exist_ok=True)
    xgb_temp.save_model(MODEL_TEMP_PATH)
    print(f"Temperature model saved to {MODEL_TEMP_PATH}")

    os.makedirs(os.path.dirname(MODEL_HUMID_PATH), exist_ok=True)
    xgb_humid.save_model(MODEL_HUMID_PATH)
    print(f"Humidity model saved to {MODEL_HUMID_PATH}")

    print("\nTraining complete.")
except Exception as e:
    print(f"Error saving models: {e}")