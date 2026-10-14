FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY petcloud ./petcloud
RUN pip install --no-cache-dir . && useradd --create-home petcloud
USER petcloud
EXPOSE 8000
CMD ["uvicorn", "petcloud.main:app", "--host", "0.0.0.0", "--port", "8000"]
