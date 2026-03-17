import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

def generate_keys(private_path, public_path):
    if os.path.exists(private_path) and os.path.exists(public_path):
        print("RSA keys already exist. Skipping generation.")
        return

    print(f"Generating RSA keys: {private_path}, {public_path}")
    os.makedirs(os.path.dirname(private_path), exist_ok=True)
    
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Save private key
    with open(private_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
        
    # Save public key
    public_key = private_key.public_key()
    with open(public_path, "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))

if __name__ == "__main__":
    from app.config import settings
    generate_keys(settings.JWT_PRIVATE_KEY_PATH, settings.JWT_PUBLIC_KEY_PATH)
