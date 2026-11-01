import os
import sys

# Ensure backend directory is in sys.path and set as working directory
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    os.chdir(backend_dir)
except Exception:
    pass

if __name__ == "__main__":
    import run
