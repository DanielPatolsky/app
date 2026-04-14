#!/usr/bin/env python
import sys
sys.path.insert(0, '.')
try:
    from app.main import app
    print('✅ SUCCESS: app.main importado correctamente')
    print(f'✅ App name: {app.title}')
except Exception as e:
    print(f'❌ ERROR: {e}')
    import traceback
    traceback.print_exc()
