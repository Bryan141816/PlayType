#from type_master.settings import *  # Import base settings
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Disable database connections
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.dummy',  # Use a dummy database engine
    }
}

# Optional: Disable middleware, authentication backends, etc.
MIDDLEWARE = []

# Keep only the necessary static file settings
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR/'/static/'
