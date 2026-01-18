# 本文件中包含了各种参数, 可以进行调整
# 其中以"#"开头的注释为说明该参数的使用方法

# 使用字体的文件名, 需要自己导入
# 此值为字符串, 代表相对main的相对路径
FONT_FILE= "resources/font.ttf"

# 使用底图的文件名, 需要自己导入
# 此值为字符串, 代表相对main的相对路径
BASEIMAGE_FILE = "resources/base.png"

# 文本框左上角坐标 (x, y), 同时适用于图片框
# 此值为一个二元组, 例如 (100, 150), 单位像素, 图片的左上角记为 (0, 0)
TEXT_BOX_TOPLEFT= (119, 450)

# 文本框右下角坐标 (x, y), 同时适用于图片框
# 此值为一个二元组, 例如 (100, 150), 单位像素, 图片的左上角记为 (0, 0)
IMAGE_BOX_BOTTOMRIGHT= (119+279, 450+175)

# 置顶图层的文件名, 需要自己导入
# 此值为字符串, 代表相对main的相对路径
BASE_OVERLAY_FILE = "resources/base_overlay.png"

# 是否启用底图的置顶图层, 用于表现遮挡
# 此值为布尔值, True 或 False
USE_BASE_OVERLAY= True

# 是否自动黏贴生成的图片(如果为否则保留图片在剪贴板, 可以手动黏贴)
# 此值为布尔值, True 或 False
AUTO_PASTE_IMAGE= True

# 生成图片后是否自动发送(模拟回车键输入), 只有开启自动黏贴才生效
# 此值为布尔值, True 或 False
AUTO_SEND_IMAGE= True