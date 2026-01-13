import os
import base64
from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright

APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEMPLATES_DIR = os.path.join(APP_DIR, "templates")
STATIC_IMAGES_DIR = os.path.join(APP_DIR, "static", "images")

env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)

def _file_to_data_uri(path: str) -> str | None:
    if not path or not os.path.exists(path):
        return None
    ext = os.path.splitext(path)[1].lower()
    mime = "image/png" if ext == ".png" else "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/svg+xml"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"

def render_questionnaire_html(
    data: dict,
    *,
    version: str = "",
    status: str = "",
    submitted_at: str = "",
) -> str:
    template = env.get_template("questionnaire.html")

    top_logo_path = os.path.join(STATIC_IMAGES_DIR, "logotext.png")
    bottom_logo_path = os.path.join(STATIC_IMAGES_DIR, "logo.png")

    return template.render(
        data=data,
        version=version,
        status=status,
        submitted_at=submitted_at,
        top_logo_src=_file_to_data_uri(top_logo_path),
        bottom_logo_src=_file_to_data_uri(bottom_logo_path),
    )

def html_to_pdf_bytes(html: str) -> bytes:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.set_content(html, wait_until="load")

        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,

            # allow room for page number footer
            margin={"top": "12mm", "right": "12mm", "bottom": "18mm", "left": "12mm"},

            display_header_footer=True,
            header_template="<div></div>",
            footer_template="""
              <div style="font-size:10px; width:100%; padding:0 12mm; box-sizing:border-box;">
                <div style="float:right; color:#555;">
                  Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
              </div>
            """,
        )

        browser.close()
        return pdf_bytes
