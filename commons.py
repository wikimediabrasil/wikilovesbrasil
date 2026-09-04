import os
import json
from flask import current_app
from wikidata import query_wikidata
from datetime import date
from oauth_requests import get_token, get_username, raw_post_request, invalidate_token
from extensions import cache

url_project = "https://commons.wikimedia.org/w/api.php"

# Quanto tempo guardamos a informação do monumento do Wikidata = 1 hora
BUILD_TEXT_QUERY_CACHE_SECONDS = 3600


def upload_file(uploaded_file, form, text):
    token = get_token(url_project)
    file_bytes = uploaded_file.read()
    media_file = {'file': (form["filename"], file_bytes, 'multipart/form-data')}

    def do_upload(csrf_token):
        params = {
            "action": "upload",
            "filename": form["name"] + get_file_ext(form["filename"]),
            "format": "json",
            "token": csrf_token,
            "text": text,
            "comment": "Uploaded with Wiki Loves Brasil"
        }
        req = raw_post_request(media_file, params, url_project)
        return req.json()

    data = do_upload(token)

    # Se o token cacheado expirou nesse meio-tempo, o Commons responde
    # com o código "badtoken". Nesse caso, pedimos um token novo e
    # tentamos enviar de novo, uma única vez.
    if "error" in data and data["error"].get("code") == "badtoken":
        invalidate_token(url_project)
        new_token = get_token(url_project)
        data = do_upload(new_token)

    return data


# ==================================================================================================================== #
# FUNÇÕES
# ==================================================================================================================== #
def build_text(form):
    qid = form["qid"]
    timestamp = form["filedate"]

    cache_key = f"build_text_query_{qid}"
    result = cache.get(cache_key)
    if result is None:
        result = query_wikidata("SELECT DISTINCT ?item ?itemDescription ?name ?local ?localLabel "
                                "?local_cat ?estado ?estadoLabel (LANG(?itemDescription) AS ?lang) "
                                "WHERE { "
                                "BIND(wd:" + qid + " AS ?item) "
                                "OPTIONAL { [] schema:about ?item; "
                                "schema:isPartOf <https://commons.wikimedia.org/>; "
                                "schema:name ?name. } "
                                "{ ?item p:P131/ps:P131 ?local. } UNION { ?item p:P131/ps:P131 [wdt:P131 ?local]. } "
                                "{ ?local wdt:P31 wd:Q3184121 } UNION { ?local wdt:P31 wd:Q515 } "
                                "?local wdt:P131 ?estado. "
                                "?estado wdt:P31 wd:Q485258. "
                                "OPTIONAL { ?local wdt:P373 ?local_cat. } "
                                "SERVICE wikibase:label { bd:serviceParam wikibase:language 'pt-br,pt,en'. }}")
        cache.set(cache_key, result, timeout=BUILD_TEXT_QUERY_CACHE_SECONDS)

    lang = ""
    descr = ""
    year = str(date.today().year)
    username = get_username(url_project)

    category_local = ""
    category_monument = ""
    category_tool = "Uploaded via WikiLovesBrasil|" + qid

    local_ = ""
    state_ = ""

    if "bindings" in result["results"] and result["results"]["bindings"]:
        for item in result["results"]["bindings"]:
            lang = item["lang"]["value"] if "lang" in item else "pt"
            descr = item["itemDescription"]["value"] if "itemDescription" in item and item["itemDescription"]["value"] else "fotografia de bem tombado em " + item["localLabel"]["value"] + ", " + item["estadoLabel"]["value"] + "."
            category_monument = item["name"]["value"].replace("Category:", "") if "name" in item else ""
            category_local = item["local_cat"]["value"].replace("Category:", "") if "local_cat" in item else ""
            local_ = item["local"]["value"].replace("http://www.wikidata.org/entity/", "") if "local" in item else ""
            state_ = item["estado"]["value"].replace("http://www.wikidata.org/entity/", "") if "estado" in item else ""

    with open(os.path.join(current_app.static_folder, 'categories' + year + '.json'), encoding="utf-8") as cat_list:
        contest_cats = json.load(cat_list)
    if local_ in contest_cats["cidades"]:
        category_wlm = contest_cats["cidades"][local_]
    elif state_ in contest_cats["estados"]:
        category_wlm = contest_cats["estados"][state_]
    else:
        category_wlm = "Images from Wiki Loves Monuments " + year + " in Brazil without proper category"

    if category_monument:
        category_local = ""

    category_image_type = "Images from Wiki Loves Monuments " + year + " in Brazil declared to fit " + form["image_type"] + " Wikidata property"
    categories = list(filter(None, [category_monument, category_local, category_wlm, category_tool, category_image_type]))

    coordinates = "{{Location|" + form["coordinates"] + "}}\n" if form["coordinates"] else ""

    text = ("=={{int:filedesc}}==\n" +
            "{{Information\n" +
            "|description={{" + lang + "|1=" + descr + "}}\n{{MonumentID|" + qid + "}}\n" +
            "|date=" + timestamp + "\n" +
            "|source={{own}}\n" +
            "|author=[[User:" + username + "|" + username + "]]\n" +
            "}}\n" +
            coordinates +
            "\n\n" +
            "=={{int:license-header}}==\n" +
            "{{self|cc-by-sa-4.0}}\n{{Wiki Loves Monuments " + year + "|br}}\n\n" +
            "[[Category:" + "]]\n[[Category:".join(categories) + "]]\n"
            )
    return text


def get_license(license_):
    if license_ == "ccbysa3":
        return "Cc-by-sa-3.0"
    elif license_ == "ccby4":
        return "Cc-by-4.0"
    elif license_ == "ccby3":
        return "Cc-by-3.0"
    elif license_ == "cc0":
        return "Cc-zero"
    else:
        return "Cc-by-sa-4.0"


def get_file_ext(filename):
    file_ext = filename.split(".")[-1]
    if file_ext != filename:
        return "." + file_ext
    return ""


def read_chunks(file_object, chunk_size=5000):
    while True:
        data = file_object.read(chunk_size)
        if not data:
            break
        yield data
