from django.urls import path
from .views import SignUpView, SignInView, ForgotPasswordView, ForgotUsernameView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('signin/', SignInView.as_view(), name='signin'),
    path('forgot_password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('forgot_username/', ForgotUsernameView.as_view(), name='forgot_username'),
]
