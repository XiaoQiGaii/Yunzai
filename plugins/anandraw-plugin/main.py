# main.py —— 无热键版，可命令行调用或被 import 使用
import sys
import io
import base64
import time
from PIL import Image
from config import (
    DELAY, FONT_FILE, BASEIMAGE_FILE, AUTO_SEND_IMAGE, AUTO_PASTE_IMAGE,
    BLOCK_HOTKEY, HOTKEY, SEND_HOTKEY, PASTE_HOTKEY, CUT_HOTKEY,
    SELECT_ALL_HOTKEY, TEXT_BOX_TOPLEFT, IMAGE_BOX_BOTTOMRIGHT,
    BASE_OVERLAY_FILE, USE_BASE_OVERLAY
)
from text_fit_draw import draw_text_auto
from image_fit_paste import paste_image_auto


def generate_image_from_text(text: str) -> bytes:
    """
    接收一段文字，生成素描本图片，返回 PNG 字节流。
    """
    if not text:
        raise ValueError("文字为空")

    png_bytes = draw_text_auto(
        image_source=BASEIMAGE_FILE,
        image_overlay=BASE_OVERLAY_FILE if USE_BASE_OVERLAY else None,
        top_left=TEXT_BOX_TOPLEFT,
        bottom_right=IMAGE_BOX_BOTTOMRIGHT,
        text=text,
        color=(0, 0, 0),
        max_font_height=64,
        font_path=FONT_FILE,
    )
    return png_bytes


def generate_image_from_pil(content_image: Image.Image) -> bytes:
    """
    接收一张 PIL.Image 对象，生成素描本图片，返回 PNG 字节流。
    """
    if not isinstance(content_image, Image.Image):
        raise TypeError("必须提供 PIL.Image.Image 实例")

    png_bytes = paste_image_auto(
        image_source=BASEIMAGE_FILE,
        image_overlay=BASE_OVERLAY_FILE if USE_BASE_OVERLAY else None,
        top_left=TEXT_BOX_TOPLEFT,
        bottom_right=IMAGE_BOX_BOTTOMRIGHT,
        content_image=content_image,
        align="center",
        valign="middle",
        padding=12,
        allow_upscale=True,
        keep_alpha=True,
    )
    return png_bytes


def main():
    """
    命令行调用接口：
    python main.py "安安写点什么"
    输出 base64 编码的 PNG 图片。
    """
    if len(sys.argv) < 2:
        print("Error: No text provided")
        sys.exit(1)

    text = sys.argv[1].strip()
    if not text:
        print("Error: Empty text")
        sys.exit(1)

    try:
        png_bytes = generate_image_from_text(text)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    # 输出 base64 给 Node 捕获
    print(base64.b64encode(png_bytes).decode())


if __name__ == "__main__":
    main()
