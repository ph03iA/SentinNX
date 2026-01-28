# SentinNX

Real-time NGINX anomaly detection and alert system.

## Architecture

```
JavaScript Watcher  ─────►  Python ML API  ─────►  Isolation Forest Model
    (Node.js)                (FastAPI)               (scikit-learn)
        │
        ▼
    Desktop Notifications + Email Alerts
```

## Setup

### 1. Clone Repository
```bash
git clone https://github.com/ph03iA/SentinNX.git
cd SentinNX
```

### 2. Install JavaScript Dependencies
```bash
npm install
```

### 3. Setup Python ML Backend
```bash
cd ml_backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 4. Configure Environment
Create `.env` file in root directory:
```
PREDICT_ONE_URL=http://127.0.0.1:8000/predict_one
NGINX_LOG_PATH=/var/log/nginx/access.log
SENTINNX_MAIL_ID=your_email@gmail.com
SENTINNX_MAIL_PASSWORD=your_app_password
RECEIVER_MAIL_ID=receiver@gmail.com
```

## Running

### Start ML Server
```bash
cd ml_backend
uvicorn api_server:app --reload
```

### Start Watcher
```bash
npm run watch
```

## API Endpoints

### POST /predict_one
Single log prediction.

Request:
```json
{
    "feature": {
        "status": 304,
        "size": 0,
        "method": 1,
        "path": 0,
        "user_agent": 54,
        "hour_of_day": 8
    }
}
```

Response:
```json
[{"anomaly": false}]
```

### POST /predict
Batch prediction for multiple logs.

## Data Processing

To train on custom logs:
```bash
node data/parse_logs.js nginx.log parsed_logs.json
node data/process_csv.js parsed_logs.json
```

## License

MIT
