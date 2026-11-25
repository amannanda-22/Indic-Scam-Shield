# Build from the repo root:  docker build -f ml/serve/Dockerfile -t scam-shield-ml .
FROM python:3.12-slim
WORKDIR /app
COPY ml/serve/requirements.txt ml/serve/requirements.txt
RUN pip install --no-cache-dir -r ml/serve/requirements.txt
COPY ml ml
COPY lib/data lib/data
# train inside the image so the pickle always matches the installed scikit-learn version
RUN python ml/build_corpus.py && python ml/train.py > /dev/null
EXPOSE 8000
CMD ["uvicorn", "app:app", "--app-dir", "ml/serve", "--host", "0.0.0.0", "--port", "8000"]
