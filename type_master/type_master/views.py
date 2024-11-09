from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.template.defaulttags import register
from .models import Word, UserSettings, TestHistory
from django.contrib.auth import logout
from social_django.models import UserSocialAuth
import random
from django.shortcuts import get_object_or_404
from django.db.models import Max, Count, Avg, OuterRef, Subquery, F
from django.db.models.functions import TruncDate
from django.http import JsonResponse, HttpResponseBadRequest
from datetime import datetime
from django.utils import timezone
import json



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
                date_joined = user.date_joined.strftime("%b %d %Y")
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
                context = {
                    'user': user,
                    'name': full_name,
                    'login_origin': login_origin,
                    'profile_image': profile_image,
                    'user_settings': user_settings.to_dict(),
                    'date_joined': date_joined
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
    ultra_wide_config = request.POST.get('ultra_wide_config')
    font_size = request.POST.get('font_size')
    font_family = request.POST.get('font_family')


    if challenge_achieved is not None:
       try:
           challenge_achieved = json.loads(challenge_achieved)
       except json.JSONDecodeError:
           return JsonResponse({'error': 'Invalid format for challenge_achieved.'}, status=400)
    

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
    if ultra_wide_config is not None:
        user_settings.ultra_wide_config = ultra_wide_config
    if font_size is not None:
        user_settings.font_size = font_size
    if font_family is not None:
        user_settings.font_family = font_family

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
        max_value = TestHistory.objects.filter(user=user).aggregate(Max('wpm'))
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
        if(bpr):
            confitte_html = render_to_string('html/confitte.html')
            return JsonResponse({
                'success': True,
                'message': 'You got a new personal best.',
                'bpr': bpr,
                'confitte': confitte_html,
                'test_history_id': test_history.id
            })
        else:
            return JsonResponse({
                'success': True,
                'message': 'Test history added successfully!',
                'data': bpr,
                'test_history_id': test_history.id
            })
            
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


def temp(request):
    return render(request, 'html/confitte.html')

def userStat(request):
    user = request.user
    if( not user.is_authenticated):
        return redirect('login')
       
    context = getUser(user)
    user = get_object_or_404(UserSocialAuth, user=user)
    test_count = TestHistory.objects.filter(user=user).count()
    user_settings = UserSettings.objects.filter(user = user).first() 
    if(test_count != 0):
        avg_wpm = TestHistory.objects.filter(user=user).aggregate(Avg('wpm'))
        avg_accuracy = TestHistory.objects.filter(user=user).aggregate(Avg('accuracy'))
        total_day_active = (
            TestHistory.objects
            .filter(user=user)
            .annotate(date=TruncDate('test_taken'))  # Truncate to date level
            .values('date')  # Group by date
            .annotate(count=Count('id'))  # Count entries per date
            .order_by('date')  # Sort by date
        )
        print(total_day_active)
        bpr = TestHistory.objects.filter(user=user,bpr=True).order_by('-test_taken').first()
        history = TestHistory.objects.filter(user=user).order_by('-test_taken')
        context["test_count"] = test_count
        context["avg_wpm"] = f"{avg_wpm["wpm__avg"]:.2f}" if avg_wpm["wpm__avg"] % 1 else f"{int(avg_wpm["wpm__avg"])}"
        context["avg_accuracy"] = f"{avg_accuracy["accuracy__avg"]:.2f}" if avg_accuracy["accuracy__avg"] % 1 else f"{int(avg_accuracy["accuracy__avg"])}"
        context["total_day_active"] = len(total_day_active)
        context["bpr"] = bpr.wpm
        context["history"] = history
    else:
        context["test_count"] = 0
        context["avg_wpm"] = 0
        context["avg_accuracy"] = 0
        context["total_day_active"] = 0
        context["bpr"] = 0
        context["history"] = None
    
    challenge_achieved_count = 0
    if user_settings:
        challenge_achieved = user_settings.challenge_achieved  # Access the challenge_achieved field
        challenge_achieved_count = 0

        for x in challenge_achieved:
            if x == 3:
                challenge_achieved_count += 1
            else:
                break
        context["challenge_achieved"] = f'{challenge_achieved_count}/{len(challenge_achieved)}'
    return render(request, 'html/user-stat.html', context)

def leaderboard(request):
    user = request.user
    today = timezone.now().date()
    context = getUser(user)
    user = get_object_or_404(UserSocialAuth, user=user)
    max_wpm = TestHistory.objects.values('user', 'mode', 'type').annotate(max_wpm=Max('wpm'))

    # Query for 'time' mode with the maximum WPM for each user
    test_history_time_default = TestHistory.objects.filter(
        user=F('user'),
        mode="time",
        type="15",
        wpm=Subquery(max_wpm.filter(user=OuterRef('user'), mode="time").values('max_wpm')[:1]),
        test_taken__date=today
    ).values('wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name')
    test_history_word_default = TestHistory.objects.filter(
        user=F('user'),
        mode="words",
        type="15",
        wpm=Subquery(max_wpm.filter(user=OuterRef('user'), mode="words").values('max_wpm')[:1]),
        test_taken__date=today
    ).values('wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name')

    context["test_history_time_default"] = test_history_time_default
    context["test_history_word_default"] = test_history_word_default
    return render(request, 'html/leaderboard.html', context)

def getTypeLeaderboarrd(request):

    if not request.method == 'GET':
        return HttpResponseBadRequest('Invalid request method. Please use GET')
    
    mode = request.GET.get('mode')
    type = request.GET.get('type')


    
    today = timezone.now().date()
    max_wpm = TestHistory.objects.values('user', 'mode', 'type').annotate(max_wpm=Max('wpm'))

    test_history = TestHistory.objects.filter(
        user=F('user'),
        mode=mode,
        type=type,
        wpm__lte=Subquery(max_wpm.filter(user=OuterRef('user'), mode=mode, type=type).values('max_wpm')[:1]),
        test_taken__date=today
    ).values('wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name')
    context = {
        "test_history": test_history
    }

    return render(request, 'html/leaderboard-table.html', context)









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