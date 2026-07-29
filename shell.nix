{ pkgs ? import <nixpkgs> {} }:

let
  python = pkgs.python313.withPackages (ps: with ps; [
    flask
    pyyaml
    flask-babel
    requests
    roman
    requests-oauthlib
    gspread
    oauth2client
    google-api-python-client
    jinja2
    pandas
    aiohttp
    nest-asyncio
    flask-sqlalchemy
    flask-caching
    pymysql
  ]);
in
pkgs.mkShell {
  packages = [
    python
  ];
}
