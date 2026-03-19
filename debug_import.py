import sys
import os

print(f"PYTHONPATH: {os.environ.get('PYTHONPATH')}")
print(f"sys.path: {sys.path}")

try:
    from app.core import auth
    print("Sucessfully imported app.core.auth")
    print(f"auth file: {auth.__file__}")
    print(f"Available names in auth: {dir(auth)}")
    if hasattr(auth, 'create_user_token'):
        print("create_user_token IS present in auth")
    else:
        print("create_user_token IS MISSING from auth")
except Exception as e:
    print(f"Failed to import app.core.auth: {e}")
    import traceback
    traceback.print_exc()
