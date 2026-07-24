"""Cut rounded corners on LaunchPad icon and export extension sizes."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "LaunchPad_icon.png"
OUT_DIR = ROOT / "public"


def to_square(im: Image.Image) -> Image.Image:
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return im.crop((left, top, left + side, top + side))


def apply_rounded_mask(im: Image.Image, radius_ratio: float = 0.22) -> Image.Image:
    """Make corners transparent with smooth rounded-rect mask (squircle-ish)."""
    im = im.convert("RGBA")
    w, h = im.size
    radius = int(min(w, h) * radius_ratio)

    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)

    out = im.copy()
    out.putalpha(mask)
    return out


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    print("source:", src.size, src.mode)
    for p in [(0, 0), (src.width - 1, 0), (0, src.height - 1)]:
        print(" corner", p, src.getpixel(p))

    square = to_square(src)
    rounded = apply_rounded_mask(square, radius_ratio=0.22)

    # Master icon (transparent rounded corners)
    master_path = OUT_DIR / "LaunchPad_icon.png"
    rounded.save(master_path, "PNG")
    print("saved", master_path, rounded.size)

    # Extension / new-tab icons
    for size in (16, 32, 48, 128):
        icon = rounded.resize((size, size), Image.Resampling.LANCZOS)
        path = OUT_DIR / f"icon-{size}.png"
        icon.save(path, "PNG")
        print("saved", path)

    # Keep logo.png as primary (128) for backward-compatible references
    logo = rounded.resize((128, 128), Image.Resampling.LANCZOS)
    logo.save(OUT_DIR / "logo.png", "PNG")
    print("saved", OUT_DIR / "logo.png")


if __name__ == "__main__":
    main()
