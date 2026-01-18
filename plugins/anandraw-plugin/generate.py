import sys, base64, io, os
from PIL import Image
from text_fit_draw import draw_text_auto
from image_fit_paste import paste_image_auto
from config import BASEIMAGE_FILE, BASE_OVERLAY_FILE, TEXT_BOX_TOPLEFT, IMAGE_BOX_BOTTOMRIGHT, FONT_FILE

def main():
    if len(sys.argv) < 2:
        print("Error: No arguments")
        sys.exit(1)

    # --- 图片模式 ---
    if sys.argv[1] == "--image":
        if len(sys.argv) < 3:
            print("Error: No image path")
            sys.exit(1)
        img_path = sys.argv[2]
        if not os.path.exists(img_path):
            print("Error: image file not found")
            sys.exit(1)
        try:
            img = Image.open(img_path).convert("RGBA")
            png_bytes = paste_image_auto(
                image_source=BASEIMAGE_FILE,
                image_overlay=BASE_OVERLAY_FILE,
                top_left=TEXT_BOX_TOPLEFT,
                bottom_right=IMAGE_BOX_BOTTOMRIGHT,
                content_image=img,
                align="center",
                valign="middle",
                padding=12,
                allow_upscale=True,
                keep_alpha=True
            )
            print(base64.b64encode(png_bytes).decode())
        except Exception as e:
            print(f"Error: {e}")
        return

    # --- 文字模式 ---
    text = sys.argv[1]
    try:
        png_bytes = draw_text_auto(
            image_source=BASEIMAGE_FILE,
            image_overlay=BASE_OVERLAY_FILE,
            top_left=TEXT_BOX_TOPLEFT,
            bottom_right=IMAGE_BOX_BOTTOMRIGHT,
            text=text,
            font_path=FONT_FILE,
            color=(0, 0, 0),
            max_font_height=64
        )
        print(base64.b64encode(png_bytes).decode())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
