# ?룧 踰덉뿭 援먯젙 ? ?щТ??FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py ?.py ?쒗뿕吏.py ?쒗뿕??py .
COPY static ./static
EXPOSE 8000
CMD ["python", "server.py"]

