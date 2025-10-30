# VIN - Wine Collection Management System

A comprehensive full-stack application for managing wine collections with advanced features including inventory tracking, drinking window monitoring, and consumption recording. Built with FastAPI + SQLAlchemy + Pydantic backend and React + TypeScript + Tailwind CSS frontend.

## 🍷 Features

### **Wine Collection Management**
- **Add New Wines**: Complete wine entry form with validation
- **Search & Sort**: Advanced search by name/producer with sorting options
- **Collection Views**: Paginated wine collection with filtering
- **Wine Details**: Comprehensive wine information display

### **Drinking Window Monitoring**
- **Smart Filtering**: Automatic categorization by drinking window status
- **Ready to Drink**: Wines currently in optimal drinking window
- **Approaching Deadline**: Wines that should be consumed within 30 days
- **Not Ready**: Wines still maturing before peak

### **Inventory Management**
- **Quantity Tracking**: Real-time inventory updates
- **Consumption Recording**: Track wine consumption with optional tasting notes
- **Audit Trail**: Complete history of all inventory changes
- **Interactive Controls**: Easy quantity adjustments with + and - buttons

### **Advanced Wine Information**
- **Grape Composition**: Detailed breakdown with percentages
- **Geographic Origin**: Country, district, and subdistrict tracking
- **Drinking Windows**: Optimal consumption date ranges
- **External API Integration**: Drinking window suggestions from wine experts

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- macOS/Linux shell (examples use zsh)

### Backend Setup
```bash
cd /Users/geirowe/Documents/8090SoftwareFactory/vin
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run Backend Server (in the Terminal in cursor)
```bash
# Default port 8000
uvicorn app.main:app --reload --port 8000

# Alternative port if 8000 is in use
uvicorn app.main:app --reload --port 8001
```

### Frontend Setup & Run (in a separate Terminal window)
```bash
cd frontend
npm install
npm run dev
```

This starts the frontend on `http://localhost:5173`.

### To stop servers
Ctrl+C in each terminal. If a previous background server is stuck, free port 8000:
```bash
lsof -ti tcp:8000 | xargs kill -9
```

## 📱 User Interface

### **Main Navigation**
- **Collection**: Main wine collection with search and sort
- **Drinking Window**: Monitor wines by drinking window status
- **Add Wine**: Create new wine entries

### **Collection View Features**
- **Search Bar**: Search by wine name or producer
- **Sort Options**: Sort by ID, Name, Producer, Vintage, or Type
- **Sort Order**: Ascending or Descending
- **Clickable Cards**: Click any wine to view detailed information

### **Drinking Window Monitor**
- **Filter Tabs**: Switch between Ready, Approaching, and Not Ready wines
- **Visual Indicators**: Emojis and descriptions for each status
- **Empty States**: Helpful messages when no wines match filters

### **Wine Detail View**
- **Complete Information**: All wine details in organized sections
- **Inventory Controls**: Adjust quantity with + and - buttons
- **Consumption Recording**: Record wine consumption with tasting notes
- **History Tracking**: View complete audit trail of changes

## 🗄️ Database

- **Default**: SQLite file `vin.db` in project root
- **Override**: Set `DATABASE_URL` environment variable for PostgreSQL/other databases

### **Data Models**
- **Wine**: Core wine information with relationships
- **GrapeComposition**: Grape variety and percentage breakdown
- **InventoryLog**: Complete audit trail of quantity changes
- **TastingNote**: Wine consumption and tasting records

## 🔧 Environment Configuration

Copy and configure environment variables:
```bash
cp ENVIRONMENT.example .env
```

### **Available Variables**
- `DATABASE_URL` (optional): Custom database connection string
- `EXTERNAL_WINE_API_BASE_URL` (optional): External wine API base URL
- `EXTERNAL_WINE_API_KEY` (optional): API key for external wine suggestions

## 🌐 API Endpoints

Base URL: `http://localhost:8000` (or `8001` if using alternative port)

### **Core Endpoints**
- `GET /` → Service banner
- `GET /health` → Health check status

### **Wine Management**
- `GET /api/wines` → List all wines with grape compositions
- `GET /api/wines/page` → Paginated wines with search, sort, and filter options
- `POST /api/wines` → Create new wine entry
- `GET /api/wines/{id}` → Get specific wine details
- `PATCH /api/wines/{id}/quantity` → Update wine quantity
- `POST /api/wines/{id}/consume` → Record wine consumption

### **Advanced Features**
- `GET /api/wines/drinking-window-suggestions` → Get drinking window suggestions
- `GET /api/wines/{id}/inventory-log` → Get inventory change history

### **Query Parameters**
- **Search**: `search_term` - Search by wine name or producer
- **Sort**: `sort_by` (id|name|producer|vintage|type), `sort_order` (asc|desc)
- **Filter**: `wine_type`, `vintage`, `country`, `district`, `subdistrict`
- **Drinking Window**: `drinking_window_status` (ready_to_drink|approaching_deadline|not_ready)
- **Pagination**: `page`, `page_size`

## 📋 Example API Usage

### Create a Wine Entry
```bash
curl -X POST http://localhost:8000/api/wines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Domaine de la Côte",
    "type": "Red",
    "producer": "Sandhi Wines",
    "vintage": 2018,
    "country": "USA",
    "district": "Santa Rita Hills",
    "subdistrict": "Sta. Rita Hills",
    "purchase_price": 65.00,
    "quantity": 12,
    "drink_after_date": "2024-01-01",
    "drink_before_date": "2030-12-31",
    "grape_composition": [
      { "grape_variety": "Pinot Noir", "percentage": 100 }
    ]
  }'
```

### Search and Filter Wines
```bash
# Search by name
curl "http://localhost:8000/api/wines/page?search_term=Domaine&sort_by=name&sort_order=asc"

# Filter by drinking window
curl "http://localhost:8000/api/wines?drinking_window_status=ready_to_drink"

# Filter by wine type and vintage
curl "http://localhost:8000/api/wines/page?wine_type=Red&vintage=2018"
```

### Update Wine Quantity
```bash
curl -X PATCH http://localhost:8000/api/wines/1/quantity \
  -H "Content-Type: application/json" \
  -d '{"quantity_change": 2}'
```

### Record Wine Consumption
```bash
curl -X POST http://localhost:8000/api/wines/1/consume \
  -H "Content-Type: application/json" \
  -d '{
    "tasting_note": {
      "rating": 9,
      "notes": "Excellent complexity, ready to drink now"
    }
  }'
```

## 🔍 Troubleshooting

### **Backend Issues**
- **Address already in use**: Use `--port 8001` or kill existing process
- **ModuleNotFoundError: httpx**: Ensure virtual environment is active and run `pip install -r requirements.txt`
- **Database errors**: Check database permissions and connection string

### **Frontend Issues**
- **CORS errors**: Backend enables CORS for `http://localhost:5173`
- **API connection**: Ensure backend is running on correct port
- **Build errors**: Run `npm install` in frontend directory

### **Common Commands**
```bash
# Kill process on port 8000
lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9

# Restart backend
uvicorn app.main:app --reload --port 8001

# Clear and reinstall frontend dependencies
cd frontend && rm -rf node_modules package-lock.json && npm install
```

## 🏗️ Tech Stack

### **Backend**
- **FastAPI**: Modern Python web framework
- **SQLAlchemy 2.x**: ORM with async support
- **Pydantic v2**: Data validation and serialization
- **httpx**: Async HTTP client for external APIs

### **Frontend**
- **React 18**: Modern React with hooks
- **Vite 7**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components

## 📁 Project Structure

```
vin/
├── app/                          # Backend application
│   ├── api/endpoints/wines.py    # Wine API endpoints
│   ├── core/config.py            # Configuration management
│   ├── database.py               # Database setup
│   ├── main.py                   # FastAPI application
│   ├── models.py                 # SQLAlchemy models
│   ├── schemas.py                # Pydantic schemas
│   └── services/                 # External service integrations
├── frontend/                     # Frontend application
│   └── src/
│       ├── components/           # React components
│       │   ├── ui/               # Reusable UI components
│       │   ├── WineEntryForm.tsx # Wine creation form
│       │   ├── WineCollectionListView.tsx # Collection display
│       │   ├── DrinkingWindowMonitoringView.tsx # Drinking window monitor
│       │   ├── WineDetailView.tsx # Wine details
│       │   ├── InventoryTrackingSystemView.tsx # Inventory management
│       │   └── ConsumptionRecording.tsx # Consumption tracking
│       ├── hooks/useApi.ts       # API integration hook
│       ├── types/                # TypeScript type definitions
│       ├── App.tsx               # Main application component
│       └── main.tsx              # Application entry point
├── requirements.txt              # Python dependencies
├── ENVIRONMENT.example           # Environment variables template
└── README.md                     # This file
```

## 🎯 Key Features Implemented

### **Work Orders Completed**
- **Work Order #1**: Wine Details Input Component
- **Work Order #2**: Wine Entry API Endpoint
- **Work Order #3**: Extended API for Drinking Window Fields
- **Work Order #4**: Pricing and Quantity Input Component
- **Work Order #6**: Wine Collection List API with Pagination
- **Work Order #7**: Drinking Window Input Component
- **Work Order #10**: Grape Composition Input Component
- **Work Order #12**: Wine Collection List View
- **Work Order #13**: Main Wine Entry Form
- **Work Order #14**: Wine Entry Display Card
- **Work Order #15**: Add New Wine Button
- **Work Order #16**: Wine Detail View
- **Work Order #17**: Wine Information Display
- **Work Order #18**: Inventory Update Controls
- **Work Order #19**: Wine Detail API Endpoint
- **Work Order #22**: Drinking Window Monitoring UI
- **Work Order #23**: ReadyToDrinkFilterView Component
- **Work Order #24**: ApproachingDeadlineFilterView Component
- **Work Order #28**: Inventory Tracking API
- **Work Order #29**: Inventory Tracking System View
- **Work Order #30**: Wine Consumption Recording API
- **Work Order #31**: Quantity Adjustment Controls
- **Work Order #33**: Consumption Recording Component

## 📄 License

Internal project - add appropriate license as needed.

---

**🍷 VIN - Your comprehensive wine collection management system**