# ai_module/prediction.py
import pandas as pd
import logging
import datetime
from typing import List, Optional

logger = logging.getLogger(__name__)

def prepare_features(
    history_df: pd.DataFrame,
    expected_features: List[str],
    prediction_horizon_minutes: int = 60,
    minutes_per_sample: int = 5,
    lag_steps_count: int = 5
    ) -> Optional[pd.DataFrame]:
    """
    Prepares the feature vector for prediction using historical data.

    Args:
        history_df: DataFrame containing historical telemetry data (e.g., temp, humid).
                    Must have a DatetimeIndex. Needs enough data for lags.
        expected_features: List of feature names the XGBoost model was trained on.
        prediction_horizon_minutes: How far ahead the model predicts (e.g., 60 mins).
        minutes_per_sample: The time resolution of the history_df (e.g., 5 mins).
        lag_steps_count: How many lag features were used in training (e.g., 5).

    Returns:
        A pandas DataFrame with a single row containing the features for prediction,
        or None if features cannot be prepared.
    """
    if history_df.empty:
        logger.warning("Cannot prepare features: Input history DataFrame is empty.")
        return None

    if not isinstance(history_df.index, pd.DatetimeIndex):
         logger.error("Cannot prepare features: history_df must have a DatetimeIndex.")
         return None

    # Calculate lag parameters based on config
    lag_steps_start = prediction_horizon_minutes // minutes_per_sample
    lag_steps_needed = lag_steps_start + lag_steps_count # Max shift value needed from history

    if len(history_df) < lag_steps_needed:
        logger.warning(f"Not enough history ({len(history_df)}) for prediction features (need {lag_steps_needed}).")
        return None

    # Use the timestamp of the *latest* data point in history for time features
    # This assumes we predict based on the most recent known state.
    current_timestamp = history_df.index[-1]
    logger.debug(f"Preparing features based on latest timestamp: {current_timestamp}")

    try:
        features = {}
        # --- Time Features ---
        features['hour'] = current_timestamp.hour
        features['dayofweek'] = current_timestamp.dayofweek
        features['dayofyear'] = current_timestamp.dayofyear
        features['month'] = current_timestamp.month

        # --- Lag Features ---
        # Create shifted columns directly on the history DataFrame for efficiency
        df_with_lags = history_df.copy()
        feature_columns_created = ['hour', 'dayofweek', 'dayofyear', 'month']

        for i in range(lag_steps_start, lag_steps_needed):
            temp_lag_col = f'temp_lag_{i}'
            humid_lag_col = f'humid_lag_{i}'
            # Add other potential lags if used during training (e.g., light_state_lag_i)

            if 'temperature' in df_with_lags.columns:
                 df_with_lags[temp_lag_col] = df_with_lags['temperature'].shift(i)
                 feature_columns_created.append(temp_lag_col)
            if 'humidity' in df_with_lags.columns:
                 df_with_lags[humid_lag_col] = df_with_lags['humidity'].shift(i)
                 feature_columns_created.append(humid_lag_col)
            # Add shifts for other features if necessary

        # Extract the feature values from the *last row* (corresponding to current_timestamp)
        last_row_with_lags = df_with_lags.iloc[-1]

        # Populate the features dictionary only with columns actually created
        for col in feature_columns_created:
            if col in last_row_with_lags:
                features[col] = last_row_with_lags[col]

        # Create a DataFrame with a single row using the *exact* feature order expected by the model
        if not expected_features:
            logger.error("Predictor feature names not available. Cannot create feature DataFrame.")
            return None

        # Ensure all expected features are present, set missing to None (or handle differently)
        feature_row_dict = {}
        missing_features = []
        for feat in expected_features:
            if feat in features:
                feature_row_dict[feat] = features[feat]
            else:
                # Log if a feature expected by the model wasn't generated
                logger.warning(f"Expected feature '{feat}' was not generated from history.")
                missing_features.append(feat)
                feature_row_dict[feat] = None # Or np.nan

        # Create the final DataFrame
        feature_df = pd.DataFrame([feature_row_dict], columns=expected_features)

        # Final check for missing values after constructing the row
        if feature_df.isnull().values.any():
            null_cols = feature_df.columns[feature_df.isnull().any()].tolist()
            logger.warning(f"Missing values detected in final feature vector for columns: {null_cols}. Prediction might fail or be inaccurate.")
            # Depending on model tolerance, you might return None or allow prediction
            # return None # Stricter approach

        logger.debug(f"Prepared feature row: {feature_df.to_dict('records')[0]}")
        return feature_df

    except Exception as e:
         logger.exception(f"Error preparing features for prediction: {e}")
         return None