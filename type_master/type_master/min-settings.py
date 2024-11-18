#from type_master.settings import *  # Import base settings

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
