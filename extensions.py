"""
Este arquivo existe só para guardar objetos "compartilhados" entre os módulos
da aplicação (hoje, o cache). A ideia é a mesma do db.py: em vez de criar o
objeto Cache() dentro do app.py e ter que importar app.py de outros lugares
(o que gera erro de "import circular"), criamos ele aqui, sem depender de
nada, e cada módulo importa daqui o que precisar.
"""
from flask_caching import Cache

cache = Cache()

USER_AGENT = "WLM Brasil/1.0 (wikilovesbrasil.toolforge.org <wikilovesbrasil@wmnobrasil.org>)"
