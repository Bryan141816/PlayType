from django.shortcuts import render, redirect
from django.template.defaulttags import register
from .models import Word
from django.contrib.auth import logout
from social_django.models import UserSocialAuth


def login_view(request):
    return render(request, 'html\login.html')
def logout_view(request):
    logout(request)
    return redirect('index')

def index(request):
    random_words = Word.objects.order_by('?').values_list('word', flat=True)[:100]
    user = request.user

    if user.is_authenticated:
        try:
            # Get all social auth providers the user has used
            social_auths = user.social_auth.all()
            if social_auths.exists():
                # Initialize variables
                full_name = user.username  # Default to username
                profile_image = None
                login_origin = 'Local Authentication'  # Default to local auth
                
                # Loop through social auth providers to check which one the user logged in with
                for social_auth in social_auths:
                    provider = social_auth.provider
                    
                    if provider == 'google-oauth2':
                        full_name = social_auth.extra_data.get('name')
                        profile_image = social_auth.extra_data.get('picture')  # Google profile picture
                        login_origin = 'Google'
                    
                    elif provider == 'github':
                        full_name = social_auth.extra_data.get('name') or social_auth.extra_data.get('login')
                        profile_image = social_auth.extra_data.get('picture')  # GitHub profile picture
                        login_origin = 'GitHub'
                    
                    # Handle other providers similarly if needed

                context = {
                    'random_word': random_words,
                    'user': user,
                    'name': full_name,
                    'login_origin': login_origin,
                    'profile_image': profile_image
                }
            else:
                # No social auth records found, fallback to username
                context = {
                    'random_word': random_words,
                    'user': user,
                    'name': user.username,
                    'login_origin': 'Local Authentication',
                    'profile_image': None
                }
        except UserSocialAuth.DoesNotExist:
            context = {
                'random_word': random_words,
                'user': user,
                'name': user.username,
                'login_origin': 'Local Authentication',
                'profile_image': None
            }
    else:
        # User is not authenticated
        context = {
            'random_word': random_words
        }

    return render(request, 'html/index.html', context)

def get_words(request):
    if request.method == 'GET':
        random_words = Word.objects.order_by('?').values_list('word', flat=True)[:100]

        context = {
            'random_word': random_words
        }

        return render(request, 'html\words_container.html', context )

def show_profile(request):
    user = request.user

    if user.is_authenticated:
        try:
            # Get all social auth providers the user has used
            social_auths = user.social_auth.all()
            if social_auths.exists():
                # Initialize variables
                full_name = user.username  # Default to username
                profile_image = None
                login_origin = 'Local Authentication'  # Default to local auth
                
                # Loop through social auth providers to check which one the user logged in with
                for social_auth in social_auths:
                    provider = social_auth.provider
                    
                    if provider == 'google-oauth2':
                        full_name = social_auth.extra_data.get('name')
                        profile_image = social_auth.extra_data.get('picture')  # Google profile picture
                        login_origin = 'Google'
                    
                    elif provider == 'github':
                        full_name = social_auth.extra_data.get('name') or social_auth.extra_data.get('login')
                        profile_image = social_auth.extra_data.get('picture')  # GitHub profile picture
                        login_origin = 'GitHub'
                    
                    # Handle other providers similarly if needed

                context = {
                    'user': user,
                    'name': full_name,
                    'login_origin': login_origin,
                    'profile_image': profile_image
                }
        except UserSocialAuth.DoesNotExist:
            context = {
                'user': user,
                'name': user.username,
                'login_origin': 'Local Authentication',
                'profile_image': None
            }
    return render(request, 'html/profile.html',context)

def ask_username(request, backend=None):
    """
    View to prompt the user for a username.
    """
    if request.method == 'POST':
        # The user has submitted the form
        username = request.POST.get('username')
        if username:
            return redirect('social:complete', backend=backend)  # Correct social auth redirection

    # Render the form if GET request or no username provided
    return render(request, 'html\\ask-username.html')


def ThreeDOBject(request):
    return render(request, 'html\\test3d.html')
def data_privary(request):
    return render(request, 'html\\data-privacy.html')
def deletion(request):
    return render(request, 'html\\user-deletetion.html')
@register.filter
def letter_token(word):
    word = word.lower()
    return list(word)