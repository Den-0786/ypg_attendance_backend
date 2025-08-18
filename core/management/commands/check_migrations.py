from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Check migration status and database tables'

    def handle(self, *args, **options):
        self.stdout.write("Checking migration status...")
        
        try:
            with connection.cursor() as cursor:
                # Check if core_loginattempt table exists
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'core_loginattempt'
                    );
                """)
                loginattempt_exists = cursor.fetchone()[0]
                
                self.stdout.write(f"core_loginattempt table exists: {loginattempt_exists}")
                
                # Check if core_securitypin table exists
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'core_securitypin'
                    );
                """)
                securitypin_exists = cursor.fetchone()[0]
                
                self.stdout.write(f"core_securitypin table exists: {securitypin_exists}")
                
                # List all core_ tables
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name LIKE 'core_%'
                    ORDER BY table_name;
                """)
                core_tables = [row[0] for row in cursor.fetchall()]
                
                self.stdout.write(f"All core_ tables: {core_tables}")
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Database error: {str(e)}')
            )
