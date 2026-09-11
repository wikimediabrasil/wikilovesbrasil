from flask import current_app, session
from requests_oauthlib import OAuth1Session
from urllib.parse import urlencode
import requests
from extensions import cache, USER_AGENT

# Um token CSRF continua válido enquanto a sessão de login do usuário
# durar. Cacheamos por um tempo curto (5 min) só para evitar pedir um
# token novo a cada arquivo de um mesmo envio em lote.
TOKEN_CACHE_SECONDS = 300


class OAuthApiError(Exception):
    """A Action API da Wikimedia (Commons/Wikidata) respondeu com algo que
    não é JSON, ou com um HTTP de erro — normalmente sinal de sobrecarga,
    bloqueio por volume de requisições, ou uma falha transitória do
    cluster."""
    pass


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
    return oauth.get(url, params=params, headers={'User-Agent': USER_AGENT}, timeout=60)


def api_request(params, url_project):
    response = raw_request(params, url_project)
    return _parse_json_or_raise(response)


def _parse_json_or_raise(response):
    """Só existe porque tanto GET quanto POST precisam do mesmo tratamento:
    checar o status e, se a resposta não for JSON, levantar um erro claro
    em vez de deixar o JSONDecodeError estourar sem contexto."""
    try:
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        raise OAuthApiError(
            f"A Wikimedia respondeu com status {response.status_code}."
        ) from e

    try:
        return response.json()
    except requests.exceptions.JSONDecodeError:
        truncated = response.text[:200]
        raise OAuthApiError(
            f"A Wikimedia respondeu com status {response.status_code} em vez "
            f"de JSON (provavelmente sobrecarregada ou bloqueando por volume "
            f"de requisições): {truncated!r}"
        )


# ----- INFORMAÇÕES SOBRE O USUÁRIO ----- #
def get_username(url_project):
    if 'owner_key' not in session:
        return  # not authorized

    # Evita bater na API de novo se já sabemos o nome de usuário desta sessão
    # (senão isso roda a cada requisição, incluindo cada arquivo estático).
    if 'username' in session:
        return session['username']

    params = {'action': 'query', 'meta': 'userinfo', 'format': 'json'}
    try:
        reply = api_request(params, url_project)
    except OAuthApiError:
        # Não é fatal aqui: só significa que não conseguimos confirmar o
        # nome de usuário agora. Como não vai para a session, a próxima
        # requisição tenta de novo sozinha.
        return None

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
    # Não capturamos OAuthApiError aqui de propósito: sem token não dá para
    # seguir com o upload, então quem chama get_token precisa saber que
    # falhou (ver upload_file/send_file).
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
        return oauth.post(url, files=files, data=params, headers={'User-Agent': USER_AGENT}, timeout=60)
    else:
        return oauth.post(url, data=params, headers={'User-Agent': USER_AGENT}, timeout=60)


def api_post_request(files, params, url_project):
    """Equivalente a api_request(), mas para POST (usado no upload de
    arquivo em commons.py) — mesmo tratamento de resposta não-JSON."""
    response = raw_post_request(files, params, url_project)
    return _parse_json_or_raise(response)