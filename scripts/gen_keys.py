import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

def generate_keys():
    core_dir = os.path.join(os.path.dirname(__file__), "..", "app", "core")
    os.makedirs(core_dir, exist_ok=True)
    
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    with open(os.path.join(core_dir, "private_key.pem"), "wb") as f:
        f.write(private_pem)

    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    with open(os.path.join(core_dir, "public_key.pem"), "wb") as f:
        f.write(public_pem)
        
    print("RS256 Keys Generated Successfully in app/core!")

if __name__ == "__main__":
    generate_keys()
