from django.shortcuts import render, redirect
from django.template.defaulttags import register
from .models import Word, UserSettings, TestHistory
from django.contrib.auth import logout
from social_django.models import UserSocialAuth
import random
from django.shortcuts import get_object_or_404
from django.db.models import Max
from django.http import JsonResponse, HttpResponseBadRequest




def login_view(request):
    return render(request, 'html/login.html')
def logout_view(request):
    logout(request)
    return redirect('index')

def getUser(user):
    if user.is_authenticated:
        try:
            social_auths = user.social_auth.all()
            if social_auths.exists():
                # Initialize variables
                full_name = user.username  # Default to username
                profile_image = None
                login_origin = 'Local Authentication'  # Default to local auth
                user_settings = get_object_or_404(UserSettings, user__user=user)
                
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
                    'profile_image': profile_image,
                    'user_settings': user_settings.to_dict()
                }
            else:
                # No social auth records found, fallback to username
                context = {
                    'user': user,
                    'name': user.username,
                    'login_origin': 'Local Authentication',
                    'profile_image': None
                }
        except UserSocialAuth.DoesNotExist:
            context = {
                'user': user,
                'name': user.username,
                'login_origin': 'Local Authentication',
                'profile_image': None
            }
    else:
        context = {}
    return context


def index(request):
    user = request.user
    context = getUser(user)
    return render(request, 'html/index.html', context)


def show_profile(request):
    user = request.user
    context = getUser(user)
    return render(request, 'html/profile.html',context)

@register.filter
def letter_token(word):
    word = word.lower()
    return list(word)

def challenges(request):
    return render(request, 'html/challenges-template.html')

def settings(request):
    return render(request, 'html/settings.html')

def get_words(request):
    if request.method == 'GET':
        amount = int(request.GET.get('amount', 100))
        all_random_words = list(Word.objects.order_by('?').values_list('word', 'length')[:(max(1000, (10 * amount)))])

        short_words = [word for word, length in all_random_words if length <= 5]
        long_words = [word for word, length in all_random_words if length > 5]

        short_count = min(92, amount)  
        long_count = max(0, amount - short_count)  

        selected_words = random.choices(short_words, k=short_count) + random.choices(long_words, k=long_count)

        random.shuffle(selected_words)

        random_words = selected_words[:amount]

        context = {
            'random_word': random_words
        }

        return render(request, 'html/words_container.html', context)
    
def updateUserSettings(request):
    # Check if the request is a POST or PUT request
    if request.method not in ['POST', 'PUT']:
        return HttpResponseBadRequest('Invalid request method. Please use POST or PUT.')

    # Get the authenticated user
    user = request.user

    # Check if the user is authenticated
    if not user.is_authenticated:
        return JsonResponse({'error': 'User is not authenticated.'}, status=401)

    # Retrieve the UserSettings instance associated with the authenticated user
    user_settings = get_object_or_404(UserSettings, user__user=user)

    # Retrieve parameters from the request
    theme = request.POST.get('theme')
    mode_used = request.POST.get('mode_used')
    time_selected = request.POST.get('time_selected')
    word_amount_selected = request.POST.get('word_amount_selected')
    challenge_achieved = request.POST.get('challenge_achieved')
    custome_sentence = request.POST.get('custome_sentence')
    

    # Update fields only if the new value is not None
    if theme is not None:
        user_settings.theme = theme
    if mode_used is not None:
        user_settings.mode_used = mode_used
    if time_selected is not None:
        user_settings.time_selected = time_selected
    if word_amount_selected is not None:
        user_settings.word_amount_selected = word_amount_selected
    if challenge_achieved is not None:
        user_settings.challenge_achieved = challenge_achieved
    if custome_sentence is not None:
        user_settings.custome_sentence = custome_sentence

    # Save the updated user settings
    user_settings.save()

    return JsonResponse({'message': 'User settings updated successfully.'})

def addTestHistory(request):
    if request.method not in ['POST', 'PUT']:
        return HttpResponseBadRequest('Invalid request method. Please use POST or PUT.')
    
    user = request.user
    user = get_object_or_404(UserSocialAuth, user=user)

    data = request.POST
        
    try:
        max_value = TestHistory.objects.aggregate(Max('wpm'))
        bpr = False
        wpm = float(data.get('wpm', 0))
        if(max_value['wpm__max'] is None or wpm > max_value['wpm__max']):
            bpr = True
        test_history = TestHistory.objects.create(
            user=user,
            wpm=wpm,
            accuracy=float(data.get('accuracy', 0)),
            cormisex=data.get('cormisex', ''),
            mode=data.get('mode', ''),
            type=data.get('type', ''),
            bpr=bpr
        )
        return JsonResponse({
            'success': True,
            'message': 'Test history added successfully!',
            'test_history_id': test_history.id
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


def temp(request):
    return render(request, 'html/temp.html')









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
    return render(request, 'html/ask-username.html')



def ThreeDOBject(request):
    return render(request, 'html/test3d.html')
def data_privary(request):
    return render(request, 'html/data-privacy.html')
def deletion(request):
    return render(request, 'html/user-deletetion.html')