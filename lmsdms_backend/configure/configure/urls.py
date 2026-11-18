"""
URL configuration for configure project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static
from dms_module.views import onlyoffice_callback


from django.http import JsonResponse


def root_status(request):
    return JsonResponse({
        "status": True,
        "message": "LMS and DMS Backend API is running.",
        "app": "Please access the frontend application on port 3000."
    })


urlpatterns = [
    path('', root_status, name='root_status'),
    path('api/admin/', admin.site.urls),
    path('api/user_profile/', include('user_profile.urls')),
    path('api/lms_module/', include('lms_module.urls')),
    path('api/dms_module/', include('dms_module.urls')),
    # Same APIs without the /api/ prefix: older frontend builds and the OnlyOffice
    # callback use these paths (e.g. REACT_APP_APIKEY=http://server:8080/).
    path('user_profile/', include('user_profile.urls')),
    path('lms_module/', include('lms_module.urls')),
    path('dms_module/', include('dms_module.urls')),
]

if settings.DEBUG or getattr(settings, "SERVE_MEDIA", True):
    media_prefix = settings.MEDIA_URL.lstrip('/')
    urlpatterns += [
        re_path(rf'^{media_prefix}(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
        re_path(rf'^api/{media_prefix}(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
