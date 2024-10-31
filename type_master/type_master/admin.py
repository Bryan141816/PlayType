from django.contrib import admin
from .models import Word, UserSettings, TestHistory

@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    # Define the columns to display in the list view
    list_display = ('word_id', 'word', 'length', 'lang')
    
    # Optional: Add filters and search functionality
    list_filter = ('lang',)
    search_fields = ('word', 'lang')
@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'theme',
        'mode_used',
        'time_selected',
        'word_amount_selected',
        'challenge_achieved',
        'custome_sentence',
        'last_updated'
    )

@admin.register(TestHistory)
class TestHistoryAdmin(admin.ModelAdmin):
    list_display = (
            "id",
            "user",
            "wpm",
            "accuracy",
            "cormisex",
            "mode",
            "type",
            "bpr",
            "test_taken"
    )
