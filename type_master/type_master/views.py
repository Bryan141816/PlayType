from django.shortcuts import render
from django.template.defaulttags import register
from .models import Word



def index(request):

    random_words = Word.objects.order_by('?').values_list('word', flat=True)[:100]



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

@register.filter
def letter_token(word):
    return list(word)