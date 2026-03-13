import requests

def test_upload():
    url = "http://127.0.0.1:8000/complaints"
    files = {'file': ('test.png', b'not-a-real-image', 'image/png')}
    data = {
        'description': 'Test complaint from script',
        'location': '13.0, 80.0',
        'user_id': 1
    }
    
    try:
        r = requests.post(url, data=data, files=files)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_upload()
