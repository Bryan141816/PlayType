from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.template.defaulttags import register
from .models import Word, UserSettings, TestHistory, bsitTypingMaster, bsitTypeingMasterPlayers, achivement, PlayerAchivements
from django.contrib.auth import logout
from social_django.models import UserSocialAuth
import random
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Max, Count, Avg, OuterRef, Subquery, F, Q, Subquery, Value, Case, When, CharField
from django.db.models.functions import TruncDate
from django.http import JsonResponse, HttpResponseBadRequest
from datetime import datetime
from django.utils import timezone
import json
from django.contrib.auth.models import User
from django.http import StreamingHttpResponse
import time
from decouple import config
import pusher
from django_ratelimit.decorators import ratelimit

pusher_app_id   =config('pusher_app_id')
pusher_key      =config('pusher_key')
pusher_secret   =config('pusher_secret')

print(pusher_app_id, pusher_key, pusher_secret)
pusher_client = pusher.Pusher(
  app_id=   pusher_app_id,
  key=      pusher_key,
  secret=   pusher_secret,
  cluster='ap1',
  ssl=True
)

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def typing_master_competetion(request):
    user = request.user
    context = getUser(user)
    user = get_object_or_404(UserSocialAuth, user=user)
    created_lobby = bsitTypingMaster.objects.filter(host=user)
    context["created_lobby"] = created_lobby
    return render(request, 'html/type_master.html', context)

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def createTypingTestLobby(request):

    if request.method not in ['POST', 'PUT']:
        return HttpResponseBadRequest('Invalid request method. Please use POST or PUT.')
    
    user = request.user

    context = getUser(user)
    # Check if the user is authenticated
    if not user.is_authenticated:
        return JsonResponse({'error': 'User is not authenticated.'}, status=401)

    user = get_object_or_404(UserSocialAuth, user=user)

    # Retrieve parameters from the request
    code = request.POST.get('code')
    name = request.POST.get('name')
    test_time = request.POST.get('test_time')
    test_amount = request.POST.get('test_amount')

    try:
        bsitTypingMaster.objects.create(
            code = code,
            name = name,
            host = user,
            test_time = test_time,
            test_ammount = test_amount,
        )
        created_lobby = bsitTypingMaster.objects.filter(host=user)
        context["created_lobby"] = created_lobby

        lobby = render_to_string('html/type_master.html', context)
        return JsonResponse({
            'success': True,
            'lobby': lobby
        })
    except:
        return JsonResponse({
            'success': False,
        })
def getLobbyLeaderBoard(code):
    max_wpm = TestHistory.objects.values('user', 'mode', 'type').annotate(max_wpm=Max('wpm'))
    test_history = TestHistory.objects.filter(
        user=F('user'),
        mode='lobby',
        type=code,
        wpm__lte=Subquery(max_wpm.filter(user=OuterRef('user'), mode='lobby', type=code).values('max_wpm')[:1]),
    ).values('id','user','wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name','user__user__username').order_by('-wpm')
    test_history_list = list(test_history)
    unique_user_records = []
    seen_users = set()  # To track which users we've already added
    for record in test_history_list:
        user_id = record['user']
        # If this user hasn't been added yet, or if the current record has a higher WPM
        if user_id not in seen_users or record['wpm'] > next((r['wpm'] for r in unique_user_records if r['user'] == user_id), 0):
            # Add to the list (instead of a dictionary) with all relevant fields
            unique_user_records.append({
                'id': record['id'],
                'user': record['user'],
                'wpm': record['wpm'],
                'accuracy': record['accuracy'],
                'test_taken__date': record['test_taken__date'],
                'user__extra_data__picture': record['user__extra_data__picture'],
                'user__extra_data__name': record['user__extra_data__name'],
                'user__user__username': record['user__user__username']
            })
        seen_users.add(user_id)
    return unique_user_records
@ratelimit(key='ip', rate='20/second', method='POST', block=True)
def update_player_canplay_in_lobby(request, code):
    if not request.method == "POST":
        return HttpResponseBadRequest('why?')
    try:
        # Use atomic transaction to ensure data consistency
        with transaction.atomic():
            # Fetch the lobby and update its state
            lobby = bsitTypingMaster.objects.get(code=code)
            player = bsitTypeingMasterPlayers.objects.get(lobby = lobby)
            player.is_can_play = False
            player.save()
        return JsonResponse({
            'success': True,
            'message': 'updated succesfully'
        })
    except bsitTypingMaster.DoesNotExist:
        # Handle the case where the lobby does not exist
        return HttpResponseBadRequest('huh')
    except Exception as e:
        # Handle other exceptions and log the error for debugging
        print(f"Error updating: {e}")
@ratelimit(key='ip', rate='20/second', method='ALL', block=True)
def manageLobby(request, code):
    if request.method == 'POST':
        event_type = request.POST.get('event')
        print(event_type)
        if(event_type == 'lobby_started'):      
            try:
                # Use atomic transaction to ensure data consistency
                with transaction.atomic():
                    # Fetch the lobby and update its state
                    lobby = bsitTypingMaster.objects.get(code=code)
                    if lobby.is_started:  # Optional: Add a check if it's already started
                        return HttpResponseBadRequest('already_started')

                    lobby.is_started = True
                    lobby.save()

                # Trigger the Pusher event after successful save
                pusher_client.trigger(f'{code}-client', 'lobby-status', {'status': True})
                return JsonResponse({
                    'success': True,
                    'message': 'Lobby started successfully.'
                })

            except bsitTypingMaster.DoesNotExist:
                # Handle the case where the lobby does not exist
                return HttpResponseBadRequest('lobby dont exist')

            except Exception as e:
                # Handle other exceptions and log the error for debugging
                print(f"Error starting lobby: {e}")
                return HttpResponseBadRequest('idk bruh')
        elif(event_type == 'lobby_stopped'):
            try:
                # Use atomic transaction to ensure data consistency
                with transaction.atomic():
                    # Fetch the lobby and update its state
                    lobby = bsitTypingMaster.objects.get(code=code)

                    lobby.is_started = False
                    lobby.save()

                # Trigger the Pusher event after successful save
                pusher_client.trigger(f'{code}-client', 'lobby-status', {'status': False})
                print('hello')
                return JsonResponse({
                    'success': True,
                    'message': 'Lobby started successfully.'
                })

            except bsitTypingMaster.DoesNotExist:
                # Handle the case where the lobby does not exist
                print('bruh')
                return HttpResponseBadRequest('lobby dont exist')

            except Exception as e:
                # Handle other exceptions and log the error for debugging
                print(f"Error starting lobby: {e}")
                return HttpResponseBadRequest('idk bruh')
    else:
        user = request.user
        context = getUser(user)
        user = get_object_or_404(UserSocialAuth, user=user)
        
        lobby = bsitTypingMaster.objects.filter(code = code).first()

        player = bsitTypeingMasterPlayers.objects.filter(lobby = lobby)

        context["lobby"] = lobby
        context["players"] = player

        unique_user_records = getLobbyLeaderBoard(code)

        context["test_history"] = unique_user_records

        return render(request, 'html/manage_lobby.html', context)


@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def connectToLobby(request, code):
    user = request.user
    context = getUser(user)
    user = get_object_or_404(UserSocialAuth, user=user)

    lobby = bsitTypingMaster.objects.filter(code = code).first()

    players = bsitTypeingMasterPlayers.objects.filter(lobby = lobby, user = user)


    if not lobby:
        # Optional: Handle cases where the lobby with the given code does not exist.
        return render(request, 'html/lobby_not_found.html')

    context["lobby"] = lobby
    is_player_in_lobby = players.exists()
    if is_player_in_lobby:
        if not (players.first()).is_can_play:
            return render(request, 'html/lobby_test_limit.html', context)
        else:
            return render(request, 'html/joinlobby.html', context)
    try:
        # Notify others in the lobby that a player has joined
        pusher_client.trigger(f'{code}-host', 'player-joined', {'name': user.extra_data.get('name')})

        # Add the player to the lobby
        bsitTypeingMasterPlayers.objects.create(
            user=user,
            lobby=lobby
        )

        return render(request, 'html/joinlobby.html', context)
    except Exception as e:
        # Handle unexpected errors (e.g., logging the exception for debugging)
        print(f"Error: {e}")
        return render(request, 'html/sse.html')  # Render an error page if needed





@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def login_view(request):
    return render(request, 'html/login.html')
@ratelimit(key='ip', rate='20/second', method='GET', block=True)
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

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def index(request):
    user = request.user
    



    
    context = getUser(user)

    # user = get_object_or_404(UserSocialAuth, user=user)
    # subquery = PlayerAchivements.objects.filter(
    #     achivement=OuterRef('pk'),
    #     user=user
    # ).values('date_done')[:1]

    # # Annotate each achievement with the date_done or "Not achieved"
    # achievements = achivement.objects.annotate(
    #     achieved_status=Case(
    #         When(id__in=PlayerAchivements.objects.filter(user=user).values('achivement'), then=Subquery(subquery)),
    #         default=Value("Not achieved"),
    #         output_field=CharField()
    #     )
    # )

    # # Convert achievements to a list of dictionaries with the status
    # value =  [
    #     {**achievement.to_dict(), "achieved_status": achievement.achieved_status}
    #     for achievement in achievements
    # ]



    return render(request, 'html/index.html', context)

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def show_profile(request):
    user = request.user
    context = getUser(user)
    return render(request, 'html/profile.html',context)

@register.filter
def letter_token(word):
    word = word.lower()
    return list(word)

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def challenges(request):
    return render(request, 'html/challenges-template.html')
@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def settings(request):
    return render(request, 'html/settings.html')
    
@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def get_words(request):
    if request.method == 'GET':
        #amount = int(request.GET.get('amount', 100))
        amount = 200
        all_random_words = list(Word.objects.order_by('?').values_list('word', 'length')[:(max(1000, (10 * amount)))])

        short_words = [word for word, length in all_random_words if length <= 5]
        long_words = [word for word, length in all_random_words if length > 5]

        short_count = min(92, amount)  
        long_count = max(0, amount - short_count)  

        selected_words = random.choices(short_words, k=short_count) + random.choices(long_words, k=long_count)

        random.shuffle(selected_words)

        random_words = selected_words[:amount]

        return JsonResponse({
            'success': True,
            'words': random_words
        })
@ratelimit(key='ip', rate='20/second', method='POST', block=True)    
def updateUserSettings(request):
    # Check if the request is a POST or PUT request
    if not request.method  == 'POST':
        return HttpResponseBadRequest('Invalid request method. Please use POST.')

    # Get the authenticated user
    user = request.user

    # Check if the user is authenticated
    if not user.is_authenticated:
        return JsonResponse({'error': 'User is not authenticated.'}, status=401)

    # Retrieve the UserSettings instance associated with the authenticated user
    user_settings = get_object_or_404(UserSettings, user__user=user)

    # Retrieve parameters from the request
    theme = request.POST.get('theme')
    exp = request.POST.get('exp')
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
    if exp is not None:
        user_settings.exp = exp
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

@ratelimit(key='ip', rate='20/second', method='POST', block=True)
def addTestHistory(request):
    if not request.method =='POST':
        return HttpResponseBadRequest('Invalid request method. Please use POST or PUT.')
    
    user = request.user
    user = get_object_or_404(UserSocialAuth, user=user)

    data = request.POST
        
    try:
        max_value = TestHistory.objects.filter(user=user).aggregate(Max('wpm'))
        wpm = float(data.get('wpm', 0))
        accuracy=float(data.get('accuracy', 0))
        cormisex=data.get('cormisex', '')
        mode=data.get('mode', '')
        type=data.get('type', '')
        bpr = False
        if(type == 'NaN'):
            type = ""
        if(max_value['wpm__max'] is None or wpm > max_value['wpm__max']):
            bpr = True
        test_history = TestHistory.objects.create(
            user=user,
            wpm=wpm,
            accuracy=accuracy,
            cormisex=cormisex,
            mode=mode,
            type=type,
            bpr=bpr
        )
        check = check_achivement(request.user, 'WPM equal to', str(int(wpm)))
        print(check)
        if(data.get('mode', '') == 'lobby'):

            lobby_leaderboard = getLobbyLeaderBoard(data.get('type', ''))
            context = {
                "test_history": lobby_leaderboard
            }
            test_history_table = render_to_string('html/leaderboard-table.html', context)
            code = data.get('type', '')
            pusher_client.trigger(f'{code}-host', 'new-leaderboard', {'val': f'{test_history_table}'})
        if(bpr):
            confitte_html = render_to_string('html/confitte.html')
            if(check):
                return JsonResponse({
                    'success': True,
                    'message': 'You got a new personal best.',
                    'bpr': bpr,
                    'confitte': confitte_html,
                    'achivement': check,
                    'test_history_id': test_history.id
                })
            else:
                return JsonResponse({
                    'success': True,
                    'message': 'You got a new personal best.',
                    'bpr': bpr,
                    'confitte': confitte_html,
                    'test_history_id': test_history.id
                })
        else:
            if(check):
                return JsonResponse({
                    'success': True,
                    'message': 'Test history added successfully!',
                    'data': bpr,
                    'achivement': check,
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

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def temp(request):
    return render(request, 'html/pusher_test.html')

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def userStat(request):
    user = request.user
    if( not user.is_authenticated):
        return redirect('login')
       
    context = getUser(user)
    user = get_object_or_404(UserSocialAuth, user=user)
    test_count = TestHistory.objects.filter(user=user).count()
    user_settings = UserSettings.objects.filter(user = user).first()

    achieved_count = PlayerAchivements.objects.filter(user=user).count()
    achievements_count = achivement.objects.all().count()

    context["achieved_count"] = achieved_count
    context["achievements_count"] = achievements_count
 
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
        bpr = TestHistory.objects.filter(user=user,bpr=True).order_by('-test_taken').first()
        history = TestHistory.objects.filter(user=user).order_by('-test_taken')
        context["test_count"] = test_count
        context["avg_wpm"] = f"{avg_wpm['wpm__avg']:.2f}" if avg_wpm['wpm__avg'] % 1 else f"{int(avg_wpm['wpm__avg'])}"
        context["avg_accuracy"] = f"{avg_accuracy['accuracy__avg']:.2f}" if avg_accuracy['accuracy__avg'] % 1 else f"{int(avg_accuracy['accuracy__avg'])}"

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

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def leaderboard(request):
    user = request.user
    today = timezone.now().date()
    context = getUser(user)
    user = get_object_or_404(UserSocialAuth, user=user)
    max_wpm = TestHistory.objects.values('user', 'mode', 'type').annotate(max_wpm=Max('wpm'))

    # Query for 'time' mode with the maximum WPM for each user
    test_history_time_default = TestHistory.objects.filter(
            user=F('user'),
            mode='time',
            type="15",
            wpm__lte=Subquery(max_wpm.filter(user=OuterRef('user'), mode="time", type="15").values('max_wpm')[:1]),
            test_taken__date=today
        ).values('id','user','wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name','user__user__username').order_by('-wpm')
    test_history_word_default = TestHistory.objects.filter(
            user=F('user'),
            mode='words',
            type="15",
            wpm__lte=Subquery(max_wpm.filter(user=OuterRef('user'), mode="words", type="15").values('max_wpm')[:1]),
            test_taken__date=today
        ).values('id','user','wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name','user__user__username').order_by('-wpm')

    test_history_list_time = list(test_history_time_default)

    unique_user_records_time = []
    seen_users_time = set()  # To track which users we've already added

    for record in test_history_list_time:
        user_id = record['user']
        # If this user hasn't been added yet, or if the current record has a higher WPM
        if user_id not in seen_users_time or record['wpm'] > next((r['wpm'] for r in unique_user_records_time if r['user'] == user_id), 0):
            # Add to the list (instead of a dictionary) with all relevant fields
            unique_user_records_time.append({
                'id': record['id'],
                'user': record['user'],
                'wpm': record['wpm'],
                'accuracy': record['accuracy'],
                'test_taken__date': record['test_taken__date'],
                'user__extra_data__picture': record['user__extra_data__picture'],
                'user__extra_data__name': record['user__extra_data__name'],
                'user__user__username': record['user__user__username']
            })
        seen_users_time.add(user_id)

    test_history_list_word = list(test_history_word_default)

    unique_user_records_word = []
    seen_users_word = set()  # To track which users we've already added

    for record in test_history_list_word:
        user_id = record['user']
        # If this user hasn't been added yet, or if the current record has a higher WPM
        if user_id not in seen_users_word or record['wpm'] > next((r['wpm'] for r in unique_user_records_word if r['user'] == user_id), 0):
            # Add to the list (instead of a dictionary) with all relevant fields
            unique_user_records_word.append({
                'id': record['id'],
                'user': record['user'],
                'wpm': record['wpm'],
                'accuracy': record['accuracy'],
                'test_taken__date': record['test_taken__date'],
                'user__extra_data__picture': record['user__extra_data__picture'],
                'user__extra_data__name': record['user__extra_data__name'],
                'user__user__username': record['user__user__username'],
            })
        seen_users_word.add(user_id)
    


    context["test_history_time_default"] = unique_user_records_time
    context["test_history_word_default"] = unique_user_records_word
    return render(request, 'html/leaderboard.html', context)

@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def getTypeLeaderboarrd(request):

    if not request.method == 'GET':
        return HttpResponseBadRequest('Invalid request method. Please use GET')
    
    table_type = request.GET.get('table_type')
    mode = request.GET.get('mode')
    type = request.GET.get('type')
    date = request.GET.get('date')

    max_wpm = TestHistory.objects.values('user', 'mode', 'type').annotate(max_wpm=Max('wpm'))
    if not table_type == "all":
        test_history = TestHistory.objects.filter(
            user=F('user'),
            mode=mode,
            type=type,
            wpm__lte=Subquery(max_wpm.filter(user=OuterRef('user'), mode=mode, type=type).values('max_wpm')[:1]),
            test_taken__date=date
        ).values('id','user','wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name','user__user__username').order_by('-wpm')

        test_history_list = list(test_history)

        unique_user_records = []
        seen_users = set()  # To track which users we've already added

        for record in test_history_list:
            user_id = record['user']
            # If this user hasn't been added yet, or if the current record has a higher WPM
            if user_id not in seen_users or record['wpm'] > next((r['wpm'] for r in unique_user_records if r['user'] == user_id), 0):
                # Add to the list (instead of a dictionary) with all relevant fields
                unique_user_records.append({
                    'id': record['id'],
                    'user': record['user'],
                    'wpm': record['wpm'],
                    'accuracy': record['accuracy'],
                    'test_taken__date': record['test_taken__date'],
                    'user__extra_data__picture': record['user__extra_data__picture'],
                    'user__extra_data__name': record['user__extra_data__name'],
                    'user__user__username': record['user__user__username']
                })
            seen_users.add(user_id)



        context = {
            "test_history": unique_user_records
        }
        test_history_table = render_to_string('html/leaderboard-table.html', context)
        return JsonResponse({
            'success': True,
            'test_history': test_history_table,
        })
    else:
        test_history_time_default = TestHistory.objects.filter(
            user=F('user'),
            mode='time',
            type="15",
            wpm__lte=Subquery(max_wpm.filter(user=OuterRef('user'), mode="time", type="15").values('max_wpm')[:1]),
            test_taken__date=date
        ).values('id','user','wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name','user__user__username').order_by('-wpm')
        test_history_word_default = TestHistory.objects.filter(
                user=F('user'),
                mode='words',
                type="15",
                wpm__lte=Subquery(max_wpm.filter(user=OuterRef('user'), mode="words", type="15").values('max_wpm')[:1]),
                test_taken__date=date
            ).values('id','user','wpm', 'accuracy', 'test_taken__date', 'user__extra_data__picture', 'user__extra_data__name','user__user__username').order_by('-wpm')

        test_history_list_time = list(test_history_time_default)

        unique_user_records_time = []
        seen_users_time = set()  # To track which users we've already added

        for record in test_history_list_time:
            user_id = record['user']
            # If this user hasn't been added yet, or if the current record has a higher WPM
            if user_id not in seen_users_time or record['wpm'] > next((r['wpm'] for r in unique_user_records_time if r['user'] == user_id), 0):
                # Add to the list (instead of a dictionary) with all relevant fields
                unique_user_records_time.append({
                    'id': record['id'],
                    'user': record['user'],
                    'wpm': record['wpm'],
                    'accuracy': record['accuracy'],
                    'test_taken__date': record['test_taken__date'],
                    'user__extra_data__picture': record['user__extra_data__picture'],
                    'user__extra_data__name': record['user__extra_data__name'],
                    'user__user__username': record['user__user__username']
                })
            seen_users_time.add(user_id)

        test_history_list_word = list(test_history_word_default)

        unique_user_records_word = []
        seen_users_word = set()  # To track which users we've already added

        for record in test_history_list_word:
            user_id = record['user']
            # If this user hasn't been added yet, or if the current record has a higher WPM
            if user_id not in seen_users_word or record['wpm'] > next((r['wpm'] for r in unique_user_records_word if r['user'] == user_id), 0):
                # Add to the list (instead of a dictionary) with all relevant fields
                unique_user_records_word.append({
                    'id': record['id'],
                    'user': record['user'],
                    'wpm': record['wpm'],
                    'accuracy': record['accuracy'],
                    'test_taken__date': record['test_taken__date'],
                    'user__extra_data__picture': record['user__extra_data__picture'],
                    'user__extra_data__name': record['user__extra_data__name'],
                    'user__user__username': record['user__user__username']
                })
            seen_users_word.add(user_id)
        test_history_time = render_to_string('html/leaderboard-table.html', context={"test_history": unique_user_records_time})
        test_history_word = render_to_string('html/leaderboard-table.html', context={"test_history": unique_user_records_word})
        return JsonResponse({
            'success': True,
            'test_history_time': test_history_time,
            'test_history_word': test_history_word,
        })
    


@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def showPublicProfile(request, username):

    user = request.user
    context = getUser(user)
    publicuser = None
    try:
        publicuser = User.objects.get(username=username)
    except User.DoesNotExist:
        publicuser = None
    public_profile = getUser(publicuser)
    public_profile.pop('user_settings')
    public_profile.pop('login_origin')
    context["public_profile"] = public_profile

       
    publicuser = get_object_or_404(UserSocialAuth, user=publicuser)
    achieved_count = PlayerAchivements.objects.filter(user=publicuser).count()
    achievements_count = achivement.objects.all().count()

    context["achieved_count"] = achieved_count
    context["achievements_count"] = achievements_count

    test_count = TestHistory.objects.filter(user=publicuser).count()
    public_user_settings = UserSettings.objects.filter(user = publicuser).first()
    context["public_exp"] = public_user_settings.exp
    if(test_count != 0):
        avg_wpm = TestHistory.objects.filter(user=publicuser).aggregate(Avg('wpm'))
        avg_accuracy = TestHistory.objects.filter(user=publicuser).aggregate(Avg('accuracy'))
        total_day_active = (
            TestHistory.objects
            .filter(user=publicuser)
            .annotate(date=TruncDate('test_taken'))  # Truncate to date level
            .values('date')  # Group by date
            .annotate(count=Count('id'))  # Count entries per date
            .order_by('date')  # Sort by date
        )
        bpr = TestHistory.objects.filter(user=publicuser,bpr=True).order_by('-test_taken').first()

        context["test_count"] = test_count
        context["avg_wpm"] = f"{avg_wpm["wpm__avg"]:.2f}" if avg_wpm["wpm__avg"] % 1 else f"{int(avg_wpm["wpm__avg"])}"
        context["avg_accuracy"] = f"{avg_accuracy["accuracy__avg"]:.2f}" if avg_accuracy["accuracy__avg"] % 1 else f"{int(avg_accuracy["accuracy__avg"])}"
        context["total_day_active"] = len(total_day_active)
        context["bpr"] = bpr.wpm
    else:
        context["test_count"] = 0
        context["avg_wpm"] = 0
        context["avg_accuracy"] = 0
        context["total_day_active"] = 0
        context["bpr"] = 0
    
    challenge_achieved_count = 0
    if public_user_settings:
        challenge_achieved = public_user_settings.challenge_achieved  # Access the challenge_achieved field
        challenge_achieved_count = 0

        for x in challenge_achieved:
            if x == 3:
                challenge_achieved_count += 1
            else:
                break
        context["challenge_achieved"] = f'{challenge_achieved_count}/{len(challenge_achieved)}'
    return render(request, 'html/public-profile.html', context)


@ratelimit(key='ip', rate='20/second', method='POST', block=True)
def achivementCheck(request, condition ,value):
    check = check_achivement(request.user, condition, value)
    if(check):
        return JsonResponse({'data': check})
    else:
        return JsonResponse({'error': 'no achivements'}, status= 401)





def check_achivement(user, condition, value):

    user = get_object_or_404(UserSocialAuth, user=user)
    achivement_exist = achivement.objects.filter(Q(condition = condition, value = value)).first()
    if not achivement_exist:
        return None
    
    user_done = PlayerAchivements.objects.filter(Q(user = user, achivement = achivement_exist))

    if user_done:
        return None
    
    player_achivement = PlayerAchivements(user = user, achivement = achivement_exist)
    player_achivement.save()

    return achivement_exist.to_dict()



@ratelimit(key='ip', rate='20/second', method='GET', block=True)
def showAchivements(request):
    user = request.user
    context = getUser(user)

    user = get_object_or_404(UserSocialAuth, user=user)
    subquery = PlayerAchivements.objects.filter(
        achivement=OuterRef('pk'),
        user=user
    ).values('date_done')[:1]

    achieved_count = PlayerAchivements.objects.filter(user=user).count()
    achievements_count = achivement.objects.all().count()

    percentage = round(((achieved_count/achievements_count) * 100), 2) 

    context["achieved_count"] = achieved_count
    context["achievements_count"] = achievements_count
    context["percentage"] = percentage

    # Annotate each achievement with the date_done or "Not achieved"
    achievements = achivement.objects.annotate(
        achieved_status=Case(
            When(id__in=PlayerAchivements.objects.filter(user=user).values('achivement'), then=Subquery(subquery)),
            default=Value("Not achieved"),
            output_field=CharField()
        )
    )

    grouped_achievements = [
    {
        **achievement.to_dict(),
        "achieved_status": achievement.achieved_status
    }
    for achievement in achievements.order_by('category')  # Sort by category
]


    context["achivements"] = grouped_achievements
    return render(request, 'html/achivements.html', context=context)


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

