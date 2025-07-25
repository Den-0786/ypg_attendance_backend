# Production Deployment Checklist

## Pre-Deployment Checklist

### Security
- [ ] Change `SECRET_KEY` to a strong, unique value
- [ ] Set `DEBUG=False` in environment variables
- [ ] Configure `ALLOWED_HOSTS` with your domain(s)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure secure session settings
- [ ] Set up proper CORS origins

### Database
- [ ] Set up PostgreSQL database
- [ ] Configure `DATABASE_URL` environment variable
- [ ] Run database migrations: `python manage.py migrate`
- [ ] Create database backup strategy

### Environment Variables
- [ ] `SECRET_KEY` - Strong secret key
- [ ] `DEBUG=False` - Disable debug mode
- [ ] `ALLOWED_HOSTS` - Your domain names
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `CORS_ALLOWED_ORIGINS` - Frontend domain(s)
- [ ] `EMAIL_*` - Email configuration (optional)

### Static Files
- [ ] Run `python manage.py collectstatic --noinput`
- [ ] Configure static file serving (WhiteNoise/nginx)
- [ ] Set up CDN if needed

### User Management
- [ ] Create admin user: `python manage.py createsuperuser`
- [ ] Create executive credentials in Django admin
- [ ] Set up user roles and permissions

## Deployment Options

### Option 1: Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=your-app-name.herokuapp.com
git push heroku main
```

### Option 2: Railway
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

### Option 3: VPS/Server
```bash
# Use deployment script
chmod +x deploy.sh
./deploy.sh

# Or manually
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn ypg_backend.wsgi:application --bind 0.0.0.0:8000
```

### Option 4: Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or with Docker
docker build -t ypg-attendance .
docker run -p 8000:8000 ypg-attendance
```

## Post-Deployment Checklist

### Testing
- [ ] Test user login/logout
- [ ] Test meeting creation and management
- [ ] Test attendance submission
- [ ] Test apology submission
- [ ] Test records management (edit/delete)
- [ ] Test dashboard functionality
- [ ] Test responsive design on mobile

### Monitoring
- [ ] Set up error logging
- [ ] Monitor application performance
- [ ] Set up uptime monitoring
- [ ] Configure backup monitoring

### Security
- [ ] Test HTTPS redirect
- [ ] Verify security headers
- [ ] Test CSRF protection
- [ ] Verify session security

### Performance
- [ ] Optimize database queries
- [ ] Set up caching if needed
- [ ] Monitor response times
- [ ] Optimize static file delivery

## Maintenance

### Regular Tasks
- [ ] Monitor logs for errors
- [ ] Backup database regularly
- [ ] Update dependencies
- [ ] Monitor security updates
- [ ] Check application performance

### Updates
- [ ] Test updates in staging environment
- [ ] Backup before updates
- [ ] Deploy during low-traffic periods
- [ ] Monitor after updates

## Troubleshooting

### Common Issues
1. **Database Connection**: Check `DATABASE_URL` and network connectivity
2. **Static Files**: Ensure `collectstatic` was run and files are served
3. **CORS Errors**: Verify `CORS_ALLOWED_ORIGINS` includes frontend domain
4. **Authentication**: Check session configuration and HTTPS settings
5. **Performance**: Monitor database queries and server resources

### Logs
- Check Django logs: `tail -f logs/django.log`
- Check server logs: `heroku logs --tail` (Heroku)
- Check application logs in deployment platform

## Support

For issues and questions:
1. Check the logs for error messages
2. Review the README.md for setup instructions
3. Check the API documentation
4. Contact the development team 