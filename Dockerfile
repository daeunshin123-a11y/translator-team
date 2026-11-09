# 🏠 번역 교정 팀 사무실
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py 팀.py .
COPY static ./static
EXPOSE 8000
CMD ["python", "server.py"]
