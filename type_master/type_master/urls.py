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
    
    path('settings', views.settings, name="settings"),
    
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('refresh_words/', views.get_words, name='refresh_words'),
    path('social-auth/', include('social_django.urls', namespace='social_')),
]
