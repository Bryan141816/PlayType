from django.contrib import admin
from .models import Word, UserSettings

@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    # Define the columns to display in the list view
    list_display = ('word_id', 'word', 'length', 'lang')
    
    # Optional: Add filters and search functionality
    list_filter = ('lang',)
    search_fields = ('word', 'lang')
@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('social_auth','theme')
    
