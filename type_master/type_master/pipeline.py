from django.shortcuts import redirect, render
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.contrib.auth.models import User
from social_core.exceptions import AuthException

def check_if_user_is_registered(backend, uid, user=None, request=None, *args, **kwargs):
    """
    Custom pipeline function to check if the user is registered.
    If the user does not exist, ask for a username.
    """
    if user is None:
        # User does not exist, redirect to the username prompt page
        return redirect('ask_username', backend=backend.name)  # Define a URL named 'ask_username'

    # User exists, continue with the pipeline
    return None

def save_username(strategy, details, backend, uid, user=None, request=None, *args, **kwargs):
    """
    Save the username entered by the user if the user doesn't exist.
    """
    if user is None:
        # Get the username from the request
        username = request.POST.get('username')

        if username:
            # Create a new user with the provided username
            user = User.objects.create_user(username=username, email=details.get('email'))
            return {'user': user}

    return None
