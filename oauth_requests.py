from flask import current_app, session
from requests_oauthlib import OAuth1Session
from urllib.parse import urlencode
from extensions import cache

# Um token CSRF continua válido enquanto a sessão de login do usuário
# durar. Cacheamos por um tempo curto (5 min) só para evitar pedir um
# token novo a cada arquivo de um mesmo envio em lote.
TOKEN_CACHE_SECONDS = 300


# ==================================================================================================================== #
# REQUISIÇÕES GET
# ==================================================================================================================== #
def raw_request(params, url_project):
    app = current_app
    url = url_project
    client_key = app.config['CONSUMER_KEY']
    client_secret = app.config['CONSUMER_SECRET']
    oauth = OAuth1Session(client_key,
                          client_secret=client_secret,
                          resource_owner_key=session['owner_key'],
                          resource_owner_secret=session['owner_secret'])
    return oauth.get(url, params=params, timeout=60)


def api_request(params, url_project):
    return raw_request(params, url_project).json()


# ----- INFORMAÇÕES SOBRE O USUÁRIO ----- #
def get_username(url_project):
    if 'owner_key' not in session:
        return  # not authorized

    params = {'action': 'query', 'meta': 'userinfo', 'format': 'json'}
    reply = api_request(params, url_project)

    if 'query' not in reply:
        return

    session['username'] = reply['query']['userinfo']['name']

    return session['username']


def _token_cache_key(url_project):
    # session['owner_key'] é o identificador da sessão de login OAuth do
    # usuário atual — combinado com o projeto (commons/wikidata), dá uma
    # chave única por pessoa logada.
    return f"csrf_token_{session.get('owner_key')}_{url_project}"


def get_token(url_project):
    cache_key = _token_cache_key(url_project)
    token = cache.get(cache_key)
    if token:
        return token

    params = {
        'action': 'query',
        'meta': 'tokens',
        'format': 'json',
        'formatversion': 2,
    }
    reply = api_request(params, url_project)
    token = reply['query']['tokens']['csrftoken']
    cache.set(cache_key, token, timeout=TOKEN_CACHE_SECONDS)
    return token


def invalidate_token(url_project):
    """Descarta o token cacheado. Use isto se o Commons responder com
    o erro 'badtoken' — nesse caso o token guardado ficou inválido e
    precisamos pedir um novo na próxima chamada."""
    cache.delete(_token_cache_key(url_project))


# ==================================================================================================================== #
# REQUISIÇÕES POST
# ==================================================================================================================== #
def raw_post_request(files, params, url_project):
    app = current_app
    url = url_project
    client_key = app.config['CONSUMER_KEY']
    client_secret = app.config['CONSUMER_SECRET']
    oauth = OAuth1Session(client_key,
                          client_secret=client_secret,
                          resource_owner_key=session['owner_key'],
                          resource_owner_secret=session['owner_secret'])
    if files:
        return oauth.post(url, files=files, data=params, timeout=60)
    else:
        return oauth.post(url, data=params, timeout=60)
