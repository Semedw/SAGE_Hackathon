import os


def analyze_image_quality(file_path: str) -> dict:
    result = {"score": 1.0, "is_blurry": False, "resolution_ok": True, "issues": []}

    if not os.path.exists(file_path):
        result["issues"].append("File not found")
        result["score"] = 0.0
        return result

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in (".png", ".jpg", ".jpeg"):
        result["score"] = 1.0
        return result

    try:
        import cv2
        import numpy as np

        img = cv2.imread(file_path)
        if img is None:
            result["issues"].append("Could not read image")
            result["score"] = 0.5
            return result

        height, width = img.shape[:2]
        resolution = width * height

        if resolution < 500 * 500:
            result["resolution_ok"] = False
            result["issues"].append("Low resolution image")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        if laplacian_var < 50:
            result["is_blurry"] = True
            result["issues"].append("Blurry image detected")

        dim_score = min(1.0, resolution / (2000 * 2000))
        blur_score = min(1.0, laplacian_var / 200.0)
        result["score"] = round((dim_score * 0.4 + blur_score * 0.6), 4)

    except ImportError:
        result["score"] = 0.8

    return result
