import sys
import os

print(f"DEBUG: sys.path: {sys.path}")

try:
    print("DEBUG: Attempting to import app.core.auth")
    from app.core import auth
    print(f"DEBUG: app.core.auth imported from {auth.__file__}")
    print(f"DEBUG: dir(auth): {dir(auth)}")
    
    print("DEBUG: Attempting from app.core.auth import create_user_token")
    from app.core.auth import create_user_token
    print("DEBUG: Successfully imported create_user_token")
except Exception as e:
    print(f"DEBUG: Failed: {e}")
    import traceback
    traceback.print_exc()
