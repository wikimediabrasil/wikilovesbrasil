<img src="https://img.shields.io/github/issues/wikimediabrasil/wikilovesbrasil?style=for-the-badge"/> <img src="https://img.shields.io/github/license/WikiMovimentoBrasil/wikilovesbrasil?style=for-the-badge"/> <img src="https://img.shields.io/github/languages/top/WikiMovimentoBrasil/wikilovesbrasil?style=for-the-badge"/>

# Wiki Loves Brasil

This tool is a application to be hosted in Toolforge. It invites photographers and Wikimedia users to locate and send their photographs to Wikimedia Commons in the context of Wiki Loves Monuments contest.

The tool presents a light, mobile friendly and interactive map wher users can navigate and chose a monument that they have photographs of their own and want to upload in the WLM contest, help improve the number of monuments with geographic coordinates and suggest monuments to participare in the contest. 

This tool is available live at: https://wikilovesbrasil.toolforge.org/

## Installation

If you want to use this tool for your country WLM constest or other Wiki Loves constests, you can fork and adapt the code to your needs. Be free to contact with any doubts on how to do so.

There are several packages need to this application to function. All of them are listed in the <code>requeriments.txt</code> file. To install them, use

```bash
pip install -r requirements.txt
```

You also need to set the configuration file. To do this, you need [a Oauth consumer token and Oauth consumer secret](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose).
Your config file should look like this:
```bash
SECRET_KEY: "YOUR_SECRET_KEY"
BABEL_DEFAULT_LOCALE: "pt"
APPLICATION_ROOT: "wikilovesbrasil/"
OAUTH_MWURI: "https://meta.wikimedia.org/w/index.php"
CONSUMER_KEY: "YOUR_CONSUMER_KEY"
CONSUMER_SECRET: "YOUR_CONSUMER_SECRET"
LANGUAGES: ["pt","en"]
SUGGESTIONS_SPREADSHEET: "YOUR GOOGLE SPREADSHEET WHERE YOU'LL RECEIVE THE SUGGESTIONS OF MONUMENTS"
```

And a <code>credentials.json</code> with your [Google SpreadSheets/Google Drive authentication token](https://developers.google.com/sheets/api/guides/authorizing).

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[GNU General Public License v3.0](https://github.com/wikimediabrasil/wikilovesbrasil/blob/master/LICENSE)

## Credits
This application was developed by [Wikimedia Brasil](https://meta.wikimedia.org/wiki/Wikimedia_Brasil).