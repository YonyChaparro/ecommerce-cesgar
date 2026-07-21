#!/usr/bin/env python3
"""Exporta los articulos de CESGAR a carpetas .md con sus recursos graficos."""
import html as htmllib
import json
import os
import re
import shutil
import sys
import unicodedata
import urllib.parse
import urllib.request
from html.parser import HTMLParser

BASE = "/Users/mbp/Downloads/u378367242.20260503230320.tar (2)"
UPLOADS = os.path.join(BASE, "public_html/wp-content/uploads")
LLMS = os.path.join(BASE, "public_html/llms.txt")
OUT = os.path.join(BASE, "articulos-exportados")
SITE = "https://cesgar.com.co"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

STOP = set("""de la el los las en para con y a un una del que como su mas por tu al se es o
son sus lo le muy sobre entre desde hasta sin este esta estos estas cesgar com co""".split())


def deaccent(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def slugify(s, maxlen=70):
    s = deaccent(htmllib.unescape(s)).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:maxlen].strip("-")


def tokens(s):
    out = set()
    for t in re.split(r"[^a-z0-9]+", deaccent(s).lower()):
        if not t or t in STOP or len(t) < 2:
            continue
        if len(t) > 4 and t.endswith("s"):      # singularizar: impresoras -> impresora
            t = t[:-1]
        out.add(t)
    return out


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", "replace")


# ---------------------------------------------------------------- llms.txt
def parse_llms():
    posts = []
    section = None
    for line in open(LLMS, encoding="utf-8-sig"):
        line = line.rstrip("\n")
        if line.startswith("## "):
            section = line[3:].strip()
            continue
        if section != "Posts" or not line.startswith("- ["):
            continue
        m = re.match(r"- \[(.*?)\]\((.*?)\)(?::\s*(.*))?$", line)
        if m:
            title, url, excerpt = m.group(1), m.group(2), (m.group(3) or "").strip()
            posts.append({"title": htmllib.unescape(title), "url": url,
                          "slug": url.rstrip("/").split("/")[-1],
                          "excerpt": htmllib.unescape(excerpt)})
    return posts


# ------------------------------------------------------- HTML -> Markdown
SKIP_TAGS = {"script", "style", "svg", "path", "circle", "rect", "noscript", "button", "nav"}
BLOCK = {"p", "div", "section", "li", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "figure"}


class MainExtractor(HTMLParser):
    """Convierte el <main> de una pagina del sitio nuevo a markdown."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth_skip = 0
        self.in_main = False
        self.main_depth = 0
        self.out = []
        self.buf = []
        self.cur_block = None
        self.images = []
        self.h1 = None
        self.tag_chips = []

    def flush(self):
        raw = "".join(self.buf)
        parts = [x.strip() for x in raw.split("\x01") if x.strip()]
        # varios <span> cortos seguidos = fila de chips (etiquetas) o autor+fecha
        if len(parts) >= 2 and all(len(x) < 60 and not x.endswith((".", ",", ";", ":")) for x in parts):
            raw = " · ".join(parts)
        else:
            raw = "".join(x for x in raw.split("\x01"))
        text = re.sub(r"[ \t]+", " ", raw).strip()
        self.buf = []
        if not text:
            return
        blk = self.cur_block
        if blk == "h1":
            self.h1 = text
            self.out.append("# " + text)
        elif blk in ("h2", "h3", "h4"):
            self.out.append("#" * int(blk[1]) + " " + text)
        elif blk == "li":
            self.out.append("- " + text)
        elif blk == "blockquote":
            self.out.append("> " + text)
        else:
            self.out.append(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "main":
            self.in_main = True
            self.main_depth = 0
            return
        if not self.in_main:
            return
        if tag in SKIP_TAGS:
            self.depth_skip += 1
            return
        if self.depth_skip:
            return
        if tag == "img":
            src = a.get("src") or ""
            if src.startswith("/_next/image"):
                m = re.search(r"url=([^&]+)", src)
                if m:
                    src = urllib.parse.unquote(m.group(1))
            if src.startswith("http"):
                alt = a.get("alt", "").strip()
                self.flush()
                self.images.append((src, alt))
                self.out.append(f"@@IMG:{len(self.images) - 1}@@")
            return
        if tag == "br":
            self.buf.append(" ")
            return
        if tag in BLOCK:
            self.flush()
            if tag in ("h1", "h2", "h3", "h4", "li", "blockquote"):
                self.cur_block = tag
            else:
                self.cur_block = "p"

    def handle_endtag(self, tag):
        if tag == "main":
            self.flush()
            self.in_main = False
            return
        if not self.in_main:
            return
        if tag in SKIP_TAGS:
            self.depth_skip = max(0, self.depth_skip - 1)
            return
        if self.depth_skip:
            return
        if tag == "span":
            self.buf.append("\x01")
            return
        if tag in BLOCK:
            self.flush()
            self.cur_block = "p"

    def handle_data(self, data):
        if self.in_main and not self.depth_skip:
            self.buf.append(data)


NOISE = {"volver al blog", "inicio", "tienda", "servicios", "sobre nosotros", "blog",
         "¡cotizar!", "cotización instantánea", "abrir menú", "cerrar menú",
         "compartir", "artículos relacionados", "leer más", "ver más"}


def scrape_article(slug):
    url = f"{SITE}/blog/{slug}"
    h = fetch(url)
    p = MainExtractor()
    p.feed(h)
    lines = []
    for ln in p.out:
        plain = deaccent(ln.strip("# -> ").strip()).lower()
        if plain in {deaccent(n) for n in NOISE}:
            continue
        lines.append(ln)
    # metadatos
    meta = {}
    m = re.search(r"<title>(.*?)</title>", h, re.S)
    if m:
        meta["title"] = htmllib.unescape(m.group(1)).split("|")[0].strip()
    m = re.search(r'<meta name="description" content="(.*?)"', h, re.S)
    if m:
        meta["description"] = htmllib.unescape(m.group(1)).strip()
    m = re.search(r"(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo),\s*\d+\s*de\s*\w+\s*de\s*\d{4}", h)
    if m:
        meta["fecha"] = m.group(0)
    # la fila de chips antes del H1 son las etiquetas; la de despues, autor + fecha
    hi = next((i for i, l in enumerate(lines) if l.startswith("# ")), None)
    if hi is not None:
        if hi > 0 and " · " in lines[hi - 1]:
            meta["etiquetas"] = [t.strip() for t in lines.pop(hi - 1).split("·")]
            hi -= 1
        if hi + 1 < len(lines) and " · " in lines[hi + 1] and meta.get("fecha", "") in lines[hi + 1]:
            meta["autor"] = lines.pop(hi + 1).split("·")[0].strip()
    return url, lines, p.images, meta


# ------------------------------------------------- emparejar media local
def index_uploads():
    files = []
    for root, _dirs, names in os.walk(UPLOADS):
        if "/elementor/" in root or "/wc-logs" in root or "/forminator" in root:
            continue
        if not re.search(r"/uploads/20\d\d/", root + "/"):
            continue
        for n in names:
            if not re.search(r"\.(jpg|jpeg|png|webp|gif|mp4|svg)$", n, re.I):
                continue
            if re.search(r"-\d+x\d+\.\w+$", n):      # miniaturas
                continue
            files.append(os.path.join(root, n))
    return files


GENERIC = re.compile(r"^(fondo|banner|circulo|cuadro|formas|ico_|cropped|imagen[-_]|image-|logo|"
                     r"\d+\.|banner-|whatsapp|captura|screenshot|a_small)", re.I)


# ajustes manuales sobre el emparejamiento automatico (por slug original)
EXTRA = {
    "descubriendo-los-formatos-de-archivo-3d-2": ["balanza-archivos-stl-3mf", "grafico-cad-desviacion-stl"],
    "repotenciacion-de-impresoras-3d-ender-3": ["ender-3-voron", "ender-3-voron-mfrh-original",
                                                "optimizacion-ender-3-voron"],
    "mantenimiento-y-reparacion-de-impresoras-3d-asegura-su-optimo-funcionamiento":
        ["ingeniero-control-automatizacion-arreglando-impresora-3d"],
    "tirajes-cortos-y-produccion-bajo-demanda-con-impresion-3d-2":
        ["iceberg-industrializacion-impresion-3d", "ingenieros-trabajando-produccion-pieza"],
    "repuestos-automotrices-de-alta-calidad-a-mejor-costo": ["escaneo-3d-vehiculo-automovil-digitalizacion"],
    "no-tienes-escaner-3d-fotogrametria-accesible-a-todo-el-mundo": ["escaneo-3d-celular-captura-movil"],
    "rejilla-de-ventilacion-para-carros": ["plano-carro-3d"],
}
DENY = {
    "mantenimiento-y-reparacion-de-impresoras-3d-asegura-su-optimo-funcionamiento":
        ["angulos-optimos-fotogrametria-escaneo-3d"],
    "escaner-3d-en-la-modificacion-de-moldes": ["vehiculo-siendo-escaneado-en-3d"],
}


def resolve_local(src, files):
    """URL de wp-content/uploads -> archivo real del backup (ignorando miniaturas)."""
    m = re.search(r"/wp-content/uploads/(.+)$", src.split("?")[0])
    if not m:
        return None
    rel = urllib.parse.unquote(m.group(1))
    direct = os.path.join(UPLOADS, rel)
    if os.path.exists(direct):
        return direct
    stem, ext = os.path.splitext(os.path.basename(rel))
    stem = re.sub(r"-\d+x\d+$", "", stem)                       # quitar sufijo de miniatura
    for f in files:
        fstem = os.path.splitext(os.path.basename(f))[0]
        if fstem == stem or fstem == stem + "-scaled":
            return f
    for f in files:                                             # nombres duplicados tipo "x-1.png"
        if re.sub(r"-\d+$", "", os.path.splitext(os.path.basename(f))[0]) == stem:
            return f
    return None


def match_media(post, files, df):
    ptok = tokens(post["slug"]) | tokens(post["title"])
    scored = []
    for f in files:
        name = os.path.basename(f)
        if GENERIC.match(name):
            continue
        ftok = tokens(os.path.splitext(name)[0])
        shared = ptok & ftok
        if not shared:
            continue
        rarest = min(df.get(t, 99) for t in shared)
        # se exige un token distintivo: los genericos ("impresion", "3d") no bastan
        ok = (len(shared) >= 2 and rarest <= 6) or (rarest <= 1 and max(len(t) for t in shared) >= 4)
        if not ok:
            continue
        score = sum(1.0 / df.get(t, 99) for t in shared) * len(shared)
        scored.append((round(score, 3), len(shared), f))
    scored.sort(reverse=True)
    picked = [f for _s, _n, f in scored[:8]]
    for stem in EXTRA.get(post["slug"], []):
        for f in files:
            if os.path.splitext(os.path.basename(f))[0] == stem and f not in picked:
                picked.append(f)
    bad = DENY.get(post["slug"], [])
    return [f for f in picked if not any(b in os.path.basename(f) for b in bad)]


def dedupe(root):
    """Un mismo archivo descargado y copiado dos veces: se deja el nombre descriptivo."""
    import hashlib
    for folder in sorted(os.listdir(root)):
        res = os.path.join(root, folder, "recursos")
        md = os.path.join(root, folder, "index.md")
        if not os.path.isdir(res) or not os.path.exists(md):
            continue
        by_hash = {}
        for n in sorted(os.listdir(res)):
            h = hashlib.md5(open(os.path.join(res, n), "rb").read()).hexdigest()
            by_hash.setdefault(h, []).append(n)
        text = open(md, encoding="utf-8").read()
        for names in by_hash.values():
            if len(names) < 2:
                continue
            keep = max(names, key=len)          # el nombre local descriptivo
            for n in names:
                if n == keep:
                    continue
                text = text.replace(f"recursos/{n}", f"recursos/{keep}")
                os.remove(os.path.join(res, n))
        # borrar imagenes repetidas seguidas tras la fusion
        text = re.sub(r"(!\[[^\]]*\]\(recursos/([^)]+)\))\n\n\1", r"\1", text)
        text = re.sub(r"^recursos: \d+$",
                      "recursos: %d" % len(os.listdir(res)), text, count=1, flags=re.M)
        open(md, "w", encoding="utf-8").write(text)


def main(apply=False):
    posts = parse_llms()
    live = ["bandeja-de-goteo-para-maquinas-vending", "bomba-dosificadora-para-produccion-de-bioetanol",
            "escaner-3d-en-la-modificacion-de-moldes", "hmi-personalizado",
            "repotenciacion-de-impresora-3d-ender-3",
            "soporte-de-motor-batidor-produccion-bajo-demanda-y-mayor-resistencia", "repotenciacion"]
    # mapear slug viejo -> slug nuevo
    alias = {"repotenciacion-de-impresoras-3d-ender-3": "repotenciacion-de-impresora-3d-ender-3",
             "soporte-de-motor-batidor": "soporte-de-motor-batidor-produccion-bajo-demanda-y-mayor-resistencia",
             "el-caso-de-la-bomba-dosificadora-para-produccion-de-bioetanol":
                 "bomba-dosificadora-para-produccion-de-bioetanol"}

    files = index_uploads()
    df = {}
    for f in files:
        for t in tokens(os.path.splitext(os.path.basename(f))[0]):
            df[t] = df.get(t, 0) + 1

    report = []
    for i, post in enumerate(posts, 1):
        newslug = alias.get(post["slug"], post["slug"])
        folder = os.path.join(OUT, f"{i:02d}-{slugify(post['title'])}")
        media = match_media(post, files, df)
        has_live = newslug in live
        report.append((folder, post, newslug if has_live else None, media))

    if not apply:
        for folder, post, newslug, media in report:
            print(f"\n{os.path.basename(folder)}\n  titulo : {post['title'][:80]}")
            print(f"  fuente : {'sitio actual /blog/' + newslug if newslug else 'llms.txt (extracto)'}")
            print(f"  media  : {len(media)}")
            for m in media[:6]:
                print("           -", os.path.basename(m))
        return

    os.makedirs(OUT, exist_ok=True)
    index_rows = []
    for folder, post, newslug, media in report:
        res = os.path.join(folder, "recursos")
        os.makedirs(res, exist_ok=True)
        body, imgs, meta, source = [], [], {}, post["url"]
        if newslug:
            try:
                source, body, imgs, meta = scrape_article(newslug)
            except Exception as e:                                   # noqa: BLE001
                print("  ! error al descargar", newslug, e)
        copied = []
        for src in media:
            dst = os.path.join(res, os.path.basename(src))
            if not os.path.exists(dst):
                shutil.copy2(src, dst)
            copied.append(os.path.basename(dst))
        # imagenes incrustadas en el articulo: primero se buscan en el backup local,
        # porque el sitio nuevo aun apunta a URLs de wp-content que hoy dan 404
        img_names = []
        for n, (src, alt) in enumerate(imgs, 1):
            local = resolve_local(src, files)
            if local:
                name = os.path.basename(local)
                dst = os.path.join(res, name)
                if not os.path.exists(dst):
                    shutil.copy2(local, dst)
                img_names.append((name, alt))
                if name in copied:
                    copied.remove(name)          # ya queda incrustada en el cuerpo
                continue
            ext = os.path.splitext(src.split("?")[0])[1] or ".jpg"
            name = f"{slugify(post['title'], 40)}-{n}{ext}"
            dst = os.path.join(res, name)
            try:
                if not os.path.exists(dst):
                    open(dst, "wb").write(fetch(src, binary=True))
                img_names.append((name, alt))
            except Exception as e:                                   # noqa: BLE001
                print("  ! img no recuperable:", os.path.basename(src), e)
                img_names.append((None, alt))
        # markdown
        fm = ["---", f"titulo: \"{post['title'].replace(chr(34), chr(39))}\"",
              f"slug: {post['slug']}", f"url_original: {post['url']}"]
        if meta.get("fecha"):
            fm.append(f"fecha: \"{meta['fecha']}\"")
        if meta.get("autor"):
            fm.append(f"autor: {meta['autor']}")
        if meta.get("etiquetas"):
            fm.append("etiquetas: [" + ", ".join(f'"{t}"' for t in meta["etiquetas"]) + "]")
        if meta.get("description"):
            fm.append(f"descripcion: \"{meta['description'].replace(chr(34), chr(39))}\"")
        fm.append(f"fuente_texto: {'sitio actual (' + source + ')' if newslug else 'llms.txt (solo extracto)'}")
        fm.append(f"recursos: {len(copied) + len(img_names)}")
        fm.append("---")
        md = ["\n".join(fm), ""]
        if body:
            txt = "\n\n".join(body)
            for n, (name, alt) in enumerate(img_names):
                if name:
                    txt = txt.replace(f"@@IMG:{n}@@", f"![{alt or post['title']}](recursos/{name})")
            txt = re.sub(r"@@IMG:\d+@@", "", txt)
            md.append(txt)
        else:
            md.append(f"# {post['title']}\n")
            md.append("> **Nota:** el texto completo de este articulo vivia en la base de datos del "
                      "WordPress original, que ya no esta disponible. Abajo queda el extracto "
                      "recuperado de `llms.txt` y todos los recursos graficos hallados en el backup.\n")
            md.append(post["excerpt"] or "_(sin extracto)_")
        if copied:
            md.append("\n## Recursos graficos del backup original\n")
            for c in copied:
                if c.lower().endswith(".mp4"):
                    md.append(f"- Video: [`{c}`](recursos/{c})")
                else:
                    md.append(f"![{os.path.splitext(c)[0]}](recursos/{c})")
        open(os.path.join(folder, "index.md"), "w", encoding="utf-8").write("\n".join(md).rstrip() + "\n")
        if not os.listdir(res):
            os.rmdir(res)
        index_rows.append((os.path.basename(folder), post["title"], post["url"],
                           "completo" if body else "extracto", len(copied) + len(img_names)))

    dedupe(OUT)
    idx = ["# Articulos exportados — CESGAR", "",
           f"Total: {len(index_rows)} articulos.", "",
           "| Carpeta | Titulo | Texto | Recursos |", "|---|---|---|---|"]
    for f, t, u, s, n in index_rows:
        idx.append(f"| [`{f}`]({f}/index.md) | [{t}]({u}) | {s} | {n} |")
    open(os.path.join(OUT, "INDICE.md"), "w", encoding="utf-8").write("\n".join(idx) + "\n")
    print(f"\nOK -> {OUT}  ({len(index_rows)} carpetas)")


if __name__ == "__main__":
    main(apply="--apply" in sys.argv)
