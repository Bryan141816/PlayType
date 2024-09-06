from django.shortcuts import render
import nltk
from nltk.corpus import words
import random
from django.template.defaulttags import register


def index(request):

    nltk.download('words')

    word_list = words.words()

    random_word = []
    for _ in range(100):
        random_word.append((random.choice(word_list)).lower())

    context = {
        'random_word': random_word
    }

    return render(request, 'html\index.html', context )

@register.filter
def settencefy(lists):
    return ' '.join(lists)