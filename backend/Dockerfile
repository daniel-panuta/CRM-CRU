FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Wait for DB, run migrations, and start app
CMD ["sh", "-c", "sleep 10 && python -m alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8080"] 