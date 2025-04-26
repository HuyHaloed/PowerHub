import argparse
import uvicorn

from main import *

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="")
    parser.add_argument(
        "--host", type=str, default="0.0.0.0", help="Hosting default: 0.0.0.0"
    )
    parser.add_argument("--port", type=int, default=18002)

    args = parser.parse_args()

    uvicorn.run(
        "main:create_app", host=args.host, port=args.port
    )