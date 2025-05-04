# File: src/weather_prediction/plot_realtime.py
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import os # Import os module for path handling

# Construct the log file path relative to the script's directory
# This ensures it works correctly regardless of where you run the script from
script_dir = os.path.dirname(__file__)
log_file = os.path.join(script_dir, '../../logs/prediction.csv')


fig, ax = plt.subplots()

x_data, y_data = [], []

def animate(i):
    try:
        data = pd.read_csv(log_file)
        if data.empty:
            print("Log file is empty, waiting for data...")
            return

        x_data.clear()
        y_data.clear()
        x_data.extend(pd.to_datetime(data['timestamp'], format='ISO8601'))
        y_data.extend(data['predicted_temp'])

        ax.clear()
        ax.plot(x_data, y_data, label='Predicted Temp')
        ax.set_xlabel('Time')
        ax.set_ylabel('Temperature')
        ax.set_title('Real-time Temperature Prediction')
        ax.legend()
        plt.xticks(rotation=45, ha='right')
        plt.gcf().autofmt_xdate()

    except FileNotFoundError:
        print(f"Log file not found at {log_file}, waiting for it to be created...")
    except pd.errors.EmptyDataError:
         print("Log file is empty, waiting for data...")
    except Exception as e:
        print("Animation error:", e)

ani = animation.FuncAnimation(fig, animate, interval=2000)
plt.tight_layout()
plt.show()