from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name="index"),
    path('show-profile', views.show_profile, name="show-profile"),

    path('3D', views.ThreeDOBject, name="test3d"),
    path('data-privacy', views.data_privary, name="test3d"),
    path('user-data-deletion', views.deletion, name="test3d"),

    path('challenges', views.challenges, name="challenges"),
    
    path('temp', views.temp, name="temp"),

    path('user/settings/update/', views.updateUserSettings, name='update-user-settings'),

    path('user/test/history', views.addTestHistory, name='add-test-history'),

    path('user/stat/', views.userStat, name='userstat'),
    path('user/leaderboards/', views.leaderboard, name='leaderboards'),
    path('user/leaderboards/getData/', views.getTypeLeaderboarrd, name="getTypeLeaderboard"),

    path('profile/<str:username>/', views.showPublicProfile, name="publicProfile"),

    path('settings', views.settings, name="settings"),
    
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('refresh_words/', views.get_words, name='refresh_words'),
    path('social-auth/', include('social_django.urls', namespace='social_')),

    path('short-polling/', views.short_polling_view, name='short_polling'),
    path('short_polling_render/', views.shortpolling_render, name='short_polling_render'),

    path('type_master_competetion/', views.typing_master_competetion, name='type_master_competetion'),
    path('create_lobby/', views.createTypingTestLobby, name='create_lobby'),

    path('connect_to_lobby/<str:code>/', views.connectToLobby, name="connect_to_lobby"),
    path('managelobby/<str:code>/', views.manageLobby, name="managelobby"),
    path('update_player_to_cant/<str:code>/', views.update_player_canplay_in_lobby, name="update_player_to_cant"),

    path('pusher_test/', views.pusherTest, name="pusher_test"),
]
