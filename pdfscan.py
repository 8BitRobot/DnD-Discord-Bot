from pdfminer.pdfparser import PDFParser
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdftypes import resolve1
import urllib.request, urllib.parse, urllib.error
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def create():
    filename = "TEMP.pdf"
    fp = open(filename, "rb")

    parser = PDFParser(fp)
    doc = PDFDocument(parser)
    fields = resolve1(doc.catalog['AcroForm'])['Fields']
    fields_to_keep = {
        "main": ["player-name", "xp"],
        "saving": ["str-save", "dex-save", "con-save", "int-save", "wis-save", "cha-save"],
        "ability": ["int", "dex", "str", "con", "wis", "cha"],
        "skill": [
            "acrobatics", "animal-handling", "arcana", "athletics", "deception", "history",
            "insight", "intimidation", "investigation", "medicine", "nature", "perception",
            "performance", "persuasion", "religion", "sleight-of-hand", "stealth", "survival"
        ]
    }

    resp = {
        "main": dict.fromkeys(fields_to_keep["main"]),
        "saving": dict.fromkeys(fields_to_keep["saving"]),
        "ability": dict.fromkeys(fields_to_keep["ability"]),
        "skill": dict.fromkeys(fields_to_keep["skill"])
    }

    for i in fields:
        field = resolve1(i)
        try:
            field_name, value = field.get('T').decode("utf-8"), field.get('V').decode("utf-8")
        except AttributeError:
            continue
        except UnicodeDecodeError:
            continue
        field_is_important = False
        field_type = None
        for i in fields_to_keep:
            if field_name in fields_to_keep[i]:
                field_is_important = True
                field_type = i
                break
        if field_is_important:
            resp[field_type][field_name] = value
            print(field_name);

    fp.close()

    return resp