# Use the smallest official Python image
FROM python:3-alpine

# Set the working directory
WORKDIR /app

# Copy only requirements file first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose port (if needed, adjust for your app)
EXPOSE 8080

# Command to run the application
CMD ["python", "main.py"]
