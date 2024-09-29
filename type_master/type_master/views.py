from django.shortcuts import render, redirect
from django.template.defaulttags import register
from .models import Word
from django.contrib.auth import logout


def login_view(request):
    return render(request, 'html\login.html')
def logout_view(request):
    logout(request)
    return redirect('index')

def index(request):
    random_words = Word.objects.order_by('?').values_list('word', flat=True)[:100]
    if request.user.is_authenticated:
        context = {
            'random_word': random_words,
            'user': request.user
        }
        return render(request, 'html\index.html', context )
    else:
        context = {
            'random_word': random_words
        }
        return render(request, 'html\index.html', context )

def get_words(request):
    if request.method == 'GET':
        random_words = Word.objects.order_by('?').values_list('word', flat=True)[:100]

        context = {
            'random_word': random_words
        }

        return render(request, 'html\words_container.html', context )
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