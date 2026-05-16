import os
import subprocess
import tempfile


class OcrProvider:
    def extract_text(self, file_path: str) -> dict:
        raise NotImplementedError


class TesseractOcrProvider(OcrProvider):
    def extract_text(self, file_path: str) -> dict:
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        confidence = 0.0

        try:
            import pytesseract
            from PIL import Image

            if ext in (".png", ".jpg", ".jpeg"):
                img = Image.open(file_path)
                data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                text = " ".join(data["text"])
                confs = [int(c) for c in data["conf"] if c != "-1"]
                confidence = sum(confs) / len(confs) / 100.0 if confs else 0.0
            elif ext == ".pdf":
                from PIL import Image
                import tempfile

                try:
                    result = subprocess.run(
                        ["pdftoppm", "-png", "-r", "300", file_path],
                        capture_output=True,
                        timeout=30,
                    )
                    pages = result.stdout
                    if not pages:
                        return {"text": "", "confidence": 0.0, "error": "pdftoppm failed"}

                    all_text = []
                    total_conf = 0.0
                    count = 0

                    with tempfile.TemporaryDirectory() as tmpdir:
                        subprocess.run(
                            ["pdftoppm", "-png", "-r", "300", file_path, f"{tmpdir}/page"],
                            capture_output=True,
                            timeout=30,
                        )
                        for fname in sorted(os.listdir(tmpdir)):
                            if fname.endswith(".png"):
                                page_path = os.path.join(tmpdir, fname)
                                img = Image.open(page_path)
                                data = pytesseract.image_to_data(
                                    img, output_type=pytesseract.Output.DICT
                                )
                                page_text = " ".join(data["text"])
                                all_text.append(page_text)
                                confs = [int(c) for c in data["conf"] if c != "-1"]
                                if confs:
                                    total_conf += sum(confs) / len(confs) / 100.0
                                    count += 1

                    text = "\n".join(all_text)
                    confidence = total_conf / count if count else 0.0

                except (FileNotFoundError, subprocess.TimeoutExpired):
                    import pytesseract
                    from PIL import Image
                    import subprocess as sp

                    try:
                        result = sp.run(
                            ["pdftoppm", "-png", "-r", "300", file_path],
                            capture_output=True,
                            timeout=30,
                        )
                        pages_data = result.stdout
                        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
                            f.write(pages_data)
                            tmp_path = f.name
                        img = Image.open(tmp_path)
                        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                        text = " ".join(data["text"])
                        confs = [int(c) for c in data["conf"] if c != "-1"]
                        confidence = sum(confs) / len(confs) / 100.0 if confs else 0.0
                        os.unlink(tmp_path)
                    except Exception:
                        text = ""
                        confidence = 0.0

        except ImportError:
            text = ""
            confidence = 0.0
        except Exception as e:
            return {"text": "", "confidence": 0.0, "error": str(e)}

        return {
            "text": text.strip(),
            "confidence": round(confidence, 4),
        }


_provider = TesseractOcrProvider()


def perform_ocr(file_path: str) -> dict:
    if not os.path.exists(file_path):
        return {"text": "", "confidence": 0.0, "error": "File not found"}
    return _provider.extract_text(file_path)
