# ai_module/prediction.py
import pandas as pd
import logging
import datetime
from typing import List, Optional
import numpy as np 

logger = logging.getLogger(__name__)

def prepare_features(
    history_df: pd.DataFrame,
    expected_features: List[str],
    prediction_horizon_minutes: int = 60,
    minutes_per_sample: int = 60, # <-- Default updated to 60 to match config
    lag_steps_count: int = 5
    ) -> Optional[pd.DataFrame]:
    """
    Prepares the feature vector for prediction using historical data.

    Args:
        history_df: DataFrame containing historical telemetry data (e.g., temp, humid).
                    Must have a DatetimeIndex. Needs enough data for lags.
                    Should contain 'temperature' and 'humidity' columns.
        expected_features: List of feature names the XGBoost model was trained on
                           (loaded from predictor_features.json).
        prediction_horizon_minutes: How far ahead the model predicts (e.g., 60 mins).
        minutes_per_sample: The time resolution of the history_df (e.g., 60 mins).
        lag_steps_count: How many lag features were used in training (e.g., 5).

    Returns:
        A pandas DataFrame with a single row containing the features for prediction,
        or None if features cannot be prepared.
    """
    if history_df is None or history_df.empty:
        logger.warning("Cannot prepare features: Input history DataFrame is None or empty.")
        return None

    if not isinstance(history_df.index, pd.DatetimeIndex):
         logger.error("Cannot prepare features: history_df must have a DatetimeIndex.")
         return None

    if 'temperature' not in history_df.columns or 'humidity' not in history_df.columns:
        logger.error("Cannot prepare features: history_df must contain 'temperature' and 'humidity' columns.")
        return None

    # Ensure history is sorted by time
    history_df = history_df.sort_index()

    # Calculate lag parameters based on config
    if minutes_per_sample <= 0:
        logger.error("Cannot prepare features: minutes_per_sample must be positive.")
        return None
    lag_steps_start = prediction_horizon_minutes // minutes_per_sample
    if lag_steps_start <= 0:
        logger.warning(f"Prediction horizon ({prediction_horizon_minutes}) <= sample interval ({minutes_per_sample}). Setting prediction step to 1.")
        lag_steps_start = 1
    lag_steps_needed = lag_steps_start + lag_steps_count # Total history points needed for latest lag calculation

    if len(history_df) < lag_steps_needed:
        logger.warning(f"Not enough history ({len(history_df)}) for prediction features (need {lag_steps_needed} steps including offset).")
        return None

    # Use the timestamp of the *latest* data point in history for time features
    current_timestamp = history_df.index[-1]
    logger.debug(f"Preparing features based on latest timestamp: {current_timestamp}")

    if not expected_features:
        logger.error("Expected features list is empty. Cannot prepare features.")
        return None

    try:
        features = {} # Dictionary to hold the generated features for the single prediction row

        # --- Time Features (Original + Cyclical) ---
        # Calculate these based on the *latest* timestamp
        original_hour = current_timestamp.hour
        original_dayofweek = current_timestamp.dayofweek
        original_dayofyear = current_timestamp.dayofyear
        original_month = current_timestamp.month

        # Only add features if they are in the expected list
        if 'hour' in expected_features: features['hour'] = original_hour
        if 'dayofweek' in expected_features: features['dayofweek'] = original_dayofweek
        if 'dayofyear' in expected_features: features['dayofyear'] = original_dayofyear
        if 'month' in expected_features: features['month'] = original_month

        # --- Cyclical Features ---
        if 'hour_sin' in expected_features: features['hour_sin'] = np.sin(2 * np.pi * original_hour/24.0)
        if 'hour_cos' in expected_features: features['hour_cos'] = np.cos(2 * np.pi * original_hour/24.0)
        if 'dayofweek_sin' in expected_features: features['dayofweek_sin'] = np.sin(2 * np.pi * original_dayofweek/7.0)
        if 'dayofweek_cos' in expected_features: features['dayofweek_cos'] = np.cos(2 * np.pi * original_dayofweek/7.0)
        if 'month_sin' in expected_features: features['month_sin'] = np.sin(2 * np.pi * original_month/12.0)
        if 'month_cos' in expected_features: features['month_cos'] = np.cos(2 * np.pi * original_month/12.0)
        # Uncomment dayofyear if used in training and present in expected_features
        # if 'dayofyear_sin' in expected_features: features['dayofyear_sin'] = np.sin(2 * np.pi * original_dayofyear/366.0)
        # if 'dayofyear_cos' in expected_features: features['dayofyear_cos'] = np.cos(2 * np.pi * original_dayofyear/366.0)

        # --- Lag Features ---
        # Extract necessary historical values directly using .iloc for shifts
        # Example: For lag_1, we need the value at index -1
        #          For lag_N, we need the value at index -N
        for i in range(lag_steps_start, lag_steps_needed):
            temp_lag_col = f'temp_lag_{i}'
            humid_lag_col = f'humid_lag_{i}'

            # Calculate the index position needed from the end of the history_df
            # shift `i` corresponds to iloc position `-(i+1)` because iloc is 0-based from start
            # BUT, we need the value *i* steps *before* the last one.
            # The last value is at index -1. The value i steps before it is at index -(i+1).
            # However, pandas shift(i) takes the value from i rows *above*.
            # So, to get the value corresponding to shift(i) for the last row, we need iloc[-i-1] is wrong.
            # shift(1) uses data from index -2. shift(i) uses data from index -(i+1). No, that's also wrong.
            # Let's recalculate:
            # If last timestamp is T, shift(1) gives value at T-1. This is history_df.iloc[-2].
            # If last timestamp is T, shift(i) gives value at T-i. This is history_df.iloc[-(i+1)]. NO!
            # Example: Index = [0, 1, 2, 3, 4]. last=4. shift(1) for row 4 uses data from row 3 (iloc[-2]). shift(2) uses data from row 2 (iloc[-3]).
            # Correct: To get the value for the last row shifted by `i`, use history_df[COLUMN].iloc[-1-i] -- THIS IS WRONG.
            # Let's use shift on the series and take the last value.

            try:
                # Get the series for the specific column
                temp_series = history_df['temperature']
                humid_series = history_df['humidity']

                # Apply shift and get the last valid value (which corresponds to the lag for the current_timestamp)
                if temp_lag_col in expected_features:
                    features[temp_lag_col] = temp_series.shift(i).iloc[-1]
                if humid_lag_col in expected_features:
                    features[humid_lag_col] = humid_series.shift(i).iloc[-1]

            except IndexError:
                logger.error(f"IndexError while calculating lag {i}. History might be too short unexpectedly.")
                return None


        # --- Consistency Check ---
        # Verify that all expected features have been generated
        generated_feature_keys = set(features.keys())
        expected_feature_set = set(expected_features)

        missing_in_generated = expected_feature_set - generated_feature_keys
        if missing_in_generated:
            logger.error(f"Features expected by model but not generated by prepare_features: {missing_in_generated}")
            # Add missing features with NaN or handle error
            for feat in missing_in_generated:
                features[feat] = np.nan # Or raise error

        extra_in_generated = generated_feature_keys - expected_feature_set
        if extra_in_generated:
            logger.warning(f"Features generated by prepare_features but not in expected_features list: {extra_in_generated}")
            # Remove extra features before creating DataFrame
            for extra_feat in extra_in_generated:
                del features[extra_feat]


        # --- Create Final DataFrame ---
        # Create the final DataFrame ensuring the column order matches expected_features
        feature_df = pd.DataFrame([features], columns=expected_features)

        # Final check for any remaining NaNs (could happen if history had NaNs or lags failed)
        if feature_df.isnull().values.any():
            null_cols = feature_df.columns[feature_df.isnull().any()].tolist()
            logger.warning(f"Missing values (NaN) detected in final feature vector for columns: {null_cols}. Prediction might be inaccurate.")
            # Option: Return None if NaNs are not tolerated by the model
            # return None

        logger.debug(f"Prepared feature row: OK") # Avoid logging potentially large dict
        return feature_df

    except Exception as e:
         # Log the specific feature being processed if possible, or just the general error
         logger.exception(f"Error preparing features for prediction: {e}")
         return None