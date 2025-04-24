# ai_module/train_predictors.py
# NOTE: You might need to adjust paths in this script depending on
#       how you run it and where your data/config resides relative to it.

import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
# import joblib # Or use model.save_model for native XGBoost format
import pymongo # Or import csv if using CSV file
import json
import os
import datetime # Added import

# --- Configuration ---
# Adjust path to load the *new* AI config, or define paths directly
# Option 1: Load from new config (assumes script run from project root)
CONFIG_PATH = "ai_module/config/ai_config.json"
# Option 2: Define paths directly here if running standalone
# MONGO_URI = "mongodb+srv://..."
# MONGO_DB = "iot-device"
# MONGO_COLLECTION = "telemetry_data"
# MODEL_SAVE_DIR = "ai_module/models/predictors" # Save directly to new structure

MONGO_ENABLED = False # Default if config loading fails
try:
    # Determine script's directory to reliably find config
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path_abs = os.path.join(script_dir, CONFIG_PATH) # If CONFIG_PATH is relative

    # Use config_path_abs if defined, otherwise fallback to CONFIG_PATH
    effective_config_path = config_path_abs if 'config_path_abs' in locals() else CONFIG_PATH

    if not os.path.exists(effective_config_path):
        print(f"Warning: Config file not found at {effective_config_path}. Using defaults.")
        # Define default paths if config isn't found
        MODEL_SAVE_DIR = os.path.join(script_dir, "models/predictors")
        MONGO_URI = None
        PREDICTION_HORIZON_MINUTES = 60
        MINUTES_PER_SAMPLE = 5
        LAG_STEPS_COUNT = 5

    else:
        print(f"Loading configuration from: {effective_config_path}")
        with open(effective_config_path, 'r') as f:
            settings = json.load(f)

        # Get MongoDB settings if available and enabled in config
        mongo_cfg = settings.get("mongodb") # Check if mongodb section exists
        if mongo_cfg and mongo_cfg.get("enabled", False):
            MONGO_URI = mongo_cfg.get("uri")
            MONGO_DB = mongo_cfg.get("database")
            MONGO_COLLECTION = mongo_cfg.get("collection")
            MONGO_ENABLED = True
            print("MongoDB configuration loaded.")
        else:
             MONGO_URI = None
             print("MongoDB not enabled or configured in settings.")

        # Get predictor settings
        pred_cfg = settings.get("prediction", {})
        MODEL_SAVE_DIR = pred_cfg.get("temp_model_path") # Use one path to determine dir
        if MODEL_SAVE_DIR:
            MODEL_SAVE_DIR = os.path.dirname(MODEL_SAVE_DIR) # Get directory part
            # Resolve relative to script dir if needed
            if not os.path.isabs(MODEL_SAVE_DIR):
                 MODEL_SAVE_DIR = os.path.join(script_dir, MODEL_SAVE_DIR)
        else: # Fallback if path not in config
            MODEL_SAVE_DIR = os.path.join(script_dir, "models/predictors")

        PREDICTION_HORIZON_MINUTES = pred_cfg.get("prediction_horizon_minutes", 60)
        MINUTES_PER_SAMPLE = pred_cfg.get("minutes_per_sample", 5)
        LAG_STEPS_COUNT = pred_cfg.get("lag_steps_count", 5)


    # Ensure model save directory exists
    print(f"Model save directory: {MODEL_SAVE_DIR}")
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    MODEL_TEMP_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_temp_predictor.json")
    MODEL_HUMID_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_humid_predictor.json")

except Exception as e:
    print(f"Error loading configuration: {e}")
    # Set safe defaults if config loading fails
    script_dir = os.path.dirname(os.path.abspath(__file__))
    MONGO_URI = None
    MODEL_SAVE_DIR = os.path.join(script_dir, "models/predictors")
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    MODEL_TEMP_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_temp_predictor.json")
    MODEL_HUMID_PATH = os.path.join(MODEL_SAVE_DIR, "xgboost_humid_predictor.json")
    PREDICTION_HORIZON_MINUTES = 60
    MINUTES_PER_SAMPLE = 5
    LAG_STEPS_COUNT = 5


# --- 1. Load Data ---
print("Loading data...")
df = pd.DataFrame() # Initialize empty dataframe

# Example: Load from MongoDB
if MONGO_ENABLED and MONGO_URI:
    try:
        print(f"Connecting to MongoDB: {MONGO_DB}/{MONGO_COLLECTION}")
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ismaster') # Verify connection
        db = client[MONGO_DB]
        collection = db[MONGO_COLLECTION]
        # Query data - adjust query as needed (e.g., filter by time range, ensure timestamp exists)
        # Project only necessary fields
        query = {} # Fetch all for now
        projection = {"_id": 0, "temperature": 1, "humidity": 1, "timestamp": 1} # Add light/fan if logged and needed
        data = list(collection.find(query, projection))
        client.close()

        if not data:
             print("No data found in MongoDB collection.")
             exit()

        df = pd.DataFrame(data)
        # Data Cleaning & Preparation
        if 'timestamp' not in df.columns:
             print("Error: 'timestamp' column missing in MongoDB data.")
             exit()
        df = df.dropna(subset=['timestamp', 'temperature', 'humidity']) # Drop rows missing essential data
        # Convert timestamp (assuming Unix epoch seconds) to datetime and set as index
        # Use errors='coerce' to handle potential bad timestamp values
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s', errors='coerce')
        df = df.dropna(subset=['timestamp']) # Drop rows where timestamp conversion failed
        df = df.set_index('timestamp').sort_index()

        # Resample data to a consistent frequency (handle duplicates and gaps)
        # Use mean aggregation, drop duplicates before resampling if necessary
        df = df[~df.index.duplicated(keep='first')] # Keep first if duplicate timestamps exist
        df = df.resample(f'{MINUTES_PER_SAMPLE}T').mean() # Resample
        df = df.interpolate(method='time') # Interpolate missing values based on time

        print(f"Loaded and preprocessed {len(df)} data points from MongoDB.")

    except pymongo.errors.ServerSelectionTimeoutError:
         print(f"Error: Could not connect to MongoDB at {MONGO_URI}. Check connection string/network.")
         exit()
    except Exception as e:
        print(f"Error loading or processing data from MongoDB: {e}")
        exit()
else:
    # Example: Load from CSV (Uncomment and adapt if using CSV)
    # CSV_PATH = "path/to/your/data.csv"
    # print(f"Loading data from CSV: {CSV_PATH}")
    # try:
    #     df = pd.read_csv(CSV_PATH, parse_dates=['timestamp_column']) # Specify your timestamp column
    #     df = df.set_index('timestamp_column').sort_index()
    #     # Apply same preprocessing (resample, interpolate) as MongoDB path
    #     df = df[~df.index.duplicated(keep='first')]
    #     df = df.resample(f'{MINUTES_PER_SAMPLE}T').mean().interpolate(method='time')
    #     print(f"Loaded and preprocessed {len(df)} data points from CSV.")
    # except FileNotFoundError:
    #     print(f"Error: CSV file not found at {CSV_PATH}")
    #     exit()
    # except Exception as e:
    #     print(f"Error loading data from CSV: {e}")
    #     exit()
    print("MongoDB not configured or enabled, and CSV loading is not implemented/enabled.")
    # Create dummy data for testing if no source is available? Or exit.
    print("Exiting.")
    exit()

if df.empty or df[['temperature', 'humidity']].isnull().all().all():
    print("No valid data loaded after preprocessing. Exiting.")
    exit()

# --- 2. Feature Engineering ---
print("Engineering features...")

# Time-based features
df['hour'] = df.index.hour
df['dayofweek'] = df.index.dayofweek
df['dayofyear'] = df.index.dayofyear
df['month'] = df.index.month

# Lag features (using past values to predict future)
# Calculate number of lag steps based on resampling frequency and horizon
lag_steps_start = PREDICTION_HORIZON_MINUTES // MINUTES_PER_SAMPLE # Predict N steps ahead
lag_steps_end = lag_steps_start + LAG_STEPS_COUNT # Use specified number of lags

# Create lag features for temp and humidity
print(f"Creating {LAG_STEPS_COUNT} lag features starting from step {lag_steps_start}...")
for i in range(lag_steps_start, lag_steps_end):
     df[f'temp_lag_{i}'] = df['temperature'].shift(i)
     df[f'humid_lag_{i}'] = df['humidity'].shift(i)
     # Add lags for light/fan state if you have them and think they are predictive
     # if 'light_state' in df.columns: df[f'light_state_lag_{i}'] = df['light_state'].shift(i)

# Target variables (future values - shifted backward)
df['temp_target'] = df['temperature'].shift(-lag_steps_start)
df['humid_target'] = df['humidity'].shift(-lag_steps_start)

# Drop rows with NaN values created by shifts (especially target NaNs)
initial_rows = len(df)
df = df.dropna()
final_rows = len(df)
print(f"Dropped {initial_rows - final_rows} rows containing NaNs after feature engineering.")


print("Features created:")
# print(df.head())
print(df.columns)

if df.empty:
    print("No data remaining after feature engineering (check lag/horizon/data range). Exiting.")
    exit()

# --- 3. Prepare Data for XGBoost ---
# Dynamically create FEATURES list based on columns present
FEATURES = [col for col in df.columns if col.startswith(('hour', 'dayofweek', 'dayofyear', 'month'))]
FEATURES.extend([col for col in df.columns if col.startswith(('temp_lag_', 'humid_lag_'))])
# Add other engineered features if created (e.g., 'light_state_lag_')
# FEATURES.extend([col for col in df.columns if col.startswith(('light_state_lag_'))])

# Ensure only existing columns are used
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

X = df[FEATURES]
y_temp = df[TARGET_TEMP]
y_humid = df[TARGET_HUMID]

# Split data (chronological split for time series is often better)
test_size = 0.2 # Use last 20% for testing
split_index = int(len(X) * (1 - test_size))

if split_index == 0 or split_index == len(X):
     print("Warning: Cannot perform train/test split. Dataset might be too small.")
     # Decide how to handle: train on all data? or exit?
     print("Training on all available data.")
     X_train, X_test = X, X
     y_temp_train, y_temp_test = y_temp, y_temp
     y_humid_train, y_humid_test = y_humid, y_humid
else:
     X_train, X_test = X[:split_index], X[split_index:]
     y_temp_train, y_temp_test = y_temp[:split_index], y_temp[split_index:]
     y_humid_train, y_humid_test = y_humid[:split_index], y_humid[split_index:]

print(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")

# --- 4. Train XGBoost Models ---

# Define XGBoost parameters (consider tuning these)
xgb_params = {
    'objective': 'reg:squarederror', # Objective for regression
    'n_estimators': 1000,           # Number of trees (can be tuned with early stopping)
    'learning_rate': 0.05,          # Step size shrinkage
    'max_depth': 5,                 # Max depth of trees
    'subsample': 0.8,               # Fraction of samples used per tree
    'colsample_bytree': 0.8,        # Fraction of features used per tree
    'random_state': 42,
    'n_jobs': -1                    # Use all available CPU cores
}

# Early stopping parameters
early_stopping_params = {
    'early_stopping_rounds': 50,   # Stop if no improvement after 50 rounds
    'eval_metric': 'rmse',         # Root Mean Squared Error
    'verbose': 100                 # Print evaluation metrics every 100 rounds
}


# Temperature Model
print("\nTraining Temperature Predictor...")
xgb_temp = xgb.XGBRegressor(**xgb_params)

eval_set_temp = [(X_train, y_temp_train), (X_test, y_temp_test)]

xgb_temp.fit(X_train, y_temp_train,
             eval_set=eval_set_temp,
             **early_stopping_params)

# Humidity Model
print("\nTraining Humidity Predictor...")
xgb_humid = xgb.XGBRegressor(**xgb_params)

eval_set_humid = [(X_train, y_humid_train), (X_test, y_humid_test)]

xgb_humid.fit(X_train, y_humid_train,
              eval_set=eval_set_humid,
              **early_stopping_params)

# --- 5. Evaluate Models ---
print("\nEvaluating models on Test Set...")
temp_pred = xgb_temp.predict(X_test)
humid_pred = xgb_humid.predict(X_test)

temp_rmse = mean_squared_error(y_temp_test, temp_pred, squared=False)
humid_rmse = mean_squared_error(y_humid_test, humid_pred, squared=False)

print(f"Temperature Prediction RMSE on Test Set: {temp_rmse:.4f}")
print(f"Humidity Prediction RMSE on Test Set: {humid_rmse:.4f}")

# --- 6. Save Models ---
print("\nSaving models...")
try:
    # Use native XGBoost save format (preferred, includes feature names)
    xgb_temp.save_model(MODEL_TEMP_PATH)
    xgb_humid.save_model(MODEL_HUMID_PATH)
    print(f"Temperature model saved to {MODEL_TEMP_PATH}")
    print(f"Humidity model saved to {MODEL_HUMID_PATH}")
    print("\nTraining complete.")
except Exception as e:
    print(f"Error saving models: {e}")