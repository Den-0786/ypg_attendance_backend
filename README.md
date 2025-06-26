# YPG Attendance App

A comprehensive church meeting attendance management system built with Django REST API backend and React/Next.js frontend.

## Features

- **User Authentication**: Secure login system with role-based access control
- **Meeting Management**: Set and manage meeting details with shared credentials
- **Attendance Tracking**: Record and manage attendance for local and district meetings
- **Apology Management**: Track and manage apology submissions
- **Dashboard Analytics**: Visual charts and statistics for attendance data
- **Records Management**: Full CRUD operations for attendance and apology records
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes

## Tech Stack

### Backend
- **Django 5.2.3**: Web framework
- **Django REST Framework**: API development
- **PostgreSQL**: Production database (SQLite for development)
- **Gunicorn**: WSGI server for production
- **WhiteNoise**: Static file serving

### Frontend
- **Next.js 15**: React framework
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **React Icons**: Icon library
- **React Hot Toast**: Notifications

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (for production)

### Development Setup

1. **Clone the repository**
```bash
   git clone <repository-url>
   cd ypg_attendance_app
   ```

2. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp env.example .env
   # Edit .env with your configuration
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   
   # Start development server
   python manage.py runserver
   ```

3. **Frontend Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

## Production Deployment

### Environment Variables

Create a `.env` file with the following variables:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://username:password@host:port/database_name

# CORS Settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Settings
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Deployment Options

#### Option 1: Heroku
1. Install Heroku CLI
2. Create Heroku app
3. Set environment variables
4. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set DEBUG=False
   git push heroku main
   ```

#### Option 2: Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically

#### Option 3: VPS/Server
1. Use the deployment script:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. Or manually:
   ```bash
   python manage.py collectstatic --noinput
   python manage.py migrate
   gunicorn ypg_backend.wsgi:application --bind 0.0.0.0:8000
   ```

## User Roles and Permissions

### Admin
- Full access to all features
- Can view, edit, and delete all records
- Can manage meetings
- Can create and manage user credentials

### Executive (President, Vice President, Secretary, Treasurer)
- Can set and manage meetings
- Can view all attendance and apology records
- Can edit and delete records

### Regular Users
- Can submit attendance and apologies
- Can view and edit their own records only
- Cannot manage meetings

## API Endpoints

### Authentication
- `POST /api/login/` - User login
- `POST /api/logout/` - User logout
- `GET /api/session-status/` - Check session status

### Attendance
- `POST /api/submit-attendance/` - Submit attendance records
- `GET /api/attendance-summary/` - Get attendance summary
- `GET /api/local-attendance/` - Get local attendance
- `GET /api/district-attendance/` - Get district attendance
- `PATCH /api/edit-attendance/<id>/` - Edit attendance record
- `DELETE /api/delete-attendance/<id>/` - Delete attendance record

### Apologies
- `POST /api/submit-apologies/` - Submit apology records
- `GET /api/apology-summary/` - Get apology summary
- `PATCH /api/edit-apology/<id>/` - Edit apology record
- `DELETE /api/delete-apology/<id>/` - Delete apology record

### Meetings
- `POST /api/set-meeting/` - Set new meeting
- `GET /api/current-meeting/` - Get current meeting
- `POST /api/deactivate-meeting/` - Deactivate current meeting

## Security Features

- **HTTPS Enforcement**: Automatic redirect to HTTPS in production
- **CSRF Protection**: Built-in CSRF protection
- **XSS Protection**: Security headers and input validation
- **Session Security**: Secure session configuration
- **Password Hashing**: Secure password storage
- **Role-based Access Control**: Granular permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
