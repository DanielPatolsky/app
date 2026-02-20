#!/usr/bin/env python3
import requests
import sys
from datetime import datetime, timedelta
import uuid
import json

class GymManagerAPITester:
    def __init__(self, base_url="https://gym-admin-lite.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_socio_id = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   📄 Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"   ❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   📄 Error: {json.dumps(error_detail, indent=2)}")
                except:
                    print(f"   📄 Error: {response.text}")
                return False, {}
                
        except requests.exceptions.Timeout:
            print(f"   ❌ Failed - Request timed out")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"   ❌ Failed - Error: {str(e)}")
            return False, {}
    
    def test_register(self):
        """Test user registration"""
        data = {
            "email": self.test_user_email,
            "password": "TestPass123!",
            "nombre": "Test User"
        }
        success, response = self.run_test(
            "User Registration",
            "POST", 
            "auth/register",
            200,
            data,
            auth_required=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   🔑 Token obtained: {self.token[:20]}...")
            return True
        return False
    
    def test_login(self):
        """Test user login"""
        data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login", 
            200,
            data,
            auth_required=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   🔑 Login token: {self.token[:20]}...")
            return True
        return False
    
    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success and 'email' in response
    
    def test_create_socio(self):
        """Test creating a new socio"""
        data = {
            "nombre": "Juan Pérez Test",
            "email": "juan.test@email.com",
            "telefono": "+54911234567",
            "direccion": "Test Address 123"
        }
        success, response = self.run_test(
            "Create Socio",
            "POST",
            "socios",
            200,
            data
        )
        
        if success and 'socio_id' in response:
            self.test_socio_id = response['socio_id']
            print(f"   👤 Socio created with ID: {self.test_socio_id}")
            # Verify auto-generated ID format
            if response['socio_id'].startswith('GYM-') and response['estado'] == 'vencido':
                print(f"   ✅ Auto-generated ID format correct: {response['socio_id']}")
                print(f"   ✅ Default state 'vencido' correct: {response['estado']}")
                return True
        return False
    
    def test_list_socios(self):
        """Test listing socios"""
        success, response = self.run_test(
            "List Socios",
            "GET",
            "socios",
            200
        )
        return success and isinstance(response, list)
    
    def test_get_socio(self):
        """Test getting specific socio"""
        if not self.test_socio_id:
            print("   ⚠️ Skipping - No test socio ID available")
            return True
            
        success, response = self.run_test(
            "Get Specific Socio",
            "GET",
            f"socios/{self.test_socio_id}",
            200
        )
        return success and response.get('socio_id') == self.test_socio_id
    
    def test_update_socio(self):
        """Test updating socio"""
        if not self.test_socio_id:
            print("   ⚠️ Skipping - No test socio ID available")
            return True
            
        data = {
            "nombre": "Juan Pérez Updated",
            "email": "juan.updated@email.com",
            "telefono": "+54911234567",
            "direccion": "Updated Address 456"
        }
        success, response = self.run_test(
            "Update Socio",
            "PUT",
            f"socios/{self.test_socio_id}",
            200,
            data
        )
        return success and response.get('nombre') == "Juan Pérez Updated"
    
    def test_register_pago(self):
        """Test registering payment"""
        if not self.test_socio_id:
            print("   ⚠️ Skipping - No test socio ID available")
            return True
            
        data = {
            "socio_id": self.test_socio_id,
            "monto": 2500.00,
            "tipo_plan": "mensual",
            "metodo_pago": "Efectivo"
        }
        success, response = self.run_test(
            "Register Payment",
            "POST",
            "pagos",
            200,
            data
        )
        
        if success:
            # Verify automatic expiration calculation (mensual = 30 days)
            fecha_pago = datetime.fromisoformat(response['fecha_pago'].replace('Z', '+00:00'))
            fecha_venc = datetime.fromisoformat(response['fecha_vencimiento'].replace('Z', '+00:00'))
            days_diff = (fecha_venc - fecha_pago).days
            
            if days_diff == 30:
                print(f"   ✅ Automatic expiration calculation correct: {days_diff} days")
                return True
            else:
                print(f"   ❌ Expiration calculation wrong: {days_diff} days (expected 30)")
        return False
    
    def test_list_pagos(self):
        """Test listing payments"""
        success, response = self.run_test(
            "List Payments",
            "GET",
            "pagos",
            200
        )
        return success and isinstance(response, list)
    
    def test_get_pagos_socio(self):
        """Test getting payments by socio"""
        if not self.test_socio_id:
            print("   ⚠️ Skipping - No test socio ID available")
            return True
            
        success, response = self.run_test(
            "Get Socio Payments",
            "GET",
            f"pagos/socio/{self.test_socio_id}",
            200
        )
        return success and isinstance(response, list)
    
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            required_fields = ['total_socios', 'socios_activos', 'socios_vencidos', 
                             'ingresos_mes', 'proximos_vencimientos']
            all_fields_present = all(field in response for field in required_fields)
            
            if all_fields_present:
                print(f"   ✅ All dashboard fields present")
                print(f"   📊 Stats: Total={response['total_socios']}, Active={response['socios_activos']}, Expired={response['socios_vencidos']}")
                return True
            else:
                missing = [f for f in required_fields if f not in response]
                print(f"   ❌ Missing fields: {missing}")
        return False
    
    def test_socio_status_update(self):
        """Test that socio status updates after payment"""
        if not self.test_socio_id:
            print("   ⚠️ Skipping - No test socio ID available")
            return True
            
        # Get socio status after payment
        success, response = self.run_test(
            "Check Socio Status After Payment",
            "GET",
            f"socios/{self.test_socio_id}",
            200
        )
        
        if success and response.get('estado') == 'activo':
            print(f"   ✅ Socio status correctly updated to 'activo'")
            return True
        elif success:
            print(f"   ❌ Socio status is '{response.get('estado')}', expected 'activo'")
        return False
    
    def test_delete_socio(self):
        """Test deleting socio (should also delete payments)"""
        if not self.test_socio_id:
            print("   ⚠️ Skipping - No test socio ID available")
            return True
            
        success, response = self.run_test(
            "Delete Socio",
            "DELETE",
            f"socios/{self.test_socio_id}",
            200
        )
        
        if success:
            # Verify socio was deleted
            success2, _ = self.run_test(
                "Verify Socio Deleted",
                "GET",
                f"socios/{self.test_socio_id}",
                404
            )
            return success2
        return False

def main():
    """Main test execution"""
    print("🚀 Starting Gym Manager API Tests")
    print("=" * 50)
    
    tester = GymManagerAPITester()
    
    # Test sequence
    test_sequence = [
        tester.test_register,
        tester.test_login,
        tester.test_auth_me,
        tester.test_create_socio,
        tester.test_list_socios,
        tester.test_get_socio,
        tester.test_update_socio,
        tester.test_register_pago,
        tester.test_socio_status_update,
        tester.test_list_pagos,
        tester.test_get_pagos_socio,
        tester.test_dashboard_stats,
        tester.test_delete_socio
    ]
    
    # Execute all tests
    for test_func in test_sequence:
        try:
            result = test_func()
            if not result:
                print(f"   ⚠️ Test '{test_func.__name__}' failed but continuing...")
        except Exception as e:
            print(f"   💥 Test '{test_func.__name__}' crashed: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend API testing completed successfully!")
        return 0
    else:
        print("⚠️ Some backend issues detected. See details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())