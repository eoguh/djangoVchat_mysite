from django.urls import re_path
from . import consumers


websocket_urlpatterns = [
	# ChatConsumer is defined in consumers.py
	re_path(r'', consumers.ChatConsumer.as_asgi()), 
]

