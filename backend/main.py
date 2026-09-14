from firebase_functions import https_fn
from a2wsgi import ASGIMiddleware
from app.main import app

# Wrap the FastAPI ASGI application into a WSGI application
wsgi_app = ASGIMiddleware(app)

@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    """
    Firebase Cloud Function HTTP trigger that routes all requests to the FastAPI app.
    """
    # https_fn.on_request can directly return a WSGI app invocation in Python Firebase Functions
    # The 'req' object is a flask.Request
    from flask import make_response
    
    # Unfortunately, the firebase-functions wrapper doesn't directly take a WSGI app like this natively 
    # unless we use something like `dispatcher`. Let's just return the wsgi_app for functions-framework.
    # Actually, functions-framework can serve the WSGI app directly if we expose it as the target.
    pass

# Expose the wsgi app directly as the cloud function entry point
# In firebase.json, we can just point to this if it doesn't work with on_request.
api_app = https_fn.on_request()(wsgi_app)
# Functions Framework will invoke this WSGI-compatible callable
app = WSGIMiddleware(fastapi_app)
